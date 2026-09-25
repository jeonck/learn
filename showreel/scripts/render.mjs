// 프레임 캡처 → ffmpeg 인코딩
//   node scripts/render.mjs                       전체 렌더 → out/video.mp4
//   node scripts/render.mjs --stills 1.2,3.9      특정 시점 스틸 → out/stills/*.png
//   옵션: --dir 스틸폴더  --workers N  --samples N  --from F  --to F  --out 경로
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/timeline.json'), 'utf8'));

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
    return acc;
  }, [])
);
const WORKERS = Number(args.workers || Math.max(1, Math.min(4, (await import('node:os')).cpus().length)));
const SAMPLES = Number(args.samples || TL.samples);
const TOTAL = Math.round(TL.duration * TL.fps);
const FROM = Number(args.from || 0);
const TO = Number(args.to || TOTAL);
const OUT = path.resolve(ROOT, args.out || 'out/video.mp4');

export function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const py = spawnSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']);
  if (py.status === 0) return py.stdout.toString().trim();
  throw new Error('ffmpeg를 찾을 수 없습니다. FFMPEG 환경변수를 지정하거나 `pip install imageio-ffmpeg` 하세요.');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wav': 'audio/wav',
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: TL.width, height: TL.height } });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(`http://127.0.0.1:${port}/src/index.html?mode=render`);
  await page.waitForFunction(() => window.REEL_READY || window.REEL_ERROR, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.REEL_ERROR);
  if (err) throw new Error(err);
  return page;
}

const grab = (page, f) =>
  page
    .evaluate(([f, s]) => window.renderFrame(f, s), [f, SAMPLES])
    .then((url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));

const server = await serve();
const port = server.address().port;
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

try {
  if (args.stills) {
    const page = await openPage(browser, port);
    const dir = path.resolve(ROOT, args.dir || 'out/stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const s of String(args.stills).split(',')) {
      const f = Math.round(parseFloat(s) * TL.fps);
      const file = path.join(dir, `f${String(f).padStart(4, '0')}.png`);
      fs.writeFileSync(file, await grab(page, f));
      console.log(file);
    }
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const ff = spawn(
      findFfmpeg(),
      [
        '-y', '-loglevel', 'error',
        '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'png', '-i', '-',
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-tune', 'animation',
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-movflags', '+faststart',
        OUT,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] }
    );
    const done = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg exit ${c}`)))));

    const pages = await Promise.all(Array.from({ length: WORKERS }, () => openPage(browser, port)));
    const ready = new Map();
    let next = FROM;
    let written = FROM;
    const t0 = Date.now();
    const flush = async () => {
      while (ready.has(written)) {
        const buf = ready.get(written);
        ready.delete(written);
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        written++;
        if (written % 30 === 0 || written === TO) {
          const el = (Date.now() - t0) / 1000;
          const fps = (written - FROM) / el;
          process.stdout.write(
            `\r프레임 ${written}/${TO}  ${fps.toFixed(1)} fps  남은 시간 ~${((TO - written) / fps).toFixed(0)}s   `
          );
        }
      }
    };
    let flushing = Promise.resolve();
    await Promise.all(
      pages.map(async (page) => {
        while (next < TO) {
          const f = next++;
          while (ready.size > WORKERS * 6) await new Promise((r) => setTimeout(r, 20));
          ready.set(f, await grab(page, f));
          flushing = flushing.then(flush);
        }
      })
    );
    await flushing;
    ff.stdin.end();
    await done;
    console.log(`\n완료 → ${path.relative(ROOT, OUT)}`);
  }
} finally {
  await browser.close();
  server.close();
}

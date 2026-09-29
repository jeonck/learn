# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- `showreel/` — a 15-second motion-graphics showreel (1920×1080, 60fps) generated entirely from
  code: visuals in Canvas 2D + a WebGL post pass, soundtrack synthesized in numpy. Two content
  variants share one engine: Korean (`src/content.json` → `dist/showreel.mp4`) and an English career
  reel for CK Jeon (`src/content.en.json` → `dist/showreel-en.mp4`).

## Commands (run inside `showreel/`)

- Install: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` and `pip install numpy imageio-ffmpeg`
  (imageio-ffmpeg is only needed when no system `ffmpeg` exists; `FFMPEG=/path` overrides).
- Draft build (audio → 960×540·30fps·1 sub-frame, one encode with audio → `out/draft.mp4`):
  `npm run draft` (~1 min on 4 cores). Iterate with this; run the final build once at the end.
- Final build (1080p60·6 sub-frames·CRF 21, one encode with audio → `dist/showreel.mp4`):
  `npm run build` (~12 min on 4 cores).
- Soundtrack only: `npm run audio` → `out/audio.wav`.
- Another content variant: add `--content content.en.json` to `build.sh`/`npm run draft --`/`npm run build --`
  or `render.mjs` (file lives in `src/`); outputs get a `-en` suffix and `audio.py --content` uses its typing cues.
- One scene only: `node scripts/render.mjs --scene <id> [--draft] --audio out/audio.wav`
  (ids from `timeline.json` `scenes`; ~20 s draft, ~1 min final). Other flags: `--scale`, `--fps`,
  `--samples`, `--crf`, `--preset`, `--from/--to` (frames at the output fps), `--workers`, `--out`.
- Spot-check frames instead of a full render (the equivalent of "running a single test"):
  `node scripts/render.mjs --stills 4.2,9.1 [--draft] [--dir out/stills-x]`, or
  `bash scripts/sheet.sh <name> 2x2 4.2,9.1,11,14 --draft` for a tiled contact sheet at `out/sheet-<name>.png`.
  Prefer `--draft` stills while iterating: faster, and smaller images to inspect.
- Live preview in a browser: `npm run preview` (append `?t=7.5` to render one frame).

There is no linter or test suite; verification is visual (stills/contact sheets) and, for audio,
via spectrogram/RMS inspection.

## Architecture

- `src/timeline.json` is the single source of truth for timing: BPM (128, so 32 beats = 15s),
  scene start beats, and cues (impacts, per-character typing, whooshes, risers, glitches, the
  silent gap). Both `src/reel.js` (visuals) and `scripts/audio.py` (sound) read it, which is what
  keeps every sound sample-aligned with its visual event. Change timing here, not in either consumer.
- `src/reel.js` renders a frame as a **pure function of time `t`** — no state carries between
  frames. This is load-bearing: `render.mjs` renders frames out of order across several
  Chromium pages, and each output frame averages several sub-frame renders across a 180° shutter
  for real motion blur. Any per-frame state (accumulators, `Math.random()`) would break both;
  use the seeded `rng()`/`hash()`/`noise1()` helpers instead.
- Scenes are functions `sceneX(ctx, localTime, t)` composed in `drawScene`; transitions
  (slice wipe, whip pan) draw both neighbouring scenes. Camera shake and the HUD are applied in
  `drawFrame`; `fx(t)` produces the per-frame uniforms for the WebGL pass in `src/post.js`.
- Timings inside scenes are expressed in beats via `b(n)` so edits stay on the grid.
- `src/content.json` holds everything that is content rather than motion: the 5-colour palette (keys are
  role slots — `ink`, `paper`, `coral`, `acid`, `cobalt` — referenced by name throughout `reel.js`), all
  on-screen text, the data-scene stats, and chart values. `applyContent()` in `reel.js` loads it at boot.
  For a new video, edit this file before touching `reel.js`. Optional keys let a variant override the
  typing cues and scene titles (both also read by `audio.py`), the band highlight range, the end-card
  English line's typing window, and the chart's per-point labels / numeric axis. Longer words are
  auto-fitted in the montage. Every claim in `content.en.json` must come from the resume; contact
  details stay out because the repo is public.
- Scene code is written in 1920×1080 logical pixels. `?scale=` (render.mjs `--scale`/`--draft`) shrinks
  the canvases and `prep()` applies the scale as a transform; pixel-sized post effects (`ca`, `dir`) are
  scaled in `frameAt`. Any new code that addresses canvas pixels directly (e.g. `drawImage` source rects)
  must multiply by `SCALE`.
- Output is not bit-exact between runs: SwiftShader accumulation differs by at most 1/255 on a few
  hundred pixels. Compare renders with a tolerance, not a hash.
- `node_modules/` and `out/` are git-ignored; only sources, `README.md`/`README.en.md`, and the deliverables in `dist/` (the MP4, its
  poster and contact sheet, and the `tech-stack.png` pipeline diagram) are committed.
- `showreel/prompt/` is a prompt showcase (docs only, no code): one reproducible demo per showreel style
  collected from Threads, indexed by `README.md`/`README.en.md`. Demo prompts are rewritten from the originals,
  not copied, with a link to the source post and its video.

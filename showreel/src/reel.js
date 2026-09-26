// 15초 모션그래픽 쇼릴 — 렌더 엔진
// 모든 프레임은 시간 t(초)의 순수 함수다. 상태가 없으므로 어떤 프레임이든
// 순서와 무관하게, 여러 워커에서 병렬로, 서브프레임 단위로 다시 그릴 수 있다.
(() => {
  'use strict';

  let TL, W, H, FPS, BEAT;
  let SCALE = 1; // 출력 해상도 배율. 좌표는 항상 1920×1080 기준으로 쓰고 prep()에서 줄인다
  const b = (n) => n * BEAT;
  const TAU = Math.PI * 2;

  // ───────────────────────── palette & type
  // 팔레트·문구·수치는 src/content.json 에서 읽는다 (applyContent)
  let C, T, RGB, flyB, BARS, LINE, TAGS;
  const F = {
    display: '"Black Han Sans"',
    sans: '"Pretendard Variable"',
    mono: '"JetBrains Mono", "Pretendard Variable"',
  };

  // ───────────────────────── math
  const clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
  const lerp = (a, c, t) => a + (c - a) * t;
  const inv = (a, c, x) => clamp((x - a) / (c - a));
  const E = {
    outCubic: (x) => 1 - (1 - x) ** 3,
    inCubic: (x) => x ** 3,
    inOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
    outQuart: (x) => 1 - (1 - x) ** 4,
    outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
    inExpo: (x) => (x <= 0 ? 0 : 2 ** (10 * x - 10)),
    inOutExpo: (x) =>
      x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2,
    outBack: (x, s = 1.70158) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2,
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  };
  // 감쇠 스프링의 계단 응답. t는 초 단위, f는 진동수(Hz), z는 감쇠비.
  function spring(t, f = 2.2, z = 0.38) {
    if (t <= 0) return 0;
    const w = TAU * f;
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise1 = (x, seed = 0) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return lerp(hash(i + seed * 57.31), hash(i + 1 + seed * 57.31), u) * 2 - 1;
  };
  const env = (t, t0, decay) => (t < t0 ? 0 : Math.exp(-(t - t0) / decay));
  const bell = (t, a, m, c) =>
    t <= a || t >= c ? 0 : t < m ? E.inOutSine(inv(a, m, t)) : 1 - E.inOutSine(inv(m, c, t));
  // from~to 구간에서 (BEAT/div)마다 1로 튀었다가 감쇠하는 펄스
  function beatPulse(t, from, to, decay = 0.12, div = 1) {
    if (t < from) return 0;
    const step = BEAT / div;
    const k = Math.floor((t - from) / step);
    const tk = from + k * step;
    if (tk >= to) return 0;
    return Math.exp(-(t - tk) / decay);
  }
  // 비트마다 한 칸씩 "스냅"하며 전진하는 계단형 시간
  const stepped = (beats, snap = 0.55) => Math.floor(beats) + E.outExpo(clamp((beats % 1) / snap));

  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgba = (key, a) => `rgba(${RGB[key][0]},${RGB[key][1]},${RGB[key][2]},${a})`;
  const mixc = (k1, k2, t) => {
    const a = RGB[k1];
    const c = RGB[k2];
    return `rgb(${lerp(a[0], c[0], t) | 0},${lerp(a[1], c[1], t) | 0},${lerp(a[2], c[2], t) | 0})`;
  };

  // ───────────────────────── text helpers
  const setFont = (ctx, fam, size, weight = 400) => {
    ctx.font = `${weight} ${size}px ${fam}`;
  };
  const mwCache = new Map();
  function mw(ctx, ch) {
    const key = ctx.font + '|' + ch;
    let w = mwCache.get(key);
    if (w === undefined) {
      w = ctx.measureText(ch).width;
      mwCache.set(key, w);
    }
    return w;
  }
  // 글자 단위 레이아웃: 각 글자의 중심 x와 폭
  function layout(ctx, str, x, align = 'center', tracking = 0) {
    const chars = [...str];
    const ws = chars.map((ch) => mw(ctx, ch));
    const total = ws.reduce((s, w) => s + w, 0) + tracking * (chars.length - 1);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const out = chars.map((ch, i) => {
      const g = { ch, i, x: cx + ws[i] / 2, w: ws[i] };
      cx += ws[i] + tracking;
      return g;
    });
    out.total = total;
    return out;
  }
  function glyph(ctx, ch, x, y, o = {}) {
    const { sc = 1, sx = 1, sy = 1, rot = 0, alpha = 1, fill = null, stroke = null, lw = 2 } = o;
    if (alpha <= 0.002 || sc <= 0.002 || ch === ' ') return;
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.scale(sc * sx, sc * sy);
    ctx.globalAlpha *= alpha;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillText(ch, 0, 0);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw / sc;
      ctx.lineJoin = 'round';
      ctx.strokeText(ch, 0, 0);
    }
    ctx.restore();
  }
  const fillBg = (ctx, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(-4, -4, W + 8, H + 8);
  };
  const disc = (ctx, x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, r), 0, TAU);
    ctx.fill();
  };

  function allText() {
    const parts = [];
    const walk = (v) => {
      if (typeof v === 'string') parts.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(T);
    TL.scenes.forEach((s) => parts.push(s.title));
    parts.push('0123456789:%+▲°·—ROTYPTSCAMZ.');
    return parts.join('');
  }

  // ───────────────────────── effects envelope (post shader + camera shake)
  function impacts(t, decay) {
    let s = 0;
    for (const im of TL.cues.impacts) s += im.power * env(t, b(im.beat), decay);
    return s;
  }
  function fx(t) {
    const wh = b(20);
    const glitch =
      bell(t, b(24) - 0.14, b(24), b(24) + 0.12) +
      // 몽타주 컷마다 짧은 글리치
      (t > b(24) && t < b(27) ? 0.35 * env(t, b(24) + Math.floor((t - b(24)) / b(0.5)) * b(0.5), 0.03) : 0) +
      (t > b(27) && t < b(27.75) ? 0.5 * env(t, b(27) + Math.floor((t - b(27)) / b(0.25)) * b(0.25), 0.04) : 0);
    return {
      flash: Math.min(1, impacts(t, 0.07)) * 0.8,
      ca: 1.1 + impacts(t, 0.16) * 12 + glitch * 16,
      zoom:
        (t < b(8) ? 0.14 * E.inExpo(inv(b(7), b(8), t)) : 0) +
        (t < b(16) ? 0.1 * E.inExpo(inv(b(15.2), b(16), t)) : 0) +
        (t > b(27) && t < b(27.75) ? 0.05 * inv(b(27), b(27.75), t) : 0) +
        0.06 * env(t, b(28), 0.12),
      dir: [bell(t, wh - 0.13, wh, wh + 0.14) * 260 + bell(t, b(12), b(12) + 0.14, b(12) + 0.34) * 60, 0],
      glitch: clamp(glitch),
      grain: 0.045,
      vig: 0.42,
    };
  }
  function shake(t) {
    const m = impacts(t, 0.22) * 18;
    if (m < 0.05) return null;
    return {
      x: noise1(t * 38, 1) * m,
      y: noise1(t * 41, 2) * m,
      r: noise1(t * 29, 3) * m * 0.0012,
      s: 1 + m / 700,
    };
  }

  // ═════════════════════════ SCENE 00 — 인트로 (b0–b8)

  function sceneIntro(ctx, t) {
    fillBg(ctx, C.ink);
    const cx = W / 2;
    const cy = H / 2;

    // 방사형으로 켜지는 도트 그리드
    if (t < b(6)) {
      ctx.fillStyle = C.paper;
      for (let gx = 60; gx < W; gx += 60) {
        for (let gy = 60; gy < H; gy += 60) {
          const d = Math.hypot(gx - cx, gy - cy) / 1100;
          const a = inv(d * 0.9, d * 0.9 + 0.4, t) * 0.13;
          if (a > 0.003) {
            ctx.globalAlpha = a * (1 + 1.5 * beatPulse(t - d * 0.25, 0, b(6), 0.15));
            ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // 비트마다 퍼지는 링
    if (t < b(6)) {
      for (let k = 0; k < 4; k++) {
        const age = t - b(k);
        if (age < 0 || age > 1.3) continue;
        const p = age / 1.3;
        ctx.strokeStyle = k === 3 ? C.coral : C.paper;
        ctx.globalAlpha = (1 - p) ** 2 * 0.7;
        ctx.lineWidth = lerp(5, 0.5, p);
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + 780 * E.outExpo(p), 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 눈금자 크로스헤어 (b1에 뻗고 b2에 접힘)
    const ext = E.outExpo(inv(b(1), b(1) + 0.45, t)) * (1 - E.inExpo(inv(b(2) - 0.08, b(2) + 0.18, t)));
    if (ext > 0.001) {
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      const hx = (W / 2) * ext;
      const hy = (H / 2) * ext;
      ctx.beginPath();
      ctx.moveTo(cx - hx, cy);
      ctx.lineTo(cx + hx, cy);
      ctx.moveTo(cx, cy - hy);
      ctx.lineTo(cx, cy + hy);
      for (let d = 40; d < hx; d += 40) {
        const L = d % 200 === 0 ? 14 : 6;
        ctx.moveTo(cx + d, cy - L);
        ctx.lineTo(cx + d, cy + L);
        ctx.moveTo(cx - d, cy - L);
        ctx.lineTo(cx - d, cy + L);
      }
      for (let d = 40; d < hy; d += 40) {
        const L = d % 200 === 0 ? 14 : 6;
        ctx.moveTo(cx - L, cy + d);
        ctx.lineTo(cx + L, cy + d);
        ctx.moveTo(cx - L, cy - d);
        ctx.lineTo(cx + L, cy - d);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── 문장 A: "모든 것은" — 가변 폰트 굵기가 100→800으로 살아난다
    const upP = E.outExpo(inv(b(4), b(4) + 0.45, t));
    const tyA = TL.cues.typing[0];
    const aStart = b(tyA.beat);
    setFont(ctx, F.sans, 150, 800);
    const LA = layout(ctx, T.a, 0, 'center', -4);
    if (t < b(6) && t > aStart - 0.3) {
      ctx.save();
      ctx.translate(cx, cy - 150 * upP);
      ctx.scale(1 - 0.4 * upP, 1 - 0.4 * upP);
      for (const g of LA) {
        const t0 = aStart + g.i * tyA.stagger;
        const p = inv(t0, t0 + 0.5, t);
        if (p <= 0) continue;
        const e = E.outExpo(p);
        setFont(ctx, F.sans, 150, Math.round(lerp(100, 800, E.outCubic(p))));
        glyph(ctx, g.ch, g.x, 50 * (1 - e), {
          fill: C.paper,
          alpha: E.outCubic(clamp(p * 3)) * (1 - 0.55 * upP),
          sc: lerp(1.3, 1, e),
        });
      }
      ctx.restore();
    }

    // 점: 중심에서 태어나 커서가 되고, 마침표가 된다
    if (t < b(4) + 0.3) {
      const m = E.outExpo(inv(aStart - 0.2, aStart, t));
      let typed = 0;
      for (const g of LA) {
        const t0 = aStart + g.i * tyA.stagger;
        typed += (g.w - 4) * E.outExpo(inv(t0, t0 + 0.14, t));
      }
      const startX = cx + LA[0].x - LA[0].w / 2;
      const dx = lerp(cx, startX + typed + 30, m);
      const dy = lerp(cy, cy + 46, m);
      const r =
        14 *
        E.outBack(inv(0, 0.3, t)) *
        (1 + 0.55 * beatPulse(t, 0, b(4), 0.1)) *
        (1 - E.inExpo(inv(b(4) - 0.05, b(4) + 0.25, t)));
      ctx.fillStyle = mixc('paper', 'coral', inv(aStart + 0.4, aStart + 0.7, t));
      disc(ctx, dx, dy, r);
    }

    // ── 문장 B: "움직일 때" — 사방에서 날아와 스프링으로 안착
    if (t >= b(4) && t < b(6)) {
      const tyB = TL.cues.typing[1];
      setFont(ctx, F.display, 200);
      const LB = layout(ctx, T.b, cx, 'center', 6);
      let hopIdx = 0;
      for (const g of LB) {
        const t0 = b(tyB.beat) + g.i * tyB.stagger;
        const p = spring(t - t0, 1.9, 0.45);
        const f = flyB[g.i];
        let y = cy + 70 + f.dy * (1 - p);
        let sx = 1;
        let sy = 1;
        if (g.ch !== ' ') {
          const th = b(5) + hopIdx * b(0.25);
          const hp = inv(th, th + 0.24, t);
          const hop = Math.sin(Math.PI * hp);
          y -= 38 * hop;
          const sq = hp > 0 && hp < 1 ? 0 : 0.18 * env(t, th + 0.24, 0.07);
          sx = 1 + sq - 0.06 * hop;
          sy = 1 - sq + 0.1 * hop;
          hopIdx++;
        }
        glyph(ctx, g.ch, g.x + f.dx * (1 - p), y, {
          fill: g.i === LB.length - 1 ? C.acid : C.paper,
          rot: f.rot * (1 - p),
          sc: lerp(f.s0, 1, p),
          sx,
          sy,
          alpha: clamp((t - t0) * 9),
        });
      }
    }

    // ── 문장 C: "살아난다" — 슬램 + 에코 + 코랄 아이리스로 드롭 진입
    if (t >= b(6)) {
      const lt = t - b(6);
      const slam = lerp(2.7, 1, E.outExpo(clamp(lt / 0.22)));
      const spread = E.inExpo(inv(b(1), b(2), lt));
      const s = slam * (1 + 0.05 * lt) * (1 + spread * 2.2);
      const jit = lt < b(1) ? 3 : 6;
      setFont(ctx, F.display, 300);
      const LC = layout(ctx, T.c, 0, 'center', -6 + spread * 240);
      ctx.save();
      ctx.translate(cx + noise1(t * 30, 5) * jit, cy + noise1(t * 33, 6) * jit);
      ctx.scale(s, s);
      const echo = spring(lt - 0.03, 1.5, 0.4) * (1 + 0.6 * beatPulse(t, b(6), b(8), 0.1, 2));
      const echoCols = [C.acid, C.cobalt, C.paper];
      for (let k = 6; k >= 1; k--) {
        const sk = 1 + k * 0.075 * echo;
        ctx.save();
        ctx.scale(sk, sk);
        for (const g of LC) {
          glyph(ctx, g.ch, g.x, 0, {
            stroke: echoCols[k % 3],
            lw: 2.2 / sk,
            alpha: (1 - k / 7) * 0.85 * clamp(echo),
          });
        }
        ctx.restore();
      }
      for (const g of LC) glyph(ctx, g.ch, g.x, 0, { fill: C.coral });
      ctx.restore();

      const ir = E.inExpo(inv(b(1.2), b(2), lt)) * 1150;
      if (ir > 0.5) {
        ctx.fillStyle = C.coral;
        disc(ctx, cx, cy, ir);
      }
    }
  }

  // ═════════════════════════ SCENE 01 — 키네틱 타이포 (b8–b12)
  function sceneType(ctx, lt, t) {
    fillBg(ctx, C.coral);
    const beats = lt / BEAT;
    const st = stepped(beats);
    const wave = E.inOutCubic(inv(b(2), b(2.6), lt));
    setFont(ctx, F.display, 150);
    ctx.lineJoin = 'round';

    T.rows.forEach((row, r) => {
      const open = E.outExpo(inv(r * 0.035, r * 0.035 + 0.4, lt));
      if (open <= 0.002) return;
      const y = H / 2 + (r - 3) * 162;
      const dir = r % 2 ? 1 : -1;
      const sp = 0.8 + ((r * 37) % 5) * 0.14;
      const off = dir * sp * (lt * 210 + st * 150);
      const L = layout(ctx, row.s, 0, 'left', 0);
      const total = L.total;
      const x0 = (((off % total) + total) % total) - total;
      const skew = Math.sin(lt * 3.1 + r) * 0.22 * wave;
      ctx.save();
      ctx.translate(0, y);
      ctx.transform(1, 0, skew, 1, 0, 0);
      ctx.scale(1, open);
      for (let x = x0; x < W + 200; x += total) {
        for (const g of L) {
          const gx = x + g.x;
          if (gx < -160 || gx > W + 160 || g.ch === ' ') continue;
          const gy = Math.sin(gx * 0.005 - lt * 7 + r * 0.9) * 32 * wave;
          if (row.st === 'stroke') glyph(ctx, g.ch, gx, gy, { stroke: C.ink, lw: 2.5 });
          else glyph(ctx, g.ch, gx, gy, { fill: row.st === 'paper' ? C.paper : C.ink });
        }
      }
      ctx.restore();
    });

    // 가운데를 가로지르는 페이퍼 밴드
    const bandP = E.inOutExpo(inv(b(1), b(1) + 0.35, lt));
    const bandH = 230 * (1 - E.inExpo(inv(b(3.45), b(3.9), lt)));
    if (bandP > 0.001 && bandH > 0.5) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.05);
      const bx = -W * 0.62;
      const bw = W * 1.24 * bandP;
      ctx.fillStyle = C.paper;
      ctx.fillRect(bx, -bandH / 2, bw, bandH);
      ctx.beginPath();
      ctx.rect(bx, -bandH / 2, bw, bandH);
      ctx.clip();
      const ty = TL.cues.typing[2];
      setFont(ctx, F.sans, 124, 900);
      const L = layout(ctx, T.band, 0, 'center', -3);
      for (const g of L) {
        const t0 = b(ty.beat) + g.i * ty.stagger;
        const p = spring(t - t0, 2.4, 0.33);
        const hop = beatPulse(t - g.i * 0.022, b(10), b(12), 0.09, 2);
        glyph(ctx, g.ch, g.x, 6 - 26 * hop, {
          fill: g.i >= (T.bandHighlight || [4, 5])[0] && g.i <= (T.bandHighlight || [4, 5])[1] ? C.coral : C.ink,
          sc: p,
          rot: (1 - clamp(p)) * 0.6,
        });
      }
      ctx.restore();
    }

    // 회전하는 원형 텍스트 배지
    const bp = spring(lt - b(1.5), 2, 0.4);
    if (bp > 0.001) {
      const bx = W - 290;
      const by = H - 300;
      const R = 108;
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(bp, bp);
      ctx.rotate(-0.4 * (1 - bp));
      ctx.fillStyle = C.ink;
      disc(ctx, 0, 0, R + 36);
      setFont(ctx, F.sans, 25, 800);
      const chars = [...T.badge];
      const rot = lt * 1.3 + st * 0.35;
      chars.forEach((ch, i) => {
        ctx.save();
        ctx.rotate(rot + (i / chars.length) * TAU);
        ctx.translate(0, -R);
        ctx.fillStyle = C.acid;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
      // 가운데 별
      ctx.rotate(-rot * 2);
      ctx.fillStyle = C.acid;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * TAU;
        const rr = k % 2 ? 16 : 46;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  // ═════════════════════════ SCENE 02 — 셰이프 & 리듬 (b12–b16)
  const NP = 96;
  function samplePoly(verts, n = NP) {
    const segs = [];
    let L = 0;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const c = verts[(i + 1) % verts.length];
      const l = Math.hypot(c[0] - a[0], c[1] - a[1]);
      segs.push([a, c, l]);
      L += l;
    }
    const out = [];
    let si = 0;
    let acc = 0;
    for (let k = 0; k < n; k++) {
      const d = (k / n) * L;
      while (acc + segs[si][2] < d && si < segs.length - 1) acc += segs[si++][2];
      const [a, c, l] = segs[si];
      const u = l > 0 ? (d - acc) / l : 0;
      out.push([lerp(a[0], c[0], u), lerp(a[1], c[1], u)]);
    }
    return out;
  }
  const arcPts = (cx, cy, r, a0, a1, n) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = lerp(a0, a1, i / n);
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
  const P = Math.PI;
  const UNIT = {
    circle: samplePoly(arcPts(0, 0, 0.5, -P / 2, (3 * P) / 2, 96).slice(0, -1)),
    square: samplePoly([[0, -0.46], [0.46, -0.46], [0.46, 0.46], [-0.46, 0.46], [-0.46, -0.46]]),
    tri: samplePoly([[0, -0.52], [0.52, 0.4], [-0.52, 0.4]]),
    diamond: samplePoly([[0, -0.56], [0.56, 0], [0, 0.56], [-0.56, 0]]),
    plus: samplePoly([
      [0, -0.5], [0.17, -0.5], [0.17, -0.17], [0.5, -0.17], [0.5, 0.17], [0.17, 0.17], [0.17, 0.5],
      [-0.17, 0.5], [-0.17, 0.17], [-0.5, 0.17], [-0.5, -0.17], [-0.17, -0.17], [-0.17, -0.5],
    ]),
    half: samplePoly([
      ...arcPts(0, 0.2, 0.52, -P / 2, 0, 24),
      [0.52, 0.2], [-0.52, 0.2],
      ...arcPts(0, 0.2, 0.52, P, (3 * P) / 2, 24).slice(0, -1),
    ]),
    star: samplePoly(
      Array.from({ length: 10 }, (_, i) => {
        const a = -P / 2 + (i / 10) * TAU;
        const r = i % 2 ? 0.23 : 0.55;
        return [Math.cos(a) * r, Math.sin(a) * r + 0.03];
      })
    ),
    pill: samplePoly([
      [0, -0.24], ...arcPts(0.26, 0, 0.24, -P / 2, P / 2, 16), ...arcPts(-0.26, 0, 0.24, P / 2, (3 * P) / 2, 16),
    ]),
  };
  UNIT.ring = UNIT.circle;

  const GRID = { cols: 5, rows: 3, cell: 220, gap: 70 };
  const SHAPES = [
    ['square', 'coral', 'spin'], ['tri', 'cobalt', 'bounce'], ['plus', 'ink', 'spin'], ['half', 'coral', 'bounce'], ['ring', 'cobalt', 'pulse'],
    ['star', 'coral', 'pulse'], ['diamond', 'cobalt', 'morph'], ['circle', 'ink', 'center'], ['square', 'cobalt', 'morph'], ['tri', 'coral', 'spin'],
    ['plus', 'cobalt', 'bounce'], ['circle', 'coral', 'bounce'], ['pill', 'ink', 'pulse'], ['ring', 'coral', 'spin'], ['diamond', 'ink', 'morph'],
  ];

  function shapePath(ctx, type, size, m) {
    const A = UNIT[type];
    const B = UNIT.circle;
    ctx.beginPath();
    for (let i = 0; i < NP; i++) {
      const x = lerp(A[i][0], B[i][0], m) * size;
      const y = lerp(A[i][1], B[i][1], m) * size;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function sceneShape(ctx, lt, t) {
    fillBg(ctx, C.paper);
    const { cols, rows, cell, gap } = GRID;
    const gw = cols * cell + (cols - 1) * gap;
    const gh = rows * cell + (rows - 1) * gap;
    const x0 = (W - gw) / 2;
    const y0 = (H - gh) / 2;
    const size = cell * 0.78;
    const fin = E.inOutExpo(inv(b(3), b(3.3), lt)); // 전부 원으로
    const fly = E.inExpo(inv(b(3.25), b(4), lt)); // 흩어짐
    const gRot = -0.06 * E.inOutCubic(inv(0, b(3), lt)) * (1 - fly);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(gRot);
    ctx.scale(1 + 0.04 * lt, 1 + 0.04 * lt);
    ctx.translate(-W / 2, -H / 2);

    // 그리드 교차점 마커
    ctx.strokeStyle = rgba('ink', 0.25 * (1 - fly) * E.outCubic(inv(0.1, 0.5, lt)));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        const mx = x0 - gap / 2 + c * (cell + gap);
        const my = y0 - gap / 2 + r * (cell + gap);
        ctx.moveTo(mx - 8, my);
        ctx.lineTo(mx + 8, my);
        ctx.moveTo(mx, my - 8);
        ctx.lineTo(mx, my + 8);
      }
    }
    ctx.stroke();

    const order = SHAPES.map((_, i) => i);
    order.push(...order.splice(order.findIndex((i) => SHAPES[i][2] === 'center'), 1)); // 중앙 원은 맨 위에
    for (const idx of order) {
      const [type, col, act] = SHAPES[idx];
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      let px = x0 + c * (cell + gap) + cell / 2;
      let py = y0 + r * (cell + gap) + cell / 2;
      const d = (r + c) * 0.04;
      const sIn = spring(lt - 0.02 - d, 2.3, 0.38);
      if (sIn <= 0.001) continue;

      // 8분음표 단위 액션 (열마다 살짝 지연 → 파도)
      const at = lt - c * 0.035 - b(1);
      const k = Math.floor(at / b(0.5));
      const ph = at >= 0 ? (at % b(0.5)) / b(0.5) : 0;
      let rot = 0;
      let m = 0;
      let sc = 1;
      let sx = 1;
      let sy = 1;
      let oy = 0;
      if (at >= 0 && lt < b(3.2)) {
        if (act === 'bounce') {
          const h = Math.sin(Math.PI * clamp(ph / 0.85));
          oy = -60 * h;
          const land = (1 - h) ** 8 * 0.26;
          sx = 1 + land - 0.08 * h;
          sy = 1 - land + 0.14 * h;
        } else if (act === 'spin') {
          rot = (k + E.outBack(clamp(ph / 0.5))) * (P / 2);
        } else if (act === 'morph') {
          const e = E.inOutExpo(clamp(ph / 0.55));
          m = k % 2 === 0 ? e : 1 - e;
        } else {
          sc = 1 + 0.24 * Math.exp(-ph * 5);
        }
      }
      m = lerp(m, 1, fin);
      rot *= 1 - fin;

      let dispSize = size * sIn * sc;
      if (act === 'center') {
        dispSize = lerp(dispSize, 2 * 1300, E.inExpo(inv(b(3.3), b(4), lt)));
      } else {
        const vx = px - W / 2;
        const vy = py - H / 2;
        px += vx * fly * 2.2;
        py += vy * fly * 2.2;
        dispSize *= 1 - fly;
      }

      ctx.save();
      ctx.translate(px, py + oy);
      ctx.rotate(rot);
      ctx.scale(sx, sy);
      if (type === 'ring') {
        shapePath(ctx, type, dispSize * 0.9, m);
        ctx.strokeStyle = C[col];
        ctx.lineWidth = 24 * sIn * (1 - fly);
        ctx.stroke();
      } else {
        shapePath(ctx, type, dispSize, m);
        ctx.fillStyle = C[col];
        ctx.fill();
      }
      ctx.restore();

      // 모션 용어 라벨
      if (act !== 'center') {
        const la = E.outCubic(inv(0.25 + d, 0.6 + d, lt)) * (1 - fin);
        if (la > 0.01) {
          setFont(ctx, F.mono, 15, 700);
          const tag = TAGS[act];
          const n = Math.floor(inv(0.25 + d, 0.55 + d, lt) * tag.length);
          ctx.fillStyle = rgba('ink', 0.55 * la);
          ctx.fillText(tag.slice(0, n), px, y0 + r * (cell + gap) + cell + 22);
        }
      }
    }
    ctx.restore();
  }

  // ═════════════════════════ SCENE 03 — 공간 & 깊이 (b16–b20)
  const NPTS = 2000;
  const PTS = { sphere: [], torus: [], text: [], seed: [] };
  const STARS = [];
  function buildPoints() {
    const R = 330;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < NPTS; i++) {
      const y = 1 - (2 * (i + 0.5)) / NPTS;
      const rr = Math.sqrt(1 - y * y);
      const th = i * golden;
      PTS.sphere.push([Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R]);
    }
    const per = 40;
    const ringsN = NPTS / per;
    for (let i = 0; i < NPTS; i++) {
      const u = (Math.floor(i / per) / ringsN) * TAU;
      const v = ((i % per) / per) * TAU;
      const RR = 310;
      const r = 115;
      PTS.torus.push([(RR + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (RR + r * Math.cos(v)) * Math.sin(u)]);
    }
    // "공간" 글자를 픽셀 샘플링해 점 구름으로
    const cw = 1400;
    const ch = 620;
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#fff';
    c2.textAlign = 'center';
    c2.textBaseline = 'middle';
    setFont(c2, F.display, 480);
    c2.fillText(T.space, cw / 2, ch / 2 + 10);
    const data = c2.getImageData(0, 0, cw, ch).data;
    // 글자 면적에서 격자 간격을 역산해 점이 ~NPTS개가 되도록 → 또렷한 글자
    let area = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 128) area++;
    const step = Math.sqrt(area / NPTS) * 0.985;
    const cand = [];
    for (let y = step / 2; y < ch; y += step) {
      for (let x = step / 2; x < cw; x += step) {
        if (data[((y | 0) * cw + (x | 0)) * 4 + 3] > 128) cand.push([x - cw / 2, y - ch / 2]);
      }
    }
    const r3 = rng(33);
    for (let i = cand.length - 1; i > 0; i--) {
      const j = Math.floor(r3() * (i + 1));
      [cand[i], cand[j]] = [cand[j], cand[i]];
    }
    for (let i = 0; i < NPTS; i++) {
      const p = cand[i % cand.length];
      PTS.text.push([p[0], p[1], (r3() - 0.5) * 14]);
      PTS.seed.push(r3());
    }
    const rs = rng(99);
    for (let i = 0; i < 140; i++) STARS.push([rs() * W, rs() * H, 0.2 + rs() * 0.8]);
  }
  const rotYX = (p, ay, ax) => {
    const cy = Math.cos(ay);
    const sy = Math.sin(ay);
    const x1 = p[0] * cy + p[2] * sy;
    const z1 = -p[0] * sy + p[2] * cy;
    const cx = Math.cos(ax);
    const sx = Math.sin(ax);
    return [x1, p[1] * cx - z1 * sx, p[1] * sx + z1 * cx];
  };

  const proj = new Float32Array(NPTS * 4);
  function sceneSpace(ctx, lt, t) {
    fillBg(ctx, C.ink);
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 900);
    g.addColorStop(0, rgba('cobalt', 0.32));
    g.addColorStop(1, rgba('cobalt', 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 시차 스타필드
    ctx.fillStyle = C.paper;
    for (const [sx, sy, dp] of STARS) {
      const x = (((sx - lt * 180 * dp) % W) + W) % W;
      ctx.globalAlpha = 0.15 + 0.45 * dp;
      ctx.fillRect(x, sy, 2 * dp + 0.5, 2 * dp + 0.5);
    }
    ctx.globalAlpha = 1;

    const p1 = E.outExpo(inv(0, 0.7, lt));
    const ay = lt * 1.15 + 0.4 * stepped(lt / BEAT, 0.4);
    const axS = 0.45 + 0.15 * Math.sin(lt * 1.3);
    const ayT = Math.sin(lt * 2.4) * 0.22;
    const breathe = 1 + 0.09 * beatPulse(t, b(16), b(20), 0.16);
    const camZ = 1250 - 280 * E.inOutCubic(inv(0, b(4), lt));
    const f = 1000;

    for (let i = 0; i < NPTS; i++) {
      const sd = PTS.seed[i] * 0.3;
      const q2 = E.inOutCubic(inv(b(1.2) + sd, b(1.75) + sd, lt));
      const q3 = E.inOutCubic(inv(b(2.35) + sd, b(2.85) + sd, lt));
      const s = rotYX(PTS.sphere[i], ay, axS);
      const to = rotYX(PTS.torus[i], ay * 0.8, 1.05);
      const tx = rotYX(PTS.text[i], ayT, 0.08);
      let x = lerp(lerp(s[0], to[0], q2), tx[0], q3);
      let y = lerp(lerp(s[1], to[1], q2), tx[1], q3);
      let z = lerp(lerp(s[2], to[2], q2), tx[2], q3);
      const bm = lerp(breathe, 1, q3) * p1;
      x *= bm;
      y *= bm;
      z *= bm;
      const zz = z + camZ;
      const k = f / zz;
      proj[i * 4] = W / 2 + x * k;
      proj[i * 4 + 1] = H / 2 + y * k;
      proj[i * 4 + 2] = k;
      proj[i * 4 + 3] = lerp(clamp((z + 380) / 760), 0.05, q3); // 0=가까움, 글자 단계는 밝게
    }

    // 와이어 연결선 (구: +34 이웃, 토러스: +40 이웃)
    const q2m = E.inOutCubic(inv(b(1.2), b(2.05), lt));
    const q3m = E.inOutCubic(inv(b(2.3), b(2.9), lt));
    const lineA = 0.2 * p1 * (1 - q3m);
    if (lineA > 0.005) {
      ctx.lineWidth = 1;
      for (const [off, wgt] of [[34, 1 - q2m], [40, q2m]]) {
        if (wgt < 0.02) continue;
        ctx.strokeStyle = rgba('paper', lineA * wgt);
        ctx.beginPath();
        for (let i = 0; i + off < NPTS; i++) {
          const j = i + off;
          const dx = proj[i * 4] - proj[j * 4];
          const dy = proj[i * 4 + 1] - proj[j * 4 + 1];
          if (dx * dx + dy * dy > 3600) continue;
          ctx.moveTo(proj[i * 4], proj[i * 4 + 1]);
          ctx.lineTo(proj[j * 4], proj[j * 4 + 1]);
        }
        ctx.stroke();
      }
    }

    // 깊이별로 버킷팅해서 한 번에 채우기
    const NB = 8;
    for (let bk = NB - 1; bk >= 0; bk--) {
      const dt = bk / (NB - 1);
      ctx.fillStyle = mixc('acid', 'cobalt', dt);
      ctx.globalAlpha = lerp(1, 0.55, dt);
      ctx.beginPath();
      for (let i = 0; i < NPTS; i++) {
        if (Math.min(NB - 1, Math.floor(proj[i * 4 + 3] * NB)) !== bk) continue;
        const r = lerp(2.4, 3.6, q3m) * proj[i * 4 + 2];
        ctx.moveTo(proj[i * 4] + r, proj[i * 4 + 1]);
        ctx.arc(proj[i * 4], proj[i * 4 + 1], r, 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 궤도 링
    const orb = p1 * (1 - q3m);
    if (orb > 0.01) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.25 + lt * 0.15);
      ctx.strokeStyle = rgba('coral', 0.9 * orb);
      ctx.lineWidth = 2.5;
      ctx.setLineDash([14, 12]);
      ctx.lineDashOffset = -lt * 120;
      ctx.beginPath();
      ctx.ellipse(0, 0, 560 * orb, 150 * orb, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      const oa = lt * 2.2;
      ctx.fillStyle = C.coral;
      disc(ctx, Math.cos(oa) * 560 * orb, Math.sin(oa) * 150 * orb, 9);
      ctx.restore();
    }

    // 3D 툴 느낌의 수치 판독
    const ra = E.outCubic(inv(0.2, 0.5, lt));
    if (ra > 0) {
      setFont(ctx, F.mono, 16, 400);
      ctx.textAlign = 'left';
      ctx.fillStyle = rgba('paper', 0.6 * ra);
      const deg = (((ay * 180) / Math.PI) % 360).toFixed(1).padStart(5, '0');
      ctx.fillText(`ROT.Y ${deg}°   PTS ${NPTS}   CAM.Z ${camZ.toFixed(0)}`, 64, 112);
      ctx.textAlign = 'center';
    }
  }

  // ═════════════════════════ SCENE 04 — 데이터 시각화 (b20–b24)

  function odometer(ctx, value, digits, x, y, size) {
    setFont(ctx, F.sans, size, 800);
    const dw = mw(ctx, '0') * 1.02;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 10, y - size * 0.58, dw * digits + 20, size * 1.16);
    ctx.clip();
    for (let j = 0; j < digits; j++) {
      const pw = 10 ** (digits - 1 - j);
      const d = Math.floor(value / pw) % 10;
      const frac = pw === 1 ? value % 1 : clamp((value % pw) - (pw - 1));
      const off = d + frac;
      const base = Math.floor(off);
      const fr = off - base;
      const leading = pw > 1 && value < pw;
      ctx.fillStyle = leading ? rgba('paper', 0.22) : C.paper;
      const gx = x + j * dw + dw / 2;
      ctx.fillText(String(base % 10), gx, y - fr * size * 1.05);
      ctx.fillText(String((base + 1) % 10), gx, y + (1 - fr) * size * 1.05);
    }
    ctx.restore();
    return dw * digits;
  }

  function sceneData(ctx, lt, t) {
    fillBg(ctx, C.cobalt);
    // 미세 그리드
    ctx.strokeStyle = rgba('paper', 0.06);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 80) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += 80) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    // 왼쪽: 롤링 카운터
    T.stats.forEach((s, i) => {
      const s0 = 0.06 + i * 0.13;
      const rv = E.outExpo(inv(s0, s0 + 0.45, lt));
      if (rv <= 0.001) return;
      const y = 290 + i * 250;
      const x = 140;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y - 150, 960, 260);
      ctx.clip();
      ctx.translate(0, 70 * (1 - rv));
      ctx.globalAlpha = rv;
      ctx.textAlign = 'left';
      ctx.fillStyle = C.acid;
      ctx.fillRect(x, y - 116, 12, 12);
      setFont(ctx, F.mono, 20, 700);
      ctx.fillStyle = rgba('paper', 0.75);
      ctx.fillText(s.label, x + 26, y - 109);
      ctx.textAlign = 'center';
      const val = s.v * E.outExpo(inv(s0 + 0.05, s0 + 1.1, lt));
      const nw = odometer(ctx, val, s.d, x, y, 168);
      ctx.textAlign = 'left';
      setFont(ctx, F.sans, 64, 700);
      ctx.fillStyle = C.acid;
      ctx.fillText(s.unit, x + nw + 22, y + 34);
      ctx.restore();
      ctx.textAlign = 'center';
      const dv = E.outExpo(inv(s0 + 0.12, s0 + 0.7, lt));
      ctx.fillStyle = rgba('paper', 0.28);
      ctx.fillRect(x, y + 108, 700 * dv, 2);
    });

    // 오른쪽: 막대 + 라인 차트
    const X0 = 1000;
    const X1 = 1760;
    const Y0 = 250;
    const Y1 = 850;
    ctx.textAlign = 'left';
    setFont(ctx, F.mono, 20, 700);
    const ha = E.outCubic(inv(0.1, 0.4, lt));
    ctx.fillStyle = rgba('paper', 0.8 * ha);
    ctx.fillText(T.chart, X0, Y0 - 60);
    ctx.setLineDash([4, 8]);
    ctx.lineWidth = 1.5;
    for (let k = 0; k <= 4; k++) {
      const gp = E.outExpo(inv(0.1 + k * 0.05, 0.6 + k * 0.05, lt));
      const y = Y1 - (k * (Y1 - Y0)) / 4;
      ctx.strokeStyle = rgba('paper', k === 0 ? 0.6 : 0.2);
      if (k === 0) ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(X0, y);
      ctx.lineTo(X0 + (X1 - X0) * gp, y);
      ctx.stroke();
      if (k === 0) ctx.setLineDash([4, 8]);
      setFont(ctx, F.mono, 14, 400);
      ctx.fillStyle = rgba('paper', 0.5 * gp);
      if (T.chartValue.axis !== false) ctx.fillText(String(k * 25), X1 + 16, y + 1);
    }
    ctx.setLineDash([]);
    ctx.textAlign = 'center';

    const n = BARS.length;
    const bw = 40;
    const stepX = (X1 - X0 - bw) / (n - 1);
    const barX = (i) => X0 + bw / 2 + i * stepX;
    for (let i = 0; i < n; i++) {
      const grow = spring(lt - (0.25 + i * 0.04), 2.0, 0.42);
      if (grow <= 0) continue;
      const wob = 1 + 0.08 * beatPulse(t - i * 0.018, b(21), b(24), 0.14);
      const h = BARS[i] * (Y1 - Y0) * grow * wob;
      ctx.fillStyle = i === n - 1 ? C.acid : rgba('paper', 0.9);
      ctx.fillRect(barX(i) - bw / 2, Y1 - h, bw, h);
    }

    const q = E.inOutCubic(inv(b(1.1), b(2.8), lt)) * (n - 1);
    if (q > 0) {
      const pt = (i) => [barX(i), Y1 - LINE[i] * (Y1 - Y0) - 30];
      ctx.strokeStyle = C.acid;
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      const k = Math.floor(q);
      for (let i = 0; i <= k; i++) {
        const [x, y] = pt(i);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      let hx;
      let hy;
      let hv;
      if (k < n - 1) {
        const [ax, ay] = pt(k);
        const [cx2, cy2] = pt(k + 1);
        const u = q - k;
        hx = lerp(ax, cx2, u);
        hy = lerp(ay, cy2, u);
        hv = lerp(LINE[k], LINE[k + 1], u);
      } else {
        [hx, hy] = pt(n - 1);
        hv = LINE[n - 1];
      }
      ctx.lineTo(hx, hy);
      ctx.stroke();
      for (let i = 0; i <= k; i++) {
        const [x, y] = pt(i);
        const pop = spring(q - i, 1.2, 0.4);
        ctx.fillStyle = C.ink;
        disc(ctx, x, y, 9 * pop);
        ctx.fillStyle = C.acid;
        disc(ctx, x, y, 5 * pop);
      }
      const pr = beatPulse(t, b(21), b(24), 0.2);
      ctx.strokeStyle = rgba('acid', 0.8 * pr);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, 14 + 26 * (1 - pr), 0, TAU);
      ctx.stroke();
      ctx.fillStyle = C.acid;
      disc(ctx, hx, hy, 12);
      // 값 태그
      const vl = T.chartValue;
      const label = vl.labels
        ? vl.labels[Math.min(n - 1, Math.round(q))]
        : `${vl.prefix}${Math.round(hv * vl.scale)}${vl.suffix}`;
      setFont(ctx, F.mono, 24, 700);
      const tw = ctx.measureText(label).width + 28;
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.roundRect(hx - tw / 2, hy - 74, tw, 42, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 33);
      ctx.lineTo(hx + 8, hy - 33);
      ctx.lineTo(hx, hy - 23);
      ctx.fill();
      ctx.fillStyle = C.acid;
      ctx.fillText(label, hx, hy - 52);
    }
  }

  // ═════════════════════════ SCENE 05 — 몽타주 (b24–b28)
  function sceneMontage(ctx, lt, t) {
    const cx = W / 2;
    const cy = H / 2;
    if (lt < b(3)) {
      const slot = b(0.5);
      const i = Math.min(5, Math.floor(lt / slot));
      const u = lt - i * slot;
      const m = T.montage[i];
      fillBg(ctx, C[m.bg]);
      const fg = C[m.fg];
      const e = E.outExpo(clamp(u / 0.16));
      let size = [...m.k].length > 3 ? 250 : m.st === 'huge' ? 620 : 300;
      ctx.save();
      ctx.translate(cx, cy);
      const sc = lerp(1.2, 1, e) * (1 + 0.12 * u);
      ctx.scale(sc, sc);
      setFont(ctx, F.display, size);
      let L = layout(ctx, m.k, 0, 'center', m.st === 'huge' ? -20 : 0);
      const maxW = m.st === 'huge' ? 1500 : 1560; // 긴 단어(영문 등)는 화면 폭에 맞춰 줄인다
      if (L.total > maxW) {
        size = Math.floor((size * maxW) / L.total);
        setFont(ctx, F.display, size);
        L = layout(ctx, m.k, 0, 'center', m.st === 'huge' ? -20 : 0);
      }
      const drawWord = (o) => {
        for (const g of L) glyph(ctx, g.ch, g.x, 0, o);
      };
      if (m.st === 'fill') {
        drawWord({ fill: fg });
      } else if (m.st === 'stack') {
        const step = size * 0.86;
        const off = (u / slot) * step * 0.8;
        for (let k = -3; k <= 3; k++) {
          ctx.save();
          ctx.translate(0, k * step + (k ? off * Math.sign(k) : 0));
          if (k === 0) drawWord({ fill: fg });
          else drawWord({ stroke: fg, lw: 2.5, alpha: 0.75 - Math.abs(k) * 0.15 });
          ctx.restore();
        }
      } else if (m.st === 'echo') {
        for (let k = 8; k >= 1; k--) {
          const sk = 1 + k * 0.13 * e;
          ctx.save();
          ctx.scale(sk, sk);
          drawWord({ stroke: k % 2 ? fg : C.paper, lw: 2.2 / sk, alpha: 1 - k / 9 });
          ctx.restore();
        }
        drawWord({ fill: fg });
      } else if (m.st === 'split') {
        const sp = 140 * (1 - e);
        for (const [dir, top] of [[-1, true], [1, false]]) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(-W, top ? -H : 0, W * 2, H);
          ctx.clip();
          ctx.translate(dir * sp, 0);
          drawWord({ fill: fg });
          ctx.restore();
        }
        ctx.fillStyle = C.coral;
        ctx.fillRect(-L.total / 2 - 40, -3, (L.total + 80) * e, 6);
      } else if (m.st === 'huge') {
        ctx.rotate(-0.06 + u * 0.25);
        ctx.save();
        ctx.translate(26, 26);
        drawWord({ stroke: C.paper, lw: 3 });
        ctx.restore();
        drawWord({ fill: fg });
      } else if (m.st === 'stripes') {
        const n = 10;
        const sh = (size * 1.1) / n;
        for (let k = 0; k < n; k++) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(-W, -size * 0.55 + k * sh, W * 2, sh + 0.5);
          ctx.clip();
          ctx.translate((k % 2 ? 1 : -1) * 220 * (1 - e) ** 2, 0);
          drawWord({ fill: fg });
          ctx.restore();
        }
      }
      ctx.restore();

      // 영문 캡션 + 카운터
      setFont(ctx, F.mono, 22, 700);
      ctx.fillStyle = fg;
      const LE = layout(ctx, m.e, cx, 'center', 9);
      const nE = Math.floor(clamp(u / 0.12) * LE.length);
      const capY = m.st === 'huge' ? cy - 360 : cy - 230;
      for (const g of LE) if (g.i < nE) glyph(ctx, g.ch, g.x, capY, { fill: fg });
      ctx.fillText(`0${i + 1} / 06`, cx, m.st === 'huge' ? cy + 360 : cy + 230);
      return;
    }

    // 스터터: 16분음표마다 "모션"이 커지며 깜빡이고, 마지막 16분은 완전한 정적
    const k = Math.floor((lt - b(3)) / b(0.25));
    if (k >= 3) {
      fillBg(ctx, '#000');
      return;
    }
    const sch = [['paper', 'ink'], ['coral', 'paper'], ['acid', 'ink']][k];
    fillBg(ctx, C[sch[0]]);
    const u = lt - b(3) - k * b(0.25);
    setFont(ctx, F.display, 320);
    const L = layout(ctx, T.stutter, 0, 'center', -10);
    ctx.save();
    ctx.translate(cx, cy);
    const s = (1 + k * 0.45) * (1 + u * 0.8);
    ctx.scale(s, s);
    for (const g of L) glyph(ctx, g.ch, g.x, 0, { fill: C[sch[1]] });
    ctx.restore();
  }

  // ═════════════════════════ SCENE 06 — 엔드 카드 (b28–b32)
  const endR = rng(5);
  const BURST = Array.from({ length: 46 }, () => ({
    a: endR() * TAU,
    v: 700 + endR() * 1300,
    s: 8 + endR() * 18,
    rot: (endR() - 0.5) * 12,
    type: Math.floor(endR() * 3),
    col: ['coral', 'acid', 'cobalt', 'paper'][Math.floor(endR() * 4)],
  }));
  // W·H 가 정해진 뒤(boot)에 채운다. 모듈 로드 시점에 만들면 좌표가 전부 NaN 이 되어 그려지지 않는다
  const DUST = [];
  function buildDust() {
    for (let i = 0; i < 70; i++) DUST.push([endR() * W, endR() * H, 0.3 + endR() * 0.7, endR() * TAU]);
  }

  function miniShape(ctx, type, x, y, s, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = col;
    ctx.beginPath();
    if (type === 0) ctx.arc(0, 0, s / 2, 0, TAU);
    else if (type === 1) ctx.rect(-s / 2, -s / 2, s, s);
    else {
      ctx.moveTo(0, -s * 0.55);
      ctx.lineTo(s * 0.52, s * 0.4);
      ctx.lineTo(-s * 0.52, s * 0.4);
    }
    ctx.fill();
    ctx.restore();
  }

  function sceneEnd(ctx, lt, t) {
    fillBg(ctx, C.ink);
    const cx = W / 2;
    const push = 1 + 0.035 * E.outCubic(inv(0, b(4), lt));
    ctx.save();
    ctx.translate(cx, H / 2);
    ctx.scale(push, push);
    ctx.translate(-cx, -H / 2);

    // 부유하는 먼지
    for (const [dx, dy, dp, ph] of DUST) {
      const a = 0.28 * dp * E.outCubic(inv(0.3, 1, lt));
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = C.paper;
      const y = (((dy - lt * 40 * dp) % H) + H) % H;
      disc(ctx, dx + Math.sin(lt * 1.5 + ph) * 12, y, 1.6 * dp + 0.4);
    }
    ctx.globalAlpha = 1;

    // 충격파
    for (const [delay, col, lw] of [[0, 'coral', 26], [0.07, 'paper', 6], [0.16, 'acid', 3]]) {
      const age = lt - delay;
      if (age < 0 || age > 1.1) continue;
      const p = age / 1.1;
      ctx.strokeStyle = rgba(col, (1 - p) ** 1.6);
      ctx.lineWidth = lerp(lw, 0.5, p);
      ctx.beginPath();
      ctx.arc(cx, H / 2, 30 + 1150 * E.outExpo(p), 0, TAU);
      ctx.stroke();
    }
    // 파티클 버스트 (공기저항)
    for (const pt of BURST) {
      const age = Math.max(0, lt);
      const dist = (pt.v * (1 - Math.exp(-age * 4.5))) / 4.5;
      const life = 1 - inv(0.3, 1.4, age);
      if (life <= 0) continue;
      miniShape(
        ctx,
        pt.type,
        cx + Math.cos(pt.a) * dist,
        H / 2 + Math.sin(pt.a) * dist,
        pt.s * life,
        pt.rot * age,
        C[pt.col]
      );
    }

    // 로고 마크: ● ■ ▲
    const markY = 318;
    const marks = [['coral', 0], ['acid', 1], ['cobalt', 2]];
    marks.forEach(([col, type], i) => {
      const p = spring(lt - b(1) - i * 0.08, 2.2, 0.35);
      if (p <= 0) return;
      miniShape(ctx, type, cx + (i - 1) * 104, markY, 68 * p, (1 - clamp(p)) * -P, C[col]);
    });

    // 이름: 블록 리빌
    setFont(ctx, F.display, 250);
    const track = lerp(50, 0, E.outExpo(inv(0.22, 0.9, lt))) + 10 * E.inOutCubic(inv(0.9, b(4), lt));
    const LN = layout(ctx, T.name, cx, 'center', track);
    const nameY = 528;
    if (lt > 0.22) {
      for (const g of LN) glyph(ctx, g.ch, g.x, nameY, { fill: C.paper });
    }
    const bw = LN.total + 80;
    const bl = cx - bw / 2;
    const p1 = E.inOutExpo(inv(0.02, 0.22, lt));
    const p2 = E.inOutExpo(inv(0.24, 0.48, lt));
    if (p1 > 0 && p2 < 1) {
      ctx.fillStyle = C.coral;
      ctx.fillRect(bl + bw * p2, nameY - 130, bw * (p1 - p2), 260);
    }

    // 룰 라인
    const rl = E.inOutExpo(inv(b(1.5), b(1.5) + 0.45, lt));
    ctx.fillStyle = rgba('paper', 0.5);
    ctx.fillRect(cx - 440 * rl, 668, 880 * rl, 2);
    ctx.fillStyle = C.coral;
    disc(ctx, cx - 440 * rl, 669, 5 * rl);
    disc(ctx, cx + 440 * rl, 669, 5 * rl);

    // 태그라인: 한 글자씩 떠오르며 굵어진다
    const ty = TL.cues.typing[3];
    setFont(ctx, F.sans, 62, 700);
    const LT = layout(ctx, T.tag, cx, 'center', 2);
    for (const g of LT) {
      const t0 = b(ty.beat - 28) + g.i * ty.stagger;
      const p = inv(t0, t0 + 0.45, lt);
      if (p <= 0) continue;
      setFont(ctx, F.sans, 62, Math.round(lerp(150, 700, E.outCubic(p))));
      glyph(ctx, g.ch, g.x, 748 + 40 * (1 - E.outExpo(p)), {
        fill: C.paper,
        alpha: E.outCubic(clamp(p * 2.5)),
      });
    }

    // 영문 모노 라인 (타자)
    setFont(ctx, F.mono, 20, 700);
    const LE = layout(ctx, T.eng, cx, 'center', 5);
    const nE = Math.floor(inv(b((T.engTyping || [2.4, 3.1])[0]), b((T.engTyping || [2.4, 3.1])[1]), lt) * LE.length);
    for (const g of LE) if (g.i < nE) glyph(ctx, g.ch, g.x, 822, { fill: C.acid });
    if (nE > 0 && nE < LE.length) {
      ctx.fillStyle = C.acid;
      const g = LE[nE];
      ctx.fillRect(g.x - 6, 810, 12, 24);
    }

    // 슬로건
    const sa = E.outCubic(inv(b(3), b(3.4), lt));
    setFont(ctx, F.sans, 30, 400);
    ctx.fillStyle = rgba('paper', 0.6 * sa);
    ctx.fillText(T.slogan, cx, 920 + 12 * (1 - sa));

    ctx.restore();
  }

  // ───────────────────────── HUD (셰이크 영향 없이 최상단)
  function sceneAt(t) {
    let s = TL.scenes[0];
    for (const sc of TL.scenes) if (t >= b(sc.beat)) s = sc;
    return s;
  }
  function hudColor(t) {
    if (t < b(8)) return 'paper';
    if (t < b(16)) return 'ink';
    if (t < b(24)) return 'paper';
    if (t < b(27)) return T.montage[Math.min(5, Math.floor((t - b(24)) / b(0.5)))].fg;
    if (t < b(27.75)) return ['ink', 'paper', 'ink'][Math.floor((t - b(27)) / b(0.25))];
    return 'paper';
  }
  function timecode(t) {
    const fr = Math.round(t * FPS);
    const s = Math.floor(fr / FPS);
    const f = fr % FPS;
    const p2 = (n) => String(n).padStart(2, '0');
    return `00:00:${p2(s)}:${p2(f)}`;
  }
  function hud(ctx, t) {
    if (t >= b(27.75) && t < b(28)) return; // 정적의 16분음표
    const col = hudColor(t);
    const on = E.outExpo(inv(0.05, 0.6, t));
    const endFade = 1 - E.outCubic(inv(b(28), b(28) + 0.4, t));
    const m = 40;
    const L = 34 * on;
    ctx.save();
    ctx.strokeStyle = C[col];
    ctx.fillStyle = C[col];
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      ctx.moveTo(x, y + sy * L);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * L, y);
    }
    ctx.stroke();

    ctx.globalAlpha = 0.9 * on * endFade;
    ctx.textBaseline = 'middle';
    setFont(ctx, F.mono, 16, 700);
    ctx.textAlign = 'left';
    ctx.fillText(T.hud, m + 22, m + 24);
    ctx.textAlign = 'right';
    ctx.fillText(timecode(t), W - m - 22, m + 24);
    const tw = ctx.measureText(timecode(t)).width;
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = C.coral;
      disc(ctx, W - m - 22 - tw - 16, m + 24, 6);
      ctx.fillStyle = C[col];
    }

    // 섹션 라벨 (좌하단)
    const sc = sceneAt(t);
    const t0 = b(sc.beat);
    const bp = E.outExpo(inv(t0, t0 + 0.3, t));
    ctx.textAlign = 'left';
    ctx.fillRect(m + 22, H - m - 38, 44 * bp, 28);
    ctx.fillStyle = C[col === 'paper' ? 'ink' : col === 'ink' ? 'paper' : 'ink'];
    if (col === 'acid' || col === 'coral') ctx.fillStyle = C.ink;
    if (bp > 0.6) ctx.fillText(sc.label, m + 29, H - m - 23);
    ctx.fillStyle = C[col];
    setFont(ctx, F.mono, 17, 700);
    const title = [...sc.title];
    const nT = Math.floor(inv(t0 + 0.05, t0 + 0.35, t) * title.length);
    ctx.fillText(title.slice(0, nT).join(''), m + 80, H - m - 23);

    // 비트 인디케이터 (우하단)
    const beatIdx = Math.floor(t / BEAT) % 4;
    for (let i = 0; i < 4; i++) {
      const x = W - m - 22 - (3 - i) * 20 - 12;
      const y = H - m - 30;
      if (i === beatIdx) ctx.fillRect(x, y, 12, 12);
      else ctx.strokeRect(x + 1, y + 1, 10, 10);
    }
    ctx.textAlign = 'right';
    setFont(ctx, F.mono, 16, 700);
    ctx.fillText(`${TL.bpm} BPM`, W - m - 22 - 92, H - m - 23);

    // 진행 바
    ctx.globalAlpha = 0.25 * on;
    ctx.fillRect(m + 22, H - m + 12, W - 2 * m - 44, 2);
    ctx.globalAlpha = 0.9 * on;
    ctx.fillRect(m + 22, H - m + 12, (W - 2 * m - 44) * clamp(t / TL.duration), 2);
    ctx.restore();
  }

  // ───────────────────────── 합성
  let bufA;
  function drawScene(ctx, t) {
    if (t < b(8)) return sceneIntro(ctx, t);
    if (t < b(12)) return sceneType(ctx, t - b(8), t);
    const sl1 = b(12) + 0.36;
    if (t < sl1) {
      // 슬라이스 와이프: 가로 띠들이 번갈아 좌우로 빠지며 다음 씬을 드러냄
      sceneShape(ctx, t - b(12), t);
      const bctx = bufA.getContext('2d');
      prep(bctx);
      sceneType(bctx, t - b(8), t);
      const tt = t - b(12);
      const n = 8;
      const sh = H / n;
      for (let i = 0; i < n; i++) {
        const p = E.inExpo(inv(i * 0.018, i * 0.018 + 0.22, tt));
        const dx = (i % 2 ? 1 : -1) * W * p;
        ctx.drawImage(bufA, 0, i * sh * SCALE, W * SCALE, sh * SCALE, dx, i * sh, W, sh);
      }
      return;
    }
    if (t < b(16)) return sceneShape(ctx, t - b(12), t);
    const wh0 = b(20) - 0.13;
    const wh1 = b(20) + 0.14;
    if (t < wh0) return sceneSpace(ctx, t - b(16), t);
    if (t < wh1) {
      // 휩 팬
      const p = E.inOutExpo(inv(wh0, wh1, t));
      ctx.save();
      ctx.translate(-W * p, 0);
      sceneSpace(ctx, t - b(16), t);
      ctx.translate(W, 0);
      sceneData(ctx, t - b(20), t);
      ctx.restore();
      return;
    }
    if (t < b(24)) return sceneData(ctx, t - b(20), t);
    if (t < b(28)) return sceneMontage(ctx, t - b(24), t);
    return sceneEnd(ctx, t - b(28), t);
  }
  function prep(ctx) {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
  }
  function drawFrame(ctx, t) {
    prep(ctx);
    const sk = shake(t);
    ctx.save();
    if (sk) {
      ctx.translate(W / 2 + sk.x, H / 2 + sk.y);
      ctx.rotate(sk.r);
      ctx.scale(sk.s, sk.s);
      ctx.translate(-W / 2, -H / 2);
    }
    drawScene(ctx, t);
    ctx.restore();
    prep(ctx);
    hud(ctx, t);
    // 마지막 페이드 아웃
    const fo = inv(TL.duration - 0.32, TL.duration - 0.02, t);
    if (fo > 0) {
      ctx.globalAlpha = E.inOutSine(fo);
      fillBg(ctx, '#000');
      ctx.globalAlpha = 1;
    }
  }

  // ───────────────────────── content
  function applyContent(ct) {
    C = ct.palette;
    RGB = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, hexRgb(v)]));
    T = ct.text;
    TAGS = ct.shapeTags;
    // 언어별 콘텐츠가 글자 타이핑 큐(글자 수·간격)와 섹션 제목을 바꿀 수 있다. audio.py 도 같은 값을 읽는다
    if (ct.typing) TL.cues.typing = ct.typing;
    if (ct.sceneTitles) TL.scenes.forEach((sc, i) => (sc.title = ct.sceneTitles[i] ?? sc.title));
    const introR = rng(7);
    flyB = [...T.b].map(() => ({
      dx: (introR() - 0.5) * 1500,
      dy: (introR() - 0.5) * 900,
      rot: (introR() - 0.5) * 5,
      s0: 0.15 + introR() * 0.3,
    }));
    BARS = ct.chart.bars;
    LINE = ct.chart.line;
  }

  // ───────────────────────── boot
  async function boot() {
    TL = await (await fetch('timeline.json')).json();
    const contentFile = new URLSearchParams(location.search).get('content') || 'content.json';
    applyContent(await (await fetch(contentFile)).json());
    W = TL.width;
    H = TL.height;
    FPS = TL.fps;
    BEAT = 60 / TL.bpm;
    const text = allText();
    await Promise.all([
      document.fonts.load(`400 100px ${F.display}`, text),
      ...[100, 400, 700, 800, 900].map((w) => document.fonts.load(`${w} 100px ${F.sans}`, text)),
      document.fonts.load(`400 20px "JetBrains Mono"`, text),
      document.fonts.load(`700 20px "JetBrains Mono"`, text),
    ]);
    await document.fonts.ready;
    buildPoints();
    buildDust();

    const q = new URLSearchParams(location.search);
    SCALE = parseFloat(q.get('scale') || '1');
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(W * SCALE);
      c.height = Math.round(H * SCALE);
      return c;
    };
    const work = mk();
    const acc = mk();
    bufA = mk();
    const wctx = work.getContext('2d');
    const actx = acc.getContext('2d');
    const out = document.getElementById('out');
    out.width = work.width;
    out.height = work.height;
    const post = new window.Post(out, work.width, work.height);

    function frameAt(tc, samples, fps = FPS) {
      const shutter = 0.5 / fps; // 180° 셔터
      for (let k = 0; k < samples; k++) {
        const ts = Math.max(0, Math.min(TL.duration - 1e-4, tc + ((k + 0.5) / samples - 0.5) * shutter));
        drawFrame(wctx, ts);
        actx.globalAlpha = 1 / (k + 1);
        actx.drawImage(work, 0, 0);
      }
      actx.globalAlpha = 1;
      const f = fx(tc); // 픽셀 단위 효과는 출력 배율에 맞춘다
      f.ca *= SCALE;
      f.dir = [f.dir[0] * SCALE, f.dir[1] * SCALE];
      post.render(acc, f, tc);
    }

    window.REEL = { TL, fx, drawFrame };
    window.renderFrame = (f, samples = TL.samples, fps = FPS) => {
      frameAt(f / fps, samples, fps);
      return out.toDataURL('image/png');
    };

    const mode = q.get('mode') || 'play';
    if (mode === 'play') {
      if (q.has('t')) {
        frameAt(parseFloat(q.get('t')), TL.samples);
      } else {
        const audio = new Audio('../out/audio.wav');
        let t0 = null;
        const hint = document.getElementById('hint');
        const start = () => {
          hint && (hint.style.display = 'none');
          audio.currentTime = 0;
          audio.play().catch(() => {});
          t0 = performance.now();
        };
        document.addEventListener('click', start);
        const loop = () => {
          const t = t0 === null ? 0 : ((performance.now() - t0) / 1000) % TL.duration;
          frameAt(t, 1);
          requestAnimationFrame(loop);
        };
        loop();
      }
    }
    window.REEL_READY = true;
  }
  boot().catch((e) => {
    window.REEL_ERROR = String(e && e.stack ? e.stack : e);
    console.error(e);
  });
})();

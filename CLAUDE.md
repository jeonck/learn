# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- `showreel/` — a 15-second Korean motion-graphics showreel (1920×1080, 60fps) generated
  entirely from code: visuals in Canvas 2D + a WebGL post pass, soundtrack synthesized in numpy.
  The final deliverable is committed at `showreel/dist/showreel.mp4`.

## Commands (run inside `showreel/`)

- Install: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` and `pip install numpy imageio-ffmpeg`
  (imageio-ffmpeg is only needed when no system `ffmpeg` exists; `FFMPEG=/path` overrides).
- Full build (audio → frames → encode → `dist/showreel.mp4`): `npm run build` (~15 min on 4 cores).
- Soundtrack only: `npm run audio` → `out/audio.wav`.
- Frames only: `node scripts/render.mjs [--workers N] [--samples N] [--from F --to F]` → `out/video.mp4`.
- Spot-check frames instead of a full render (the equivalent of "running a single test"):
  `node scripts/render.mjs --stills 4.2,9.1 [--dir out/stills-x]`, or
  `bash scripts/sheet.sh <name> 2x2 4.2,9.1,11,14` for a tiled contact sheet at `out/sheet-<name>.png`.
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
- `node_modules/` and `out/` are git-ignored; only sources and the deliverables in `dist/` (the MP4, its
  poster and contact sheet, and the `tech-stack.png` pipeline diagram) are committed.

# 00. Code-built Korean motion showreel (this repo)

🇰🇷 [한국어](00-code-showreel.md)

| Item | Details |
| --- | --- |
| Video | ▶ [Korean reel](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel.mp4) · ▶ [English career reel](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel-en.mp4) |
| Tool | Claude Code (Canvas 2D + WebGL, numpy audio) |
| Output | 15 s, 1920×1080, 60fps, 128 BPM, no external assets |
| Source | [`showreel/`](../) |

## What it looks like

Kinetic type → shape morphing → 3D → data visualization → montage → end card. Every cut and sound effect lands on the beat from a single timeline file.

## Prompt to reproduce

```
Make a [length]-second [language] motion-graphics showreel for [purpose].
- Spec: 1920×1080, 60fps MP4 with sound; build both picture and music in code, no external assets
- Rhythm: cut, effects and sound on a [BPM] beat
- Structure: kinetic type → shape morphing → 3D → data visualization → montage → end card
- A different transition every time; high motion quality with easing, springs and motion blur
- Style: [background tone], palette [colour 1, colour 2, colour 3], font [font name]
- End card copy: [name / title / one-line intro]
- Render stills along the way, look at them yourself and fix what you see
Give it everything.
```

## What to change

- If you already have this repo, edit only `showreel/src/content.json` (copy, colours, numbers) and run `npm run build`.
- For a person's career version like the English reel, create `content.<name>.json` and build with `--content`.

## Why it works

- The single line "render stills and check them yourself" raises quality the most. That check caught unreadable dot-matrix text and a file-size problem.
- Leave the name and title blank and the model picks them for you. Always fill them in.

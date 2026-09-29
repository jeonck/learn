# 02. 3D card-deck brand showreel (Claude + Blender)

🇰🇷 [한국어](02-3d-brand-showreel.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@ai_sync_club thread](https://www.threads.com/@ai_sync_club/post/Ddt00M6k8sD) (6.8K views, 243 likes) · full prompt: [Sync Market](https://aisyncclub.com/market/b317891e-9a53-4ea6-bcb4-d734badf85dc) (free member login) |
| Tool | Claude Code + Blender 5.x + ffmpeg + Node.js |
| Output | About 14.5 s, 1920×1080, 60fps, 132 BPM over 8 bars, four 3D cards |

## What it looks like

A service promo reel where a glossy 3D card deck fanning out is rendered in Blender and composited over 2D motion graphics.

## Prompt to reproduce

Rewritten from the elements of the abbreviated version posted on Threads:

```
Make a 15-second 3D motion showreel announcing [service name].
- Spec: 1920×1080, 60fps MP4, [BPM] BPM over 8 bars
- 3D: in Blender, render [N] glossy cards ([label 1]·[label 2]·[label 3]·[label 4]) fanning out as a transparent-background sequence, and composite it over 2D motion graphics
- Palette: only five colours — [paper]·[ink]·[accent 1]·[accent 2]·[accent 3]
- Shot order: hook → 3D deck → download → stamp → mosaic → check → montage → end card
- On-screen copy: only "[headline]" and "[sub line]"; write no other sentences
- Synthesize new music and sound effects on the beat
- After rendering, check the frames yourself and fix them
```

## What to change

- Service name, card labels, palette and the two lines of copy. Rename the shots to match your service's flow (discover → choose → get → confirm).
- Without Blender, ask for CSS/WebGL 3D cards instead of the 3D deck.

## Why it works

- **Time in beats**: giving BPM and bars puts every cut on the music grid.
- **Shot list = storyboard**: eight nouns remove the structure guesswork.
- **Palette limited by role** and **pinned copy** prevent typos and invented claims.
- **Clear tool boundaries**: 3D in Blender, compositing in 2D.

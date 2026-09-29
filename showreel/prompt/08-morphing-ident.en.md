# 08. Morphing ident of shapes, animals and letters (for video models)

🇰🇷 [한국어](08-morphing-ident.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@hanpro_automation thread](https://www.threads.com/@hanpro_automation/post/DcSCphCm0Vs) (full prompt in replies 1–4) · original prompt author [@jh_aicafe](https://www.threads.com/@jh_aicafe) |
| Tool | Originally for Google Flow; reproduced with MiniMax H3 locally (1344×768, 24fps, about 10 s, with sound effects) |
| Output | A 10-second ident flowing ribbon → shapes → jellyfish → fox → the words "MOTION BECOMES ALIVE" |

## What it looks like

Flat-vector morphing where silhouettes physically transform into each other with no crossfades. This is a prompt for a **video-generation model**, not code.

## Prompt to reproduce

Following the original's structure (concept · palette · five shots timed to the second · style · avoid list · sound):

```
Create a 10-second studio ident in bold minimalist 2D motion design.
CONCEPT: ribbons, geometric shapes, animals and letters keep transforming into one another.
PALETTE: [cobalt blue], [acid lime], [coral pink], [warm cream], [near-black].

SHOT 1 (0–1.7s): cream background; a liquid ribbon sweeps in and curls, then becomes spiral → triangle → hexagon → bouncing ball; the ball squashes on impact with a shock ring and turns into [animal A].
SHOT 2 (1.7–3.7s): [animal A] stretches into [animal B], then a chain of real silhouette changes ([B] → [C] → [D] → [B]); body parts become each other's parts, no crossfades.
SHOT 3 (3.7–5.6s): it collapses into a circle, splits into orbiting pieces, and the pieces snap into several symbols in quick succession while the rhythm speeds up.
SHOT 4 (5.6–8.0s): the shapes physically become the letters of "[YOUR PHRASE]", each letter landing on its own.
SHOT 5 (8.0–10.0s): one letter blinks like an eye, the phrase bounces, a small [animal] circles the type trailing a ribbon, lands on the last letter, freeze.

STYLE: crisp flat vector, seamless contour morphing, squash and stretch, magnetic snapping; every change must look physically motivated.
AVOID: photorealism, gradients, realistic shadows, particles, lens effects, glitch, 3D depth.
SOUND: elastic pops, wooden clicks, magnetic snaps, whips over a minimal electronic groove near [150] BPM.
```

## What to change

- The five-colour palette, the animal chain and the final phrase. Short uppercase English phrases come out with the most accurate spelling.

## Why it works

- **Per-second shot timecodes** direct the editing rhythm from text.
- **The avoid list** blocks the usual video-model defects (gradients, particles, glitches).
- One criterion, "physically motivated changes", prevents random AI morphing.
- Because the same prompt can run on different tools, it doubles as a model benchmark.

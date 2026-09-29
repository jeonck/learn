# 04. Self-intro showreel from a portfolio link

🇰🇷 [한국어](04-portfolio-showreel.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@doeun_company thread](https://www.threads.com/@doeun_company/post/DdwJM-yCI5u) |
| Tool | Claude Opus 5.5 (HTML/CSS/JS animation → frame capture → 60fps) |
| Output | Portfolio reel using career, awards and about 90 project images, with synthesized music |

## What it looks like

A reel whose concept comes from the sentences and images in a Notion portfolio, with type, transitions, a 3D card wall and particles all built in code.

## Prompt to reproduce

The original ask was one line: a portfolio link plus "make a showreel introducing me". Spelling out the resulting pipeline:

```
Read [portfolio URL] yourself and make a motion-graphics showreel introducing me.
- Collect career, awards and project images, and build the concept from sentences in the portfolio
- Don't state anything that isn't in the portfolio
- Build type, transitions, a 3D card wall and particles as HTML/CSS/JS animation,
  capture it frame by frame in the browser and render a 60fps MP4
- For fast motion, blend several samples per frame for motion blur
- Synthesize the music and sound effects (kick, synth, typing, impacts) in code and line cuts up with the beat
```

## What to change

- The portfolio URL (Notion, Behance, personal site). For pages behind a login, export a PDF and attach it.

## Why it works

- **Content from material, form from one line**: little room for wrong facts.
- The resulting pipeline is the same as [00](00-code-showreel.en.md): the standard structure Opus 5.5 picks on its own for a showreel.

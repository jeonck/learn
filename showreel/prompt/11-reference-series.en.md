# 11. Extend a series from your own past work

🇰🇷 [한국어](11-reference-series.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@nono_ai_archive thread](https://www.threads.com/@nono_ai_archive/post/DdtM0rejYp4) (2.4K views) — method in the author's reply |
| Tool | Claude Opus 5.5 |
| Output | A new explainer, "How does AI process a sentence?", in the visual grammar of the author's earlier motion graphics |

## What it looks like

A short explainer that keeps the tone, layout and motion of a few motion-graphics pieces you've already made, with only the topic changed. Use it to continue a series.

## Prompt to reproduce

The author shared the method (reference → generate → direct) rather than a prompt. Following that method:

```
The [N] attached videos are my motion-graphics series.
First, summarize their shared visual grammar: colours, fonts, layout, transitions, pace of motion, music tone.
Then make a new episode in that same grammar.
- Topic: [new topic, e.g. How does AI process a sentence?]
- Length: [length] s, ratio: [ratio]
- Explainer style: one concept per scene, shown as a diagram
- Add nothing that departs from the grammar you summarized
```

## Refining notes

The first pass was decent but needed a few rounds of direction. Point at specific differences and name an episode, e.g. "transition this scene like episode 2", to converge fast.

## Why it works

- **Your work instead of a style description**: series consistency comes for free.
- **Grammar first**: the model explicitly agrees on what to follow before building.
- Much faster than starting from scratch each time; especially suited to explainer and serial content.

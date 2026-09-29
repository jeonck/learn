# 01. One-sentence one-shot showreel

🇰🇷 [한국어](01-oneshot-showreel.md)

| Item | Details |
| --- | --- |
| Source & video | ▶ [@pinksoldiersvlog thread](https://www.threads.com/@pinksoldiersvlog/post/Ddt090_E5KV) (28K views, 235 likes) |
| Tool | Claude Code Opus 5.5, high reasoning |
| Output | 15-second Korean motion-graphics showreel, one shot, with music, no external assets |

## What it looks like

A "designer introduces themselves" reel where the model chose the structure, colours and music on its own. The style differs every run.

## Prompt to reproduce

The original is one sentence. Rewritten with the same elements:

```
Make a dynamic 15-second Korean motion-graphics video that proves what an outstanding motion designer you are,
like a showreel you'd attach to a résumé. Give it everything.
```

## What to change

- Change only the language (`Korean`) and length (`15-second`). Adding more narrows the model's choices.
- If you need a fixed result, move to [00](00-code-showreel.en.md) or [02](02-3d-brand-showreel.en.md).

## Why it works

- **A role**: "prove what an outstanding designer you are" makes the model show off its skill rather than just meet the request.
- **One genre word**: "résumé showreel" carries the genre's conventions (short, punchy, beat-synced) in one go.
- **Minimal constraints**: only length, language and tone are fixed; the rest is delegated.
- **Effort level**: "give it everything", together with high reasoning, keeps it from stopping at a draft.

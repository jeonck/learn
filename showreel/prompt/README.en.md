# Showreel Prompt Showcase

🇰🇷 [한국어](README.md)

Pick the showreel you want, copy the prompt from its doc, and fill in the bracketed slots to get the same style.
The examples come from Threads (Aug–Sep 2026) plus this repo's own reel; each doc links to the original post, where the video plays.
Every demo doc also has a Korean version, linked at its top.

## Pick by use

| # | Demo | Use it when you want | Tool | Video |
| --- | --- | --- | --- | --- |
| 00 | [Code-built Korean motion showreel](00-code-showreel.en.md) | Exact control of structure, beat and copy, rebuildable after edits | Claude Code | [▶](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel.mp4) |
| 01 | [One-sentence one-shot showreel](01-oneshot-showreel.en.md) | To hand everything to the model and see its best | Claude Code Opus 5.5 | [▶](https://www.threads.com/@pinksoldiersvlog/post/Ddt090_E5KV) |
| 02 | [3D card-deck brand showreel](02-3d-brand-showreel.en.md) | A service or product promo with a 3D look | Claude Code + Blender | [▶](https://www.threads.com/@ai_sync_club/post/Ddt00M6k8sD) |
| 03 | [App promo video](03-app-promo.en.md) | An ad-style teaser built from real app screens | Claude Code Opus 5.5 | [▶](https://www.threads.com/@go_tworavel/post/Ddq5DmME47e) |
| 04 | [Portfolio self-intro showreel](04-portfolio-showreel.en.md) | A reel from a portfolio you already have | Claude Opus 5.5 | [▶](https://www.threads.com/@doeun_company/post/DdwJM-yCI5u) |
| 05 | [Style locked by a material sheet](05-material-sheet.en.md) | An exact illustration or character style | ChatGPT Astra | [▶](https://www.threads.com/@prompt_what/post/DdOAI1cis07) |
| 06 | [Black-and-white plus one accent](06-minimal-motivation.en.md) | A polished vertical short, fast | Google Omni | [▶](https://www.threads.com/@kirin.cookie/post/Dc8V7Tljbdn) |
| 07 | [Nickname ident](07-nickname-ident.en.md) | Personal branding from a name and one symbol | ChatGPT Astra | [▶](https://www.threads.com/@ssaengcho/post/Dc8NAi3GsRj) |
| 08 | [Morphing ident](08-morphing-ident.en.md) | Shapes, animals and letters morphing, with a video-generation model | Google Flow / MiniMax H3 | [▶](https://www.threads.com/@hanpro_automation/post/DcSCphCm0Vs) |
| 09 | [Promo from attached material](09-attached-data-promo.en.md) | Introducing a person, class, shop or event from your own material | Claude | [▶](https://www.threads.com/@english.is.daisy/post/Dd0fWrJiFXP) |
| 10 | [Image first, motion second](10-image-to-motion.en.md) | To animate a designed image or PSD as it is | Claude Opus 5.5 | [▶](https://www.threads.com/@ssaengcho/post/Dd1QcoSGr_9) |

## Pick by control

```
delegate ◀──────────────────────────────────────────▶ control
 01 one-shot   07 nickname   06 minimal   04 portfolio   09 attached   03 app promo   05 material sheet   10 image first   02 3D brand / 08 morphing   00 code reel
```

- Write short and set a high bar, and the model does well on its own (01, 07). Results differ every run.
- When brand or facts matter, pin BPM, shot order, palette and copy (02, 08, 00).
- Give content as material: a portfolio (04), the real app (03), a material sheet (05), attached files (09), a finished image or PSD (10).
- Don't aim for one shot: get the outline first, then refine with short notes (03, 09).

## Doc format

Every demo doc follows the same order: source & video → what it looks like → prompt to reproduce → what to change → why it works.
The reproduction prompts are rewritten from the elements of each original, except 09, which is a translation of the author's shared template. Originals are at each source link.

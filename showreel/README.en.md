# CK Jeon — Platform Engineering Reel 2026

A 15-second, 1920×1080, 60fps motion-graphics career reel. Every frame and every sound is generated from code.

🇰🇷 [한국어 README](README.md)

[![CK Jeon — Platform Engineering Reel, click to play](dist/poster-en.jpg)](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel-en.mp4)

▶ [Watch the reel](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel-en.mp4) · ⬇ [Download MP4 (18 MB)](https://github.com/jeonck/learn/raw/main/showreel/dist/showreel-en.mp4) · 📘 [How it was made — AI Usecases](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/#english-career-reel)

![Contact sheet — 12 frames from the reel](dist/contact-sheet-en.jpg)

## What's in it

Cut to a 128 BPM soundtrack; each section is 4 beats (1.875 s). All figures come from my resume.

| Time | Section | On screen |
| --- | --- | --- |
| 0.00–3.75 | Intro | "Platforms that never **SLEEP.**" — 24x7, mission-critical operations |
| 3.75–5.63 | Skill stack | Kubernetes, Terraform, GitOps, AWS, Azure, ArgoCD, GitLab CI, Datadog, Prometheus, Grafana, Python, FastAPI, LLM infra — "Infrastructure as **Code**" |
| 5.63–7.50 | Automation | Shapes that scale, automate, migrate and monitor on the beat |
| 7.50–9.38 | Kubernetes | 2,000 particles form a sphere, a torus, then **K8S** |
| 9.38–11.25 | Impact | **12+ years** · **7 CI/CD pipelines** modernized · **30+ infra incidents** coordinated · career arc 2009 → 2026 |
| 11.25–13.13 | Expertise | PLATFORM · KUBERNETES · GITOPS · AUTOMATE · **SRE — 99.99% availability** · AI INFRA → SHIP |
| 13.13–15.00 | Signature | **CK** — Platform Engineering Leader |

## How it's built

- **Visuals:** Canvas 2D scenes rendered as a pure function of time, 6 sub-frames per frame for real motion blur, then a WebGL2 pass for zoom/whip blur, chromatic aberration, glitch and film grain.
- **Sound:** synthesized with numpy — kick, bass, pads, risers and a typing tick per letter — from the same `timeline.json` cues the visuals read, so every hit lands on its frame.
- **Content:** this version is `src/content.en.json` on the same engine as the Korean reel; only text, numbers and labels differ.
- **Render:** headless Chromium ×4 in parallel → ffmpeg, H.264 CRF 21 + AAC in one encode.

```bash
npm install && pip install numpy imageio-ffmpeg
npm run draft -- --content content.en.json   # 960×540·30fps draft → out/draft-en.mp4 (~80 s)
npm run build -- --content content.en.json   # final 1080p60 → dist/showreel-en.mp4 (~14 min on 4 cores)
```

## Showreel prompts shared on Threads (collected 2026-09)

> 🎬 Reproducible prompt docs for each example, with video links, are in the [prompt showcase](../prompt/README.en.md).

Examples found on Threads by searching "쇼릴" (showreel), "쇼릴 프롬프트" and "모션그래픽 프롬프트", picked because the
prompt was public and the result was well received. Full prompts are behind each link; only the gist and why it works are here.

| Example | Prompt gist | Why it works |
| --- | --- | --- |
| [@pinksoldiersvlog](https://www.threads.com/@pinksoldiersvlog/post/Ddt090_E5KV) — Claude Code Opus 5.5, one shot | One sentence: a dynamic 15-second Korean motion-graphics video that shows what an amazing motion designer you are, like a résumé showreel, give it everything | The role makes the model prove its skill; "résumé showreel" carries the genre's conventions (short, punchy, beat-synced) in one word. Only length, language and tone are fixed; everything else is left to the model |
| [@ai_sync_club](https://www.threads.com/@ai_sync_club/post/Ddt00M6k8sD) — Claude + Blender | 60fps, 132 BPM, 8 bars; four 3D cards; 5-colour palette; 8 shots in order; only two approved lines of copy; new music and SFX on the beat | Time is defined in beats, the shot list stands in for a storyboard, the palette is limited by role name, and pinned copy prevents typos and invented claims |
| [@doeun_company](https://www.threads.com/@doeun_company/post/DdwJM-yCI5u) — Opus 5.5 | A Notion portfolio link plus "make a motion-graphics showreel introducing me" | The source material supplies the content and one line sets the form, so there is little room for wrong facts. The resulting pipeline (code animation → frame capture at 60fps → sub-frame motion blur → beat-aligned synthesized sound) matches this repo's |
| [@prompt_what](https://www.threads.com/@prompt_what/post/DdOAI1cis07) — Astra | First a 6×6 material sheet (characters, props, type, ornaments, spaced apart), then "make a motion-graphics demo from these materials" | Style is pinned by an image instead of words, and separated elements are easy to animate individually, so fewer revision rounds |
| [@kirin.cookie](https://www.threads.com/@kirin.cookie/post/Dc8V7Tljbdn) — Google Omni | Black background, white lines, basic shapes; 15-second short-form motivational piece; one mint accent colour; English copy and music | Tight limits on colour (mono plus one accent) and form (basic shapes) look polished on any model |
| [@go_tworavel](https://www.threads.com/@go_tworavel/post/Ddq5DmME47e) — Claude Code Opus 5.5, app promo | Opening ask: an app promo Casey Neistat would envy, fast like an iPhone ad teaser. Merged with later feedback: brand story about the app's core value rather than features; hook in the first second with a scene everyone has lived; iPhone-keynote opening of big type on black; one word per beat in the drop; real app screens only; compose the music; end on a brand line plus logo; show the outline before building | Two references (a creator and an ad genre) set the tone at once; it decides what to say (value), how to open (a 1-second hook) and how much per beat (one word). "Real screens only" blocks fake UI, and asking for the outline first makes direction changes cheap. It was then refined with short notes like "tacky", "weak hook", "faster" |

What they share:

- To pull out the model's best, keep it short and set the bar high (#1). When brand or factual accuracy matters, pin BPM, shots, palette and copy (#2).
- Give length in BPM and bars rather than seconds, so the edit locks to the beat.
- Supply content as material (a portfolio, a material sheet) and let the prompt focus on form.
- Don't aim for one shot: get the outline first, then refine with short notes like "tacky" or "faster" (#6).
- Asking for "no external assets, compose the music too" gives a self-contained, copyright-free result.

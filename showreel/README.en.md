# CK Jeon — Platform Engineering Reel 2026

A 15-second, 1920×1080, 60fps motion-graphics career reel. Every frame and every sound is generated from code.

🇰🇷 [한국어 README](README.md)

[![CK Jeon — Platform Engineering Reel, click to play](dist/poster-en.jpg)](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel-en.mp4)

▶ [Watch the reel](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel-en.mp4) · ⬇ [Download MP4 (18 MB)](https://github.com/jeonck/learn/raw/main/showreel/dist/showreel-en.mp4) · 📘 [How it was made — AI Usecases (Korean)](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/#같은-엔진으로-영문-경력-쇼릴--내용만-바꿔-한-편-더)

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

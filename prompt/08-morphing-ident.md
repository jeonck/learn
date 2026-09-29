# 08. 도형·동물·글자가 이어지는 모핑 아이덴트 (영상 모델용)

| 항목 | 내용 |
| --- | --- |
| 원본·영상 | ▶ [@hanpro_automation 스레드](https://www.threads.com/@hanpro_automation/post/DcSCphCm0Vs) (프롬프트 전문은 답글 1~4) · 원 프롬프트 작성자 [@jh_aicafe](https://www.threads.com/@jh_aicafe) |
| 도구 | 원래 Google Flow용, 재현은 MiniMax H3 로컬 (1344×768, 24fps, 약 10초, 효과음 포함) |
| 결과 | 리본 → 도형 → 해파리 → 여우 → 글자 "MOTION BECOMES ALIVE"로 이어지는 10초 아이덴트 |

## 이런 영상

크로스페이드 없이 실루엣이 물리적으로 변형되며 이어지는 플랫 벡터 모핑. 코드가 아니라 **영상 생성 모델**용 프롬프트다.

## 재현 프롬프트

원문의 구조(콘셉트 · 팔레트 · 초 단위 샷 5개 · 스타일 · 금지 목록 · 사운드)를 따라 다시 쓰면:

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

## 바꿔 쓸 곳

- 팔레트 5색, 동물 체인, 마지막 문구. 문구는 짧은 영문 대문자일수록 철자가 정확하게 나온다.

## 잘 된 이유

- **초 단위 샷 타임코드**로 편집 호흡을 텍스트에서 지시한다.
- **금지 목록(AVOID)**이 영상 모델 특유의 흔한 결함(그라디언트, 파티클, 글리치)을 막는다.
- "물리적으로 동기가 있는 변형"이라는 기준 한 줄이 무작위 AI 모핑을 막는다.
- 같은 프롬프트로 도구만 바꿔 비교할 수 있어 모델 벤치마크로도 쓰인다.

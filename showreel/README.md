# Claude 모션 쇼릴 2026

15초, 1920×1080, 60fps 한글 모션그래픽 쇼릴. 영상과 사운드를 모두 코드로 만들었다.
완성본: [`dist/showreel.mp4`](dist/showreel.mp4)

![컨택트 시트](dist/contact-sheet.jpg)

## 구성 (128 BPM, 4박 = 1.875초 단위)

| 시간 | 섹션 | 보여주는 기술 |
| --- | --- | --- |
| 0.00–3.75 | 00 인트로 | 비트에 맞춰 퍼지는 링, 커서가 된 점, 가변 폰트 굵기 애니메이션(100→800), 스프링 플라이인, 슬램 + 에코, 아이리스 전환 |
| 3.75–5.63 | 01 키네틱 타이포그래피 | 비트에 스냅하는 계단형 마퀴, 사인파 웨이브·스큐, 원형 텍스트 배지 |
| 5.63–7.50 | 02 셰이프 & 리듬 | 슬라이스 와이프, 폴리곤 모핑, 스쿼시 & 스트레치, 오버슈트 회전, 중앙 원 아이리스 |
| 7.50–9.38 | 03 공간 & 깊이 | 2,000개 점의 3D 구 → 토러스 → "공간" 글자 모핑, 원근 투영, 깊이 색상 |
| 9.38–11.25 | 04 데이터 시각화 | 휩 팬, 오도미터 카운터, 스프링 막대 차트, 라인 드로잉 + 값 트래커 |
| 11.25–13.13 | 05 몽타주 | 8분음표 컷 6개(스택·에코·스플릿·스트라이프), 16분음표 스터터, 한 칸의 정적 |
| 13.13–15.00 | 06 엔드 카드 | 충격파 + 파티클 버스트, 블록 리빌, 로고 마크, 타이핑 |

## 파이프라인

![기술 구성도](dist/tech-stack.png)

```
src/timeline.json ──┬─► src/reel.js ─► (서브프레임 6장 누적 = 모션 블러) ─► src/post.js (WebGL)
  BPM·씬·큐 공유    │        헤드리스 Chromium 4개가 병렬로 프레임 캡처 ─► ffmpeg ─► out/video.mp4
                    └─► scripts/audio.py (numpy 신스) ─► out/audio.wav ─────────────┴─► dist/showreel.mp4
```

- **모든 프레임은 시간 t의 순수 함수** — 상태가 없어서 병렬 렌더와 서브프레임 모션 블러가 가능하다.
- **소리와 그림이 같은 큐를 읽는다** — 임팩트, 글자 타이핑 틱, 휘시, 라이저, 무음 구간이
  `timeline.json` 한 곳에서 정의되어 샘플 단위로 맞는다.
- **포스트 프로세싱** — 줌/방향 블러, 색수차, 글리치, 플래시, 비네팅, 30Hz 필름 그레인.

## 빌드

```bash
npm install            # 폰트(Pretendard, Black Han Sans, JetBrains Mono) + Playwright
pip install numpy imageio-ffmpeg   # 시스템 ffmpeg가 있으면 imageio-ffmpeg는 생략 가능
npm run build          # 사운드 → 렌더 → 인코딩 → dist/showreel.mp4 (4코어 기준 ~12분)
```

그 밖에:

```bash
npm run preview                              # 브라우저 실시간 재생 (클릭하면 사운드)
node scripts/render.mjs --stills 4.2,9.1     # 특정 시점 스틸 → out/stills/
bash scripts/sheet.sh 이름 2x2 4.2,9.1,11,14  # 검수용 컨택트 시트 → out/sheet-이름.png
npm run audio                                # 사운드만 다시 합성
```

Playwright용 Chromium은 따로 받지 않고 시스템에 설치된 것을 쓴다
(`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install`).

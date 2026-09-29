# 쇼릴 프롬프트 쇼케이스

🇺🇸 [English](README.en.md)

원하는 쇼릴을 고르고, 그 문서의 프롬프트를 복사해 대괄호 칸만 바꾸면 같은 스타일로 만들 수 있다.
Threads에 공유된 사례(2026-08~09)와 이 저장소의 쇼릴을 모았다. 각 문서의 원본 링크에서 실제 영상을 볼 수 있다.

## 고르기

| # | 데모 | 이런 영상이 필요할 때 | 도구 | 영상 |
| --- | --- | --- | --- | --- |
| 00 | [코드로 만든 한글 모션 쇼릴](00-code-showreel.md) | 구성·박자·문구를 정확히 통제하고, 수정해서 다시 빌드 | Claude Code | [▶](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel.mp4) |
| 01 | [한 문장 원샷 쇼릴](01-oneshot-showreel.md) | 모델에게 전부 맡겨 최대 역량을 보고 싶을 때 | Claude Code Opus 5.5 | [▶](https://www.threads.com/@pinksoldiersvlog/post/Ddt090_E5KV) |
| 02 | [3D 카드 덱 브랜드 쇼릴](02-3d-brand-showreel.md) | 서비스·상품 홍보, 3D 질감이 필요할 때 | Claude Code + Blender | [▶](https://www.threads.com/@ai_sync_club/post/Ddt00M6k8sD) |
| 03 | [앱 홍보 영상](03-app-promo.md) | 실제 앱 화면으로 광고 티저를 만들 때 | Claude Code Opus 5.5 | [▶](https://www.threads.com/@go_tworavel/post/Ddq5DmME47e) |
| 04 | [포트폴리오 자기소개 쇼릴](04-portfolio-showreel.md) | 이미 정리된 포트폴리오가 있을 때 | Claude Opus 5.5 | [▶](https://www.threads.com/@doeun_company/post/DdwJM-yCI5u) |
| 05 | [재료 시트로 스타일 고정](05-material-sheet.md) | 일러스트·캐릭터 스타일을 정확히 맞추고 싶을 때 | ChatGPT Astra | [▶](https://www.threads.com/@prompt_what/post/DdOAI1cis07) |
| 06 | [흑백 + 포인트 1색 미니멀](06-minimal-motivation.md) | 세로 숏폼, 빠르게 세련된 결과 | Google Omni | [▶](https://www.threads.com/@kirin.cookie/post/Dc8V7Tljbdn) |
| 07 | [닉네임 아이덴트](07-nickname-ident.md) | 이름과 상징 하나로 개인 브랜딩 | ChatGPT Astra | [▶](https://www.threads.com/@ssaengcho/post/Dc8NAi3GsRj) |
| 08 | [모핑 아이덴트](08-morphing-ident.md) | 영상 생성 모델로 도형·동물·글자 변형 연출 | Google Flow / MiniMax H3 | [▶](https://www.threads.com/@hanpro_automation/post/DcSCphCm0Vs) |
| 09 | [자료 첨부형 홍보 영상](09-attached-data-promo.md) | 사람·강의·가게·행사를 자료 기반으로 소개할 때 | Claude | [▶](https://www.threads.com/@english.is.daisy/post/Dd0fWrJiFXP) |
| 10 | [이미지 먼저, 모션은 나중에](10-image-to-motion.md) | 디자인한 이미지·PSD를 그대로 살려 움직이고 싶을 때 | Claude Opus 5.5 | [▶](https://www.threads.com/@ssaengcho/post/Dd1QcoSGr_9) |

## 통제 수준으로 고르기

```
맡김 ◀──────────────────────────────────────────▶ 통제
 01 원샷   07 닉네임   06 미니멀   04 포트폴리오   09 자료 첨부   03 앱 홍보   05 재료 시트   10 이미지 먼저   02 3D 브랜드 / 08 모핑   00 코드 쇼릴
```

- 짧게 쓰고 목표를 높이면 모델이 알아서 잘 만든다(01, 07). 결과는 매번 다르다.
- 브랜드·사실이 중요하면 BPM·샷 순서·팔레트·문구를 고정한다(02, 08, 00).
- 내용은 자료로 준다: 포트폴리오(04), 실제 앱(03), 재료 시트(05), 첨부 자료(09), 완성 이미지·PSD(10).
- 한 번에 끝내려 하지 말고 구성안을 먼저 받은 뒤 짧은 피드백으로 다듬는다(03, 09).

## 문서 형식

모든 데모 문서는 같은 순서다: 원본·영상 → 이런 영상 → 재현 프롬프트 → 바꿔 쓸 곳 → 잘 된 이유.
재현 프롬프트는 원문의 구성 요소를 따라 다시 쓴 것이다(09는 작성자가 공유한 템플릿 그대로). 원문은 각 원본 링크에 있다.

# 12. 완성 카드를 키프레임으로 쓰는 모션그래픽 뮤비

🇺🇸 [English](12-card-keyframe-mv.en.md)

| 항목 | 내용 |
| --- | --- |
| 원본·영상 | ▶ [@crome.ai 스레드](https://www.threads.com/@crome.ai/post/DcdiT0uDUcf) "사랑의 자음 모음" — 제작 흐름은 답글 2, 앞 15초 프롬프트는 답글 3 |
| 도구 | Claude Code (Opus 5) 기획·이미지 → MiniMax H3 영상 → Gemini 가사·타임라인 추출 → Suno 음악 |
| 결과 | 30초, 16:9, 글래스모피즘 한글 자모 타이틀 시퀀스 겸 뮤직비디오 |

## 이런 영상

두 캐릭터가 유리 질감의 한글 자모, 하트, 리본 트랙 사이를 오가며 끊김 없이 변신하는 캔디 컬러 2.5D 모션그래픽. 음악은 영상을 먼저 만든 뒤 기획서에 맞춰 붙였다.

## 재현 프롬프트

1단계, 기획과 카드 (Claude Code):

```
[주제] 30초 모션그래픽을 [스타일: 글래스모피즘·디퓨즈 무드]로 기획해 줘.
- 섹션 [6]개, 섹션마다 도착 장면이 되는 완성 카드 이미지를 하나씩 만들 것 (화면 글자 포함)
- 등장인물이 있으면 얼굴·머리·의상을 고정할 턴어라운드 시트도 만들 것
- 컨펌 후 영상 모델용 프롬프트를 써 줘
```

2단계, 영상 모델 프롬프트의 뼈대 (원문 구조를 따라 다시 쓴 것):

```
[15]-second 16:9 title sequence as ONE CONTINUOUS TRANSFORMATION.
REFERENCES: Picture 1–[6] are finished cards and the authority on layout, type and colour; each is the state its section arrives at.
Picture [7–8] are character sheets for faces, hair and wardrobe only; never copy their backgrounds or poses.
ORDER: the closing object of each card physically becomes the opening object of the next: [heart → letters → strokes → track → strip → bowl].
TEXT: all lettering already exists on the cards; reveal it with light or glass sweeps, then freeze it. Never redraw, add or misspell letters.
CONTINUITY: the characters' motion carries across transitions; a reach begun at one card's end completes at the next.
TIMING: anticipation, fast launch, overshoot, one elastic settle; something changes every third of a second; each card lands sooner than the last.
STYLE: glossy candy-coloured 2.5D glass, rim light, soft bevels, [palette]. Static camera. No subtitles or extra text.
Then a timecoded beat list: [0s–0.9s] …, [0.9s–1.8s] …
```

3단계, 음악: 기획서를 주고 "30초 타임라인에 맞는 가사와 음악 프롬프트를 뽑아 줘" → 음악 생성 도구로 30초 음원 생성 → 후보정으로 싱크.

## 바꿔 쓸 곳

- 주제, 카드 6장의 내용, 캐릭터, 팔레트, 변신 체인. 카드 수를 줄이면 한 장면이 더 오래 머문다.

## 잘 된 이유

- **완성 카드 = 키프레임**: 각 섹션의 도착 장면을 이미지로 못박아 구도·글자가 흔들리지 않는다([10](10-image-to-motion.md)과 같은 원리).
- **텍스트 잠금 규칙**: 글자는 새로 그리지 않고 드러내기만 해 영상 모델의 오탈자를 막는다.
- **규칙을 이름 붙여 나열**(연속성, 긴장, 모핑, 스타일, 프레이밍): 긴 프롬프트도 모델이 조항별로 지킨다.
- **영상 먼저, 음악은 기획서로**: 같은 타임라인에서 가사·음악을 뽑아 컷과 음악이 맞는다.

# 00. 코드로 만든 한글 모션 쇼릴 (이 저장소)

🇺🇸 [English](00-code-showreel.en.md)

| 항목 | 내용 |
| --- | --- |
| 영상 | ▶ [한글판](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel.mp4) · ▶ [영문 경력판](https://aiusecases.metacog.co.kr/docs/usecases/media/code-motion-showreel-claude-code/showreel-en.mp4) |
| 도구 | Claude Code (Canvas 2D + WebGL, numpy 사운드) |
| 결과 | 15초, 1920×1080, 60fps, 128 BPM, 외부 에셋 없음 |
| 소스 | [`showreel/`](../) |

## 이런 영상

키네틱 타이포 → 셰이프 모핑 → 3D → 데이터 시각화 → 몽타주 → 엔드 카드. 모든 컷·효과음이 한 타임라인 파일로 박자에 맞는다.

## 재현 프롬프트

```
[용도]용 [길이]초 [언어] 모션그래픽 쇼릴을 만들어줘.
- 스펙: 1920×1080, 60fps MP4, 사운드 포함, 외부 에셋 없이 영상·음악 모두 코드로
- 리듬: [BPM] 비트에 컷·효과·사운드를 맞춰서
- 구성: 키네틱 타이포 → 셰이프 모핑 → 3D → 데이터 시각화 → 몽타주 → 엔드 카드
- 트랜지션은 매번 다르게, 이징·스프링·모션 블러로 움직임 품질을 높게
- 스타일: [배경 톤], 팔레트 [색1, 색2, 색3], 폰트 [폰트명]
- 엔드 카드 문구: [이름 / 직함 / 한 줄 소개]
- 중간에 스틸 컷을 렌더해서 직접 보고 고쳐줘
전력을 다해서.
```

## 바꿔 쓸 곳

- 이미 이 저장소가 있다면 `showreel/src/content.json`(문구·색·수치)만 고치고 `npm run build`.
- 영문판처럼 사람 경력 버전은 `content.<이름>.json` 을 만들고 `--content` 로 빌드.

## 잘 된 이유

- "스틸 컷을 렌더해 직접 보고 고쳐줘" 한 줄이 품질을 가장 크게 올린다. 읽히지 않는 글자, 파일 용량 문제를 이 확인에서 찾았다.
- 이름·직함을 비워 두면 모델이 임의로 정한다. 꼭 채운다.

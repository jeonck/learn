#!/usr/bin/env bash
# 전체 빌드: 사운드 합성 → 프레임 렌더 + 인코딩 + 오디오 먹싱을 한 번에
#   bash scripts/build.sh                              최종본 → dist/showreel.mp4
#   bash scripts/build.sh --draft                      초안 (540p30, 서브프레임 1장) → out/draft.mp4
#   bash scripts/build.sh --content content.en.json    영문판 → dist/showreel-en.mp4 (--draft 와 함께 쓰면 out/draft-en.mp4)
set -euo pipefail
cd "$(dirname "$0")/.."
FF=${FFMPEG:-$(command -v ffmpeg || python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
export FFMPEG=$FF

CONTENT=content.json
args=("$@")
for i in "${!args[@]}"; do [[ "${args[$i]}" == "--content" ]] && CONTENT="${args[$((i + 1))]}"; done
SUFFIX=""
[[ "$CONTENT" != "content.json" ]] && SUFFIX="-$(basename "$CONTENT" .json | sed 's/^content\.\{0,1\}//')"
AUDIO="out/audio$SUFFIX.wav"

python3 scripts/audio.py --content "src/$CONTENT" --out "$AUDIO"
if [[ " $* " == *" --draft "* ]]; then
  node scripts/render.mjs --audio "$AUDIO" "$@"
else
  mkdir -p dist
  node scripts/render.mjs --audio "$AUDIO" --out "dist/showreel$SUFFIX.mp4" "$@"
fi

#!/usr/bin/env bash
# 전체 빌드: 사운드 합성 → 프레임 렌더 + 인코딩 + 오디오 먹싱을 한 번에 → dist/showreel.mp4
#   bash scripts/build.sh            최종본 (1080p60, 서브프레임 6장, CRF 21)
#   bash scripts/build.sh --draft    초안 (540p30, 서브프레임 1장) → out/draft.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
FF=${FFMPEG:-$(command -v ffmpeg || python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
export FFMPEG=$FF

python3 scripts/audio.py
if [[ " $* " == *" --draft "* ]]; then
  node scripts/render.mjs --audio out/audio.wav "$@"
else
  mkdir -p dist
  node scripts/render.mjs --audio out/audio.wav --out dist/showreel.mp4 "$@"
fi

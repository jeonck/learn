#!/usr/bin/env bash
# 전체 빌드: 사운드 합성 → 프레임 렌더(고화질 마스터) → 배포용 인코딩 + 오디오 → dist/showreel.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
FF=${FFMPEG:-$(command -v ffmpeg || python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
export FFMPEG=$FF

python3 scripts/audio.py
node scripts/render.mjs "$@"
mkdir -p dist
"$FF" -y -loglevel error -i out/video.mp4 -i out/audio.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slower -crf 21 -tune film -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 256k -shortest -movflags +faststart \
  dist/showreel.mp4
echo "완료 → dist/showreel.mp4"

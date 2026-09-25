#!/usr/bin/env bash
# 스틸 몇 장을 렌더해 한 장의 컨택트 시트로 묶는다 (검수용)
#   bash scripts/sheet.sh 이름 열x행 t1,t2,...
set -euo pipefail
cd "$(dirname "$0")/.."
name=$1; grid=$2; times=$3
FF=${FFMPEG:-$(command -v ffmpeg || python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
node scripts/render.mjs --stills "$times" --dir "out/stills-$name" > /dev/null
"$FF" -y -loglevel error -pattern_type glob -i "out/stills-$name/*.png" \
  -vf "scale=960:-1,tile=$grid:padding=6" -frames:v 1 "out/sheet-$name.png"
echo "out/sheet-$name.png"

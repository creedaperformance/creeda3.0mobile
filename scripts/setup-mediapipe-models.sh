#!/usr/bin/env bash
# Downloads the MediaPipe Pose Landmarker model so the Android EAS Build can
# bundle it as an asset. Run once locally before `eas build`.
set -euo pipefail

DEST_DIR="$(dirname "$0")/../assets/models"
DEST_FILE="$DEST_DIR/pose_landmarker_full.task"
MODEL_URL="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"

mkdir -p "$DEST_DIR"

if [ -f "$DEST_FILE" ]; then
  SIZE=$(wc -c < "$DEST_FILE" | tr -d ' ')
  if [ "$SIZE" -gt 1000000 ]; then
    echo "✅ pose_landmarker_full.task already present ($SIZE bytes)"
    exit 0
  fi
  echo "ℹ️  pose_landmarker_full.task exists but looks truncated, redownloading…"
fi

echo "⬇️  Downloading pose_landmarker_full.task (~6 MB) from Google MediaPipe CDN…"
curl -fL --progress-bar "$MODEL_URL" -o "$DEST_FILE"

SIZE=$(wc -c < "$DEST_FILE" | tr -d ' ')
echo "✅ Saved to $DEST_FILE ($SIZE bytes)"
echo
echo "Next step: re-run 'npx expo prebuild --clean' or 'eas build --platform android'."

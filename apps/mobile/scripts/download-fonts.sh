#!/usr/bin/env bash
# Download Manrope + Inter font files into apps/mobile/assets/fonts/
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../assets/fonts" && pwd)"
echo "Saving fonts to $DIR"

# Manrope from jsdelivr (Sharanda's repo)
declare -A MANROPE=(
  ["Manrope-Regular.ttf"]="https://cdn.jsdelivr.net/gh/sharanda/manrope/fonts/ttf/Manrope-Regular.ttf"
  ["Manrope-Medium.ttf"]="https://cdn.jsdelivr.net/gh/sharanda/manrope/fonts/ttf/Manrope-Medium.ttf"
  ["Manrope-SemiBold.ttf"]="https://cdn.jsdelivr.net/gh/sharanda/manrope/fonts/ttf/Manrope-SemiBold.ttf"
  ["Manrope-Bold.ttf"]="https://cdn.jsdelivr.net/gh/sharanda/manrope/fonts/ttf/Manrope-Bold.ttf"
  ["Manrope-ExtraBold.ttf"]="https://cdn.jsdelivr.net/gh/sharanda/manrope/fonts/ttf/Manrope-ExtraBold.ttf"
)

# Inter from jsdelivr (rsms/inter)
declare -A INTER=(
  ["Inter-Regular.ttf"]="https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/Inter-Regular.ttf"
  ["Inter-Medium.ttf"]="https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/Inter-Medium.ttf"
  ["Inter-SemiBold.ttf"]="https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/Inter-SemiBold.ttf"
  ["Inter-Bold.ttf"]="https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/Inter-Bold.ttf"
)

for name in "${!MANROPE[@]}"; do
  url="${MANROPE[$name]}"
  [[ -f "$DIR/$name" ]] && { echo "✓ $name (exists)"; continue; }
  echo "→ $name"
  curl -fsSL "$url" -o "$DIR/$name" || echo "✗ failed: $name"
done

for name in "${!INTER[@]}"; do
  url="${INTER[$name]}"
  [[ -f "$DIR/$name" ]] && { echo "✓ $name (exists)"; continue; }
  echo "→ $name"
  curl -fsSL "$url" -o "$DIR/$name" || echo "✗ failed: $name"
done

echo "Done. Files in $DIR:"
ls -1 "$DIR"

#!/usr/bin/env bash
# Download Manrope + Inter font files into apps/mobile/assets/fonts/
# Usage: bash apps/mobile/scripts/download-fonts.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../assets/fonts" && pwd)"
echo "Saving fonts to $DIR"

declare -A FONTS=(
  ["Manrope-Regular.ttf"]="https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-Regular.ttf"
  ["Manrope-Medium.ttf"]="https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-Medium.ttf"
  ["Manrope-SemiBold.ttf"]="https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-SemiBold.ttf"
  ["Manrope-Bold.ttf"]="https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-Bold.ttf"
  ["Manrope-ExtraBold.ttf"]="https://github.com/sharanda/manrope/raw/master/fonts/ttf/Manrope-ExtraBold.ttf"
  ["Inter-Regular.ttf"]="https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf"
  ["Inter-Medium.ttf"]="https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.ttf"
  ["Inter-SemiBold.ttf"]="https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.ttf"
  ["Inter-Bold.ttf"]="https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.ttf"
)

for name in "${!FONTS[@]}"; do
  url="${FONTS[$name]}"
  if [[ -f "$DIR/$name" ]]; then
    echo "✓ $name (exists)"
    continue
  fi
  echo "→ downloading $name"
  curl -fsSL "$url" -o "$DIR/$name"
done

echo "All fonts ready in $DIR"

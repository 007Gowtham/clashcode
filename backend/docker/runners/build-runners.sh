#!/usr/bin/env bash
# Build all Docker runner images for the ClashCode sandbox judge.
# Run this once before starting the backend (or when runners change).
#
# Usage:
#   cd backend
#   bash docker/runners/build-runners.sh

set -e

PREFIX="clashcode"
RUNNERS_DIR="$(dirname "$0")"

echo "==> Building ClashCode sandbox runner images..."

for lang in python javascript java cpp; do
  dir="$RUNNERS_DIR/$lang"
  image="$PREFIX/$lang:runner"
  echo ""
  echo "--- Building $image from $dir ---"
  docker build -t "$image" "$dir"
  echo "--- Done: $image ---"
done

echo ""
echo "All runner images built successfully!"
echo "Images:"
docker images | grep "^clashcode/"

#!/bin/sh
# Builds dist/web-ingest-<version>.zip from extension/ for upload to the stores.
set -eu

cd "$(dirname "$0")/.."

version=$(node -p "require('./extension/manifest.json').version")
out="dist/web-ingest-$version.zip"

mkdir -p dist
rm -f "$out"
(cd extension && zip -qr "../$out" . -x '*.DS_Store')

unzip -l "$out"
echo "Built $out"

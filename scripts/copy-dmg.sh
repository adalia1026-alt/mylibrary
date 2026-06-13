#!/bin/bash
# 自动将构建好的 DMG 复制到项目根目录，方便分发和上传 GitHub
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./package.json').version")
DMG_NAME="MyLibrary_v${VERSION}.dmg"

# 查找最新构建的 DMG
DMG_SRC=$(find src-tauri/target/release/bundle -name "*.dmg" -type f 2>/dev/null | head -1)

if [ -z "$DMG_SRC" ]; then
  echo "❌ 未找到 DMG 文件，请先运行: pnpm tauri build --bundles dmg"
  exit 1
fi

cp "$DMG_SRC" "$DMG_NAME"
echo "✅ DMG 已复制到项目根目录: $DMG_NAME"
ls -lh "$DMG_NAME"

#!/usr/bin/env bash
# 下載燒錄字幕用的 Noto 字型到 ./fonts (泰/高棉/緬/寮文需要;越南語用 Noto Sans 即可)
set -euo pipefail
cd "$(dirname "$0")/.." && mkdir -p fonts && cd fonts
B=https://github.com/notofonts
get(){ [ -f "$2" ] || curl -fsSL -o "$2" "$1"; }
get $B/latin-greek-cyrillic/raw/main/fonts/NotoSans/hinted/ttf/NotoSans-Bold.ttf NotoSans-Bold.ttf
get $B/thai/raw/main/fonts/NotoSansThai/hinted/ttf/NotoSansThai-Bold.ttf NotoSansThai-Bold.ttf
get $B/khmer/raw/main/fonts/NotoSansKhmer/hinted/ttf/NotoSansKhmer-Bold.ttf NotoSansKhmer-Bold.ttf
get $B/myanmar/raw/main/fonts/NotoSansMyanmar/hinted/ttf/NotoSansMyanmar-Bold.ttf NotoSansMyanmar-Bold.ttf
get $B/lao/raw/main/fonts/NotoSansLao/hinted/ttf/NotoSansLao-Bold.ttf NotoSansLao-Bold.ttf
echo "完成: $(ls | wc -l) 個字型"

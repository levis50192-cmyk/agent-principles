# 要安裝的 7 個 skill

來源：一支 Reel（ethanhuang01）「這 7 個必裝工具」。以下來源是網路搜尋結果，**不是親自驗證過**。

安裝方式：`npx skills add <repo> --all -g -a claude-code -y`
（`.claude/settings.json` 已允許 `npx skills add`。）

## A. 先裝（官方來源）

| # | 工具 | repo | 備註 |
|---|---|---|---|
| 1 | HyperFrames | `heygen-com/hyperframes` | 需要 Node 22+、FFmpeg。**不要裝 `media-use` skill**：它會 `curl \| bash` 裝 HeyGen CLI，沒有版本鎖定或校驗。用 `--skill <名稱>` 只裝核心 skill。 |
| 2 | Remotion | `remotion-dev/skills` | 也可用 `npx remotion skills add` |
| 3 | GSAP AI Skills | `greensock/gsap-skills` | |

## B. 先看內容再裝（第三方）

裝之前先 clone 或讀 README 和 SKILL.md，把內容列給使用者確認。

| # | 工具 | repo | 備註 |
|---|---|---|---|
| 4 | Pixel2Motion | `nolangz/pixel2motion` | MIT。需要 Python、Pillow、numpy、Playwright。 |
| 5 | Video Shotcraft | `Vincentwei1021/video-shotcraft` | Apache-2.0。需要 Remotion、ffmpeg。 |
| 6 | story-to-handdrawn-video | `gnipbao/story-to-handdrawn-video` | 沒找到 README 和授權資訊；SKILL.md 在 `skill-package/story-to-handdrawn-video/`。 |
| 7 | motion-design-skill | `LottieFiles/motion-design-skill` | 名稱是推測，影片裡的未必是這個；`--skill motion-design`。 |

## 注意

- 雲端容器是暫時的，session 結束後安裝內容會消失。
- 已完成的示範影片（HTML 時間軸 → Playwright 逐幀截圖 → FFmpeg）沒有用到以上任何 skill。

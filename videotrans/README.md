# VideoTrans — 影片翻譯、重新上字幕、AI 配音

上傳影片 → 自動辨識台詞 → 翻成越南語、泰語、印尼語、馬來語、菲律賓語、高棉語、緬甸語、寮語(另含中/英/日/韓)→
校對 → 輸出「燒錄新字幕 + 翻譯配音」的影片,並附 SRT/VTT 字幕檔。

```
影片 ─ffmpeg→ 音訊 ─faster-whisper→ 分句+時間軸 ─Claude→ 各語言譯文
     ─(網頁校對)→ edge-tts 配音(貼合原時間軸) + ASS 字幕 ─ffmpeg→ output.<語言>.mp4
```

## 安裝與執行

需要:Python 3.10+、ffmpeg(含 libass)。

```bash
cd videotrans
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
bash scripts/fetch_fonts.sh              # 泰/高棉/緬/寮文字幕字型
export ANTHROPIC_API_KEY=sk-ant-...      # 其他設定見 .env.example
uvicorn app.main:app --port 8000         # 開啟 http://localhost:8000
```

首次辨識會自動下載 Whisper 模型(預設 `small`;要更準用 `VT_WHISPER_MODEL=large-v3`,有 NVIDIA GPU 設 `VT_WHISPER_DEVICE=cuda`)。

## 設計重點

- **翻譯**:Claude 以 30 句一批並帶前文,保證輸入輸出句數一致(不一致會重試、再退為逐句),可填「影片背景/專有名詞」維持譯名一致。
- **配音貼合時間**:譯文過長時最多加速 1.5 倍,並可借用下一句前的空白(最多 1 秒),仍超出則淡出截斷。原音降到 12%(可調)混在底下。
- **字幕換行**:泰語用 pythainlp 斷詞;高棉/緬/寮無斷詞器時以字元群為單位,不會把組合符號拆開。ASS 關閉自動換行,完全由程式控制。
- **校對**:翻譯完成後可在網頁逐句修改時間與文字,再輸出;也可勾「跳過校對」全自動。

## 已知限制

- 配音使用微軟 Edge 線上 TTS(免費、無需金鑰,但需連網,屬非官方介面)。高棉/緬/寮聲線較少,各語言僅提供兩種。若要商用,建議換成 Azure Speech 或 ElevenLabs(替換 `app/dub.py` 的 `_synth_all`)。
- 單一聲線,不做多說話者分離、也不做聲音克隆。
- 不會移除影片原本已燒錄的舊字幕;原音人聲未分離,配音時原音只是降音量。
- 任務佇列為單執行緒、資料存在 `data/`,適合個人/小團隊;多人使用需改成正式任務佇列。

## 測試

```bash
pytest -q
```
`tests/test_pipeline.py` 以真的 ffmpeg 跑完整流程;辨識、翻譯、TTS 以替身取代(不需網路)。

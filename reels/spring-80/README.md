# Spring x80 (guofeng Reels, 1080x1920, 27.6s)

    npm install
    npm run studio     # preview/edit (composition: Spring80)
    npm run render     # silent out.mp4

Music: python3 audio3.py (needs numpy) -> audio3.wav.
Voice-over: voice.py (Fish Audio TTS; needs a key, never commit it).
Mux with an explicit map:
    ffmpeg -i out.mp4 -i audio3v.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest final.mp4

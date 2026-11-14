# Life in Weeks (Reels, 1080x1920, 20s)

Requires Node 18+.

    npm install
    npm run studio     # preview and edit in the browser
    npm run render     # writes out.mp4 (silent)

Audio is synthesized by `python3 audio.py` (needs numpy) into `audio.wav`;
mux it with: ffmpeg -i out.mp4 -i audio.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest final.mp4

In a container with a system Chromium, set REMOTION_BROWSER to its path.

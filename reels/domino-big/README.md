# Big domino chain (29s Reels, 1080x1920, 5,990 dominoes)

3D (Three.js via @remotion/three). `layout.mjs` places the dominoes (rainbow snake ->
binary tree -> 56x80 pixel-art heart), computes every domino's start time, and `cam.mjs`
writes the camera path. The tipping itself is hand-authored kinematics, not a physics engine.

    npm install
    npm run studio            # preview (needs a GPU for speed)
    npm run layout            # regenerate dominoes.json / cam.json (edit the pixel art in layout.mjs)
    npm run render            # silent out.mp4 (about 30 min with software GL on 4 cores)
    python3 audio_big.py      # needs numpy -> audio_big.wav
    ffmpeg -i out.mp4 -i audio_big.wav -map 0:v:0 -map 1:a:0 -c:v copy \
      -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest final.mp4

Always use the explicit -map (Remotion adds a silent audio track).

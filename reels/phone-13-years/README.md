# Phone 13 years (Reels, 1080x1920, 27.6s)

    npm install
    npm run studio     # preview/edit (composition: PhoneLife)
    npm run render     # silent out.mp4

Mux audio with an explicit map (Remotion adds a silent audio track):
    ffmpeg -i out.mp4 -i audio2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest final.mp4

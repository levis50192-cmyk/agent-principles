# Domino chain (30s Reels, 1080x1920)

Hand-authored Rube Goldberg timeline (not a physics engine): `kin.mjs` integrates
simple motions (domino tipping, rolling balls on ramps, a seesaw launch) and writes
`kin.json`; Remotion draws it (`src/Domino.tsx`) and `audio4.py` synthesizes the
sound effects from the same event list.

    npm install
    npm run studio          # preview, composition: Domino
    npm run sim             # regenerate kin.json (needs only Node)
    npm run render          # silent out.mp4
    python3 audio4.py       # needs numpy -> audio4.wav (run from this folder)
    ffmpeg -i out.mp4 -i audio4.wav -map 0:v:0 -map 1:a:0 -c:v copy \
      -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest final.mp4

Always use the explicit -map (Remotion adds a silent audio track).

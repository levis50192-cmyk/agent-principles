import json, subprocess, sys, wave
import numpy as np
LINES = [
 (0.15, 3.45, "你這輩子，只能看八十次花開。"),
 (3.75, 4.7,  "一年有二十四個節氣，春夏秋冬，各六個。"),
 (8.75, 3.9,  "春天，只佔四分之一。"),
 (12.95, 4.9, "八十年，八十個春天。三十歲，只剩五十個。"),
 (18.15, 4.6, "一年之計在於春。別等，今年春天就去做。"),
 (23.2, 4.2,  "留言你的歲數，算算還剩幾個春天。"),
]
SR = 44100
def tts(text, speed, out):
    body = json.dumps({"text": text, "format": "mp3", "prosody": {"speed": speed}})
    subprocess.run(["curl","-sS","-m","90","-X","POST","https://api.fish.audio/v1/tts","-H","Content-Type: application/json",
                    "-H","model: s2.1-pro-free","-d",body,"-o",out,"--fail"], check=True)
def dur(p):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]))
def load(p):
    raw = subprocess.check_output(["ffmpeg","-v","error","-i",p,"-f","s16le","-ac","1","-ar",str(SR),"-"])
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32)/32768
segs=[]
for i,(t0,maxd,text) in enumerate(LINES):
    sp=1.0
    for _ in range(3):
        f=f"vo/line{i}.mp3"; tts(text, sp, f); d=dur(f)
        print(i, f"speed={sp:.2f} dur={d:.2f} max={maxd}")
        if d<=maxd: break
        sp=min(1.15, sp*d/maxd*1.02)
    segs.append((t0, load(f)))
n=int(27.6*SR)
voice=np.zeros(n,dtype=np.float32); duck=np.ones(n,dtype=np.float32)
for t0,x in segs:
    i=int(t0*SR); x=x/ (np.max(np.abs(x))+1e-9)*0.85; x=x[:n-i]
    voice[i:i+len(x)]+=x
    a=max(0,i-int(0.15*SR)); b=min(n,i+len(x)+int(0.35*SR)); duck[a:b]=0.42
k=np.ones(int(0.12*SR))/int(0.12*SR); duck=np.convolve(duck,k,'same')
w=wave.open('audio3.wav'); m=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
m=m.reshape(-1,2)[:n]
mix=m*duck[:len(m),None]*0.9+voice[:len(m),None]*0.95
mix/=max(1.0,np.max(np.abs(mix))/0.92)
out=wave.open('audio3v.wav','wb'); out.setnchannels(2); out.setsampwidth(2); out.setframerate(SR)
out.writeframes((mix*32767).astype(np.int16).tobytes()); out.close()
print('ok')

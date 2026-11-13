import numpy as np, wave
SR=44100; D=27.6
n=int(SR*D); a=np.zeros(n)
def add(t,x):
    i=int(t*SR); x=x[:max(0,n-i)]; a[i:i+len(x)]+=x
def env(L,att=0.005,dec=8): 
    t=np.arange(int(L*SR))/SR; return np.minimum(t/att,1)*np.exp(-dec*t)
def tone(f,L,dec=8,amp=1):
    t=np.arange(int(L*SR))/SR; return amp*np.sin(2*np.pi*f*t)*env(L,0.003,dec)
def boom(t0):
    t=np.arange(int(0.9*SR))/SR; f=110*np.exp(-t*4)+38
    add(t0,0.9*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-4*t))
rng=np.random.default_rng(7)
def whoosh(t0,L=0.7):
    t=np.arange(int(L*SR))/SR; x=rng.standard_normal(len(t))
    # crude lowpass sweep
    k=np.linspace(0.02,0.35,len(t)); y=np.zeros_like(x)
    for i in range(1,len(x)): y[i]=y[i-1]+k[i]*(x[i]-y[i-1])
    add(t0,0.9*y*np.sin(np.pi*t/L)**2)
# pad: Am F C G, 5s each, low sines
chords=[(220,261.6,329.6),(174.6,220,261.6),(261.6,329.6,392),(196,246.9,293.7),(220,261.6,329.6),(174.6,220,261.6)]
for ci,ch in enumerate(chords):
    L=5.0; t=np.arange(int(L*SR))/SR; e=np.minimum(t/1.0,1)*np.minimum((L-t)/1.0,1)
    add(ci*5.0, sum(np.sin(2*np.pi*f*t)*0.05 for f in ch)*e)
B=[0,3.4,7,11,15.4,19.8,23.6]
for t0 in B: boom(t0)
for t0 in B[1:]: whoosh(t0-0.3,0.45)
# hook count-up ticks
for k in range(14): add(0.4+k*0.08,tone(600+k*60,0.05,45,0.2))
# typing ticks per scene (caption start frame / 30)
for sc,st,ln in [(1,14,17),(2,12,13),(3,14,12),(4,30,15),(5,44,18),(6,52,9)]:
    t0=B[sc]+st/30
    for k in range(int(ln*1.6/30/0.05)): add(t0+k*0.05,tone(1700,0.02,100,0.05))
# reveal dings
for t0 in (B[4]+1.0,B[4]+2.0,B[6]+0.9): 
    for j,f in enumerate((988,1319)): add(t0+j*0.1,tone(f,0.6,5,0.18))
a=a/np.max(np.abs(a))*0.85
a[:int(0.01*SR)]*=np.linspace(0,1,int(0.01*SR)); a[-int(0.3*SR):]*=np.linspace(1,0,int(0.3*SR))
with wave.open('audio2.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a*32767).astype(np.int16).tobytes())

import numpy as np, wave
SR=44100; D=20.0
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
chords=[(220,261.6,329.6),(174.6,220,261.6),(261.6,329.6,392),(196,246.9,293.7)]
for ci,ch in enumerate(chords):
    L=5.0; t=np.arange(int(L*SR))/SR; e=np.minimum(t/1.0,1)*np.minimum((L-t)/1.0,1)
    add(ci*5.0, sum(np.sin(2*np.pi*f*t)*0.05 for f in ch)*e)
boom(0.0)
# rising ticks during pop
for k in range(28):
    t0=0.15+k*0.05; add(t0,tone(500+k*55,0.06,40,0.18))
for t0 in (3.6,7.6,11.6,15.2): boom(t0); whoosh(t0-0.35)
# counting ticks
for k in range(int((6.4-3.6)/0.07)): add(3.6+k*0.07,tone(880,0.04,60,0.10))
for k in range(int((10.4-7.6)/0.07)): add(7.6+k*0.07,tone(1175,0.04,60,0.10))
# free chime
for j,f in enumerate((784,988,1319)): add(11.65+j*0.12,tone(f,1.2,3.5,0.22))
# scan ticks in CTA
for k in range(int((18.8-15.2)/0.045)): add(15.2+k*0.045,tone(1500,0.025,90,0.05))
# outro sweep down
t=np.arange(int(0.7*SR))/SR; add(19.2,0.25*np.sin(2*np.pi*np.cumsum(900*np.exp(-t*4))/SR)*np.exp(-3*t))
a=a/np.max(np.abs(a))*0.85
a[:int(0.01*SR)]*=np.linspace(0,1,int(0.01*SR)); a[-int(0.3*SR):]*=np.linspace(1,0,int(0.3*SR))
with wave.open('audio.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((a*32767).astype(np.int16).tobytes())

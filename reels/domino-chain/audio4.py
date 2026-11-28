import json, numpy as np, wave, sys
d=json.load(open('src/kin.json'))
SR=44100; D=30.0; n=int(SR*D)
L=np.zeros(n); R=np.zeros(n)
rng=np.random.default_rng(5)
def T(dur): return np.arange(int(dur*SR))/SR
def add(t0,x,pan=0.5):
    i=int(t0*SR)
    if i<0 or i>=n: return
    x=x[:n-i]; L[i:i+len(x)]+=x*(1-pan)*1.4; R[i:i+len(x)]+=x*pan*1.4
def bp_noise(dur,lo,hi):
    t=T(dur); x=rng.standard_normal(len(t))
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X[(f<lo)|(f>hi)]=0
    y=np.fft.irfft(X,len(x)); return y/ (np.max(np.abs(y))+1e-9)
def clack(a=0.4,f=1100):
    t=T(0.09); return a*(bp_noise(0.09,1800,5500)*np.exp(-t*140)*0.9+np.sin(2*np.pi*f*t)*np.exp(-t*60)*0.6)
def tink(a=0.35):
    t=T(0.25); return a*(np.sin(2*np.pi*2600*t)*np.exp(-t*30)+0.4*np.sin(2*np.pi*3900*t)*np.exp(-t*45)+bp_noise(0.25,3000,8000)*np.exp(-t*200)*0.3)
def thump(a=0.6,f=200,dur=0.22):
    t=T(dur); fr=f*(1+1.2*np.exp(-t*30)); ph=2*np.pi*np.cumsum(fr)/SR
    return a*(np.sin(ph)*np.exp(-t*18)+bp_noise(dur,300,1500)*np.exp(-t*60)*0.4)
def bonk(a=0.5):
    t=T(0.5); fr=330+60*np.sin(2*np.pi*14*t)*np.exp(-t*8); ph=2*np.pi*np.cumsum(fr)/SR
    return a*(np.sin(ph)*np.exp(-t*7)+0.5*np.sin(2*ph)*np.exp(-t*10))
def whoosh(a=0.3,dur=0.4):
    t=T(dur); x=bp_noise(dur,500,4000); return a*x*np.sin(np.pi*t/dur)**1.5
def pluck(f,dur=0.9,a=0.3):
    t=T(dur); x=np.zeros_like(t)
    for k in range(1,6): x+=np.sin(2*np.pi*f*k*t)/k**1.4*np.exp(-t*(5+k*3))
    return a*x*np.minimum(t/0.004,1)
def chime(f,dur=2.2,a=0.25):
    t=T(dur); return a*(np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*f*2.76*t))*np.exp(-t*2.0)*np.minimum(t/0.004,1)
def pan_of(x): return 0.2+0.6*max(0,min(1,x/1080))

# ---- sound effects from events ----
rngv=np.random.default_rng(9)
for e in d['events']:
    t,k,x,v=e['t'],e['kind'],e['x'],e['v']; p=pan_of(x)
    if k=='dom': add(t,clack(0.34*(0.8+0.4*rngv.random()),950+rngv.random()*500),p)
    elif k=='tick': add(t,tink(0.3*min(1.2,v)),p)
    elif k=='thud': add(t,thump(0.5*v,240,0.18),p); add(t,tink(0.12*v),p)
    elif k=='book': add(t,thump(0.7,170,0.28),p); add(t,clack(0.25,700),p)
    elif k=='seesaw': add(t,bonk(0.6),p); add(t,thump(0.4,120,0.3),p)
    elif k=='launch': add(t-0.04,whoosh(0.3,0.45),p)
    elif k=='lamp':
        for j,f in enumerate([1046.5,1318.5,1568,2093]): add(t+0.08*j,chime(f,2.4,0.25),0.5)
        add(t,thump(0.7,70,0.6),0.5); add(t+0.05,whoosh(0.35,0.6),0.5)
add(d['T0']-0.3,thump(0.25,130,0.15),0.2)   # hand tap
# ---- rolling rumble ----
for r in d['rolls']:
    dur=r['t1']-r['t0']
    if dur<0.6: continue
    lo,hi,amp=(900,2600,0.12) if r['k']=='marble' else (250,900,0.13)
    x=bp_noise(dur,lo,hi); t=T(dur)
    env=np.minimum(t/0.25,1)*np.minimum((dur-t)/0.2,1)*(0.35+0.65*t/dur)
    wob=0.75+0.25*np.sin(2*np.pi*(5+9*t/dur)*t)
    add(r['t0'],amp*x*env*wob,0.5)
# ---- playful music bed (C major pentatonic marimba) ----
NOTE={'C':0,'D':2,'E':4,'G':7,'A':9}
def hz(nm): return 261.6256*2**((NOTE[nm[0]]+12*(int(nm[1])-4))/12)
bpm=112; beat=60/bpm; e8=beat/2
mel=[['E5','G5','A5','G5','E5','D5','C5','D5'],['E5','G5','A5','C6','A5','G5','E5','G5'],['D5','E5','G5','E5','D5','C5','A4','C5'],['C5','D5','E5','G5','E5','D5','C5','C5']]
bass=['C3','A2','G2','C3']
tmusic_end=d['tLamp']
t0=0.0; bar=0
while t0<tmusic_end-0.3:
    for k in range(8):
        tt=t0+k*e8
        if tt>tmusic_end: break
        add(tt,pluck(hz(mel[bar%4][k]),0.5,0.16),0.35+0.3*(k%2))
    for q in (0,2):
        add(t0+q*beat,pluck(hz(bass[bar%4]),0.9,0.22),0.5)
    for k in range(8): add(t0+k*e8,clack(0.04,3000),0.6)
    t0+=4*beat; bar+=1
# triumphant ending: sustained chord + arpeggio loop to the end
for j,nm in enumerate(['C5','E5','G5','C6','E6','G5','C6','E6']): add(tmusic_end+0.0+j*e8*0.5,pluck(hz(nm) if nm[0]!='E' or True else 0,0.8,0.2),0.5)
for j in range(10):
    for k,nm in enumerate(['C5','G5','A5','G5']):
        tt=tmusic_end+0.6+j*4*e8+k*e8
        if tt<D-0.5: add(tt,pluck(hz(nm),0.5,0.12),0.5)
# ---- gentle room reverb ----
def rev(x,seed):
    r=np.random.default_rng(seed); m=int(0.9*SR); tt=np.arange(m)/SR
    ir=r.standard_normal(m)*np.exp(-tt*6.0); ir[0]=0; N=1<<int(np.ceil(np.log2(len(x)+m)))
    y=np.fft.irfft(np.fft.rfft(x,N)*np.fft.rfft(ir,N),N)[:len(x)]; return y/(np.max(np.abs(y))+1e-9)*np.max(np.abs(x))
Lw=rev(L,1); Rw=rev(R,2)
L2=L*0.88+Lw*0.2; R2=R*0.88+Rw*0.2
m=np.max(np.abs([L2,R2])); L2/=m; R2/=m
fade=np.ones(n); fade[-int(0.6*SR):]=np.linspace(1,0,int(0.6*SR)); fade[:int(0.01*SR)]=np.linspace(0,1,int(0.01*SR))
st=np.stack([L2*fade*0.9,R2*fade*0.9],1)
with wave.open('audio4.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
print('ok')

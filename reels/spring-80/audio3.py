import numpy as np, wave
SR=44100; D=27.6; n=int(SR*D)
L=np.zeros(n); R=np.zeros(n)
rng=np.random.default_rng(11)
NOTE={'C':0,'D':2,'E':4,'G':7,'A':9}
def hz(name):
    k=NOTE[name[0]]; o=int(name[1]); return 261.6256*2**((k+12*(o-4))/12)
def add(t0,x,pan=0.5,wet=1.0):
    i=int(t0*SR)
    if i>=n: return
    x=x[:n-i]; L[i:i+len(x)]+=x*(1-pan)*2*0.5; R[i:i+len(x)]+=x*pan*2*0.5
def T(d): return np.arange(int(d*SR))/SR
def pluck(f,d=1.6,a=0.5):
    t=T(d); x=np.zeros_like(t)
    for k in range(1,9):
        x+=np.sin(2*np.pi*f*k*(1+0.0004*k*k)*t)/k**1.15*np.exp(-t*(2.0+f/500+k*1.3))
    click=rng.standard_normal(len(t))*np.exp(-t*220)*0.25
    return a*(x+click)
def flute(f,d,a=0.35):
    t=T(d); att=np.minimum(t/0.09,1); rel=np.minimum((d-t)/0.18,1)
    vib=1+0.004*np.sin(2*np.pi*5.4*t)*np.minimum(t/0.35,1)
    ph=2*np.pi*np.cumsum(f*vib)/SR
    x=np.sin(ph)+0.28*np.sin(2*ph)+0.09*np.sin(3*ph)
    br=rng.standard_normal(len(t)); br=np.convolve(br,np.ones(6)/6,'same')
    return a*(x*0.9+br*0.05)*att*rel*(0.85+0.15*np.sin(2*np.pi*4.2*t))
def gong(a=0.6,d=5.0):
    t=T(d); x=np.zeros_like(t)
    for f,am,dc in [(98,1,0.9),(147,0.7,1.1),(211,0.6,1.4),(263,0.45,1.6),(342,0.35,2.2),(417,0.25,3)]:
        x+=am*np.sin(2*np.pi*f*t*(1+0.015*np.exp(-t*3)))*np.exp(-t*dc)
    return a*x*np.minimum(t/0.01,1)
def wood(a=0.5):
    t=T(0.18); return a*(np.sin(2*np.pi*880*t)*np.exp(-t*45)+rng.standard_normal(len(t))*np.exp(-t*120)*0.5)
def drum(a=0.8):
    t=T(0.7); f=48+90*np.exp(-t*14); return a*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*5)
def chime(a=0.25):
    t=T(2.0); x=sum(np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,d in [(2093,2.2),(2637,2.8),(3136,3.4),(4186,4)])
    return a*x*np.minimum(t/0.003,1)
def swish(d=0.45,a=0.18):
    t=T(d); x=rng.standard_normal(len(t)); y=np.zeros_like(x); k=np.linspace(0.05,0.5,len(t))
    for i in range(1,len(x)): y[i]=y[i-1]+k[i]*(x[i]-y[i-1])
    return a*y*np.sin(np.pi*t/d)**2
beat=60/72; e8=beat/2
# drone
t=T(D); drone=0.035*(np.sin(2*np.pi*65.4*t)+0.6*np.sin(2*np.pi*98*t))*np.minimum(t/2,1)*np.minimum((D-t)/1.5,1)
L+=drone; R+=drone
# intro
add(0.0,gong(0.7),0.5); add(0.0,drum(0.9),0.5)
for k,nm in enumerate(['C4','D4','E4','G4','A4','C5','D5','E5','G5','A5']):
    add(0.15+k*0.075,pluck(hz(nm),1.8,0.35+0.03*k),0.35+0.03*k)
for k in range(15): add(0.47+k*0.07,pluck(900+k*90,0.1,0.10),0.6)
add(1.9,flute(hz('G5'),1.7,0.32),0.6)
# arpeggio bars
bars=[['C4','G4','A4','G4','E4','G4','A4','C5'],['A3','E4','G4','E4','D4','E4','G4','A4'],
      ['G3','D4','E4','D4','C4','D4','E4','G4'],['E4','A4','G4','E4','D4','E4','C4','D4']]
t0=3.6; b=0
while t0<27.0:
    for k,nm in enumerate(bars[b%4]):
        add(t0+k*e8,pluck(hz(nm),1.5,0.30),0.3+0.4*(k%4)/3)
    t0+=8*e8; b+=1
# melody (beats from 3.6)
mel=[(0,'E5',1.5),(1.5,'G5',.5),(2,'A5',2),(4,'G5',1),(5,'E5',1),(6,'D5',2),(8,'C5',1),(9,'D5',1),(10,'E5',1.5),(11.5,'G5',.5),
     (12,'A5',2),(14,'C6',2),(16,'A5',1),(17,'G5',1),(18,'E5',2),(20,'D5',1),(21,'E5',1),(22,'G5',2),(24,'A5',2),(26,'G5',1),(27,'C5',2)]
for bt,nm,ln in mel:
    ts=3.6+bt*beat
    if ts<26.6: add(ts,flute(hz(nm),min(ln*beat,27.3-ts),0.30),0.62)
# rhythm
for k in range(int((27.0-8.6)/(4*beat))): add(8.6+k*4*beat,drum(0.55),0.5)
for k in range(int((27.0-12.8)/(2*beat))): add(12.8+k*2*beat+beat,wood(0.28),0.65)
# cut accents
for c in [3.6,8.6,12.8,18.0,23.0]:
    add(c-0.35,swish(0.4),0.5); add(c,chime(0.22),0.4); add(c,wood(0.5),0.5)
add(23.0,gong(0.55,4),0.5); add(23.2,drum(1.0),0.5)
# ending
for k,nm in enumerate(['A5','G5','E5','D5','C5','G4','E4','C4']): add(26.5+k*0.08,pluck(hz(nm),1.2,0.30),0.5)
add(26.6,gong(0.5,3),0.5)
# reverb
def rev(x,seed):
    r=np.random.default_rng(seed); m=int(1.9*SR); tt=np.arange(m)/SR
    ir=r.standard_normal(m)*np.exp(-tt*2.3); ir[0]=0; N=1<<int(np.ceil(np.log2(len(x)+m)))
    y=np.fft.irfft(np.fft.rfft(x,N)*np.fft.rfft(ir,N),N)[:len(x)]; return y/np.max(np.abs(y))*np.max(np.abs(x))
Lw=rev(L,1); Rw=rev(R,2)
L2=L*0.78+Lw*0.32; R2=R*0.78+Rw*0.32
m=np.max(np.abs([L2,R2])); L2/=m; R2/=m
fade=np.ones(n); fade[-int(0.8*SR):]=np.linspace(1,0,int(0.8*SR)); fade[:int(0.005*SR)]=np.linspace(0,1,int(0.005*SR))
st=np.stack([L2*fade*0.88,R2*fade*0.88],1)
with wave.open('audio3.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
print('ok')

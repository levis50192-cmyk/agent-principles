import json, numpy as np, wave
d=json.load(open('dominoes.json')); D=d['d']
SR=44100; DUR=29.0; n=int(SR*DUR)
L=np.zeros(n); R=np.zeros(n)
rng=np.random.default_rng(3)
def T(x): return np.arange(int(x*SR))/SR
def add(t0,x,pan=0.5,g=1.0):
    i=int(t0*SR)
    if i<0 or i>=n: return
    x=x[:n-i]*g; L[i:i+len(x)]+=x*(1-pan)*1.41; R[i:i+len(x)]+=x*pan*1.41
def bp(dur,lo,hi):
    x=rng.standard_normal(int(dur*SR)); X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X[(f<lo)|(f>hi)]=0
    y=np.fft.irfft(X,len(x)); return y/(np.max(np.abs(y))+1e-9)
# --- click variants ---
clicks=[]
for k in range(10):
    t=T(0.035); c=2000+k*330
    x=bp(0.035,c*0.7,c*1.6)*np.exp(-t*170)+0.5*np.sin(2*np.pi*(c*0.55)*t)*np.exp(-t*130)
    clicks.append(x/np.max(np.abs(x)))
starts=np.array([r[3] for r in D]); xs=np.array([r[0] for r in D])
order=np.argsort(starts)
# density-aware gain so thousands of clicks do not turn into clipping noise
for idx in order:
    t=starts[idx]
    dens=np.searchsorted(starts[order],t+0.03)-np.searchsorted(starts[order],t-0.03)
    g=0.5/np.sqrt(1+dens/3.0)
    p=0.15+0.7*min(1,max(0,(xs[idx]+18)/36))
    add(t,clicks[rng.integers(10)],p,g*(0.75+0.5*rng.random()))
T0=d['T0']; tS=d['tSnakeEnd']; lmin=d['leafMin']; lmax=d['leafMax']; tLast=d['tLast']; TE=tLast+0.9
# --- boom/riser/whoosh helpers ---
def boom(g=1.0):
    t=T(1.2); f=95*np.exp(-t*3.2)+35; ph=2*np.pi*np.cumsum(f)/SR
    return g*(np.sin(ph)*np.exp(-t*3.0)+0.25*bp(1.2,60,400)*np.exp(-t*6))
def riser(dur,g=0.4,f0=200,f1=1600):
    t=T(dur); f=f0*(f1/f0)**(t/dur); ph=2*np.pi*np.cumsum(f)/SR
    return g*((np.sin(ph)*0.5+bp(dur,800,6000)*0.5))*(t/dur)**2
def pluck(f,dur=0.6,a=0.2):
    t=T(dur); x=sum(np.sin(2*np.pi*f*k*t)/k**1.3*np.exp(-t*(6+k*4)) for k in range(1,6)); return a*x*np.minimum(t/0.003,1)
def kick():
    t=T(0.4); f=45+95*np.exp(-t*24); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def hat(g=0.1):
    t=T(0.06); return g*bp(0.06,6000,12000)*np.exp(-t*90)
def sub(f,dur,a=0.3):
    t=T(dur); return a*(np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*2*f*t))*np.minimum(t/0.02,1)*np.minimum((dur-t)/0.05,1)
def crash(dur=3.0,g=0.5):
    t=T(dur); return g*bp(dur,3000,14000)*np.exp(-t*1.4)
def chime(f,dur=2.5,a=0.2):
    t=T(dur); return a*(np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*f*2.76*t))*np.exp(-t*1.6)*np.minimum(t/0.004,1)
# --- intro: ball roll + tension ---
rt=T(T0-0.2); roll=bp(T0-0.2,200,1200)*(0.25+0.75*rt/ (T0-0.2))*0.18
add(0.2,roll,0.45)
add(0.3,riser(T0-0.5,0.35,160,1400),0.5)
add(T0-0.05,boom(0.9),0.5)
# --- music from T0: A minor pentatonic over Am F C G ---
NOTE={'C':0,'D':2,'E':4,'G':7,'A':9}
def hz(nm): return 261.6256*2**((NOTE[nm[0]]+12*(int(nm[1])-4))/12)
beat=0.5
bass=['A1','F1','C2','G1']; bass_hz=[55.0,43.65,65.41,49.0]
arp=[['A4','C5','E5','A5','E5','C5','E5','C5'],['F4','A4','C5','F5','C5','A4','C5','A4'],['C5','E5','G5','C6','G5','E5','G5','E5'],['G4','B4','D5','G5','D5','B4','D5','B4']]
NOTE_ALL={'A':9,'B':11,'C':0,'D':2,'E':4,'F':5,'G':7}
def hz2(nm): return 261.6256*2**((NOTE_ALL[nm[0]]+12*(int(nm[1])-4))/12)
t=T0; bar=0
while t<TE-0.2:
    prog=min(1,(t-T0)/(TE-T0))
    chord=bar%4
    add(t,sub(bass_hz[chord],4*beat,0.28+0.12*prog),0.5)
    for q in range(4):
        add(t+q*beat,kick(),0.5,0.55+0.35*prog)
        if t>T0+2: add(t+q*beat+beat/2,hat(0.07+0.07*prog),0.55)
    for k in range(8):
        f=hz2(arp[chord][k]) * (1 if t<tS-1 else 1)
        add(t+k*beat/2,pluck(f,0.5,0.12+0.10*prog),0.3+0.4*((k%4)/3))
    t+=4*beat; bar+=1
# structure accents
add(tS-1.6,riser(1.6,0.45,300,2200),0.5); add(tS,boom(0.5),0.5)
add(lmin-1.2,riser(1.2,0.5,300,3000),0.5); add(lmin,boom(0.65),0.5)
# --- finale: big reveal at TE ---
add(TE-0.05,boom(1.1),0.5); add(TE,crash(3.2,0.6),0.5)
for j,nm in enumerate(['C5','E5','G5','C6','E6','G6','C7']): add(TE+0.1+j*0.09,chime(hz2(nm),2.8,0.20),0.3+0.07*j)
for k in range(24):
    tt=TE+1.2+k*beat/2
    if tt<DUR-0.6: add(tt,pluck(hz2(['C5','E5','G5','A5'][k%4])*(2 if k%8>=4 else 1),0.4,0.11),0.5)
for q,f in enumerate([65.41,65.41,87.31,98.0]):
    tt=TE+1.0+q*2.0
    if tt<DUR-0.5: add(tt,sub(f,2.0,0.25),0.5)
# --- reverb ---
def rev(x,seed):
    r=np.random.default_rng(seed); m=int(1.3*SR); tt=np.arange(m)/SR
    ir=r.standard_normal(m)*np.exp(-tt*3.5); ir[0]=0; N=1<<int(np.ceil(np.log2(len(x)+m)))
    y=np.fft.irfft(np.fft.rfft(x,N)*np.fft.rfft(ir,N),N)[:len(x)]; return y/(np.max(np.abs(y))+1e-9)*np.max(np.abs(x))
Lw=rev(L,1); Rw=rev(R,2)
L2=L*0.85+Lw*0.22; R2=R*0.85+Rw*0.22
m=np.max(np.abs([L2,R2])); L2/=m; R2/=m
fade=np.ones(n); fade[-int(0.8*SR):]=np.linspace(1,0,int(0.8*SR)); fade[:int(0.01*SR)]=np.linspace(0,1,int(0.01*SR))
st=np.stack([L2*fade*0.92,R2*fade*0.92],1)
with wave.open('audio_big.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
print('ok', TE)

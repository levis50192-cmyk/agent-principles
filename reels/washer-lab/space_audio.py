import numpy as np, wave
SR=44100; D=30.0; n=int(SR*D)
L=np.zeros(n); R=np.zeros(n)
rng=np.random.default_rng(7)
def T(d): return np.arange(int(d*SR))/SR
def add(t0,x,pan=0.5,g=1.0):
    i=int(t0*SR)
    if i<0 or i>=n: return
    x=x[:n-i]; L[i:i+len(x)]+=x*(1-pan)*1.4*g; R[i:i+len(x)]+=x*pan*1.4*g
def bp(d,lo,hi):
    x=rng.standard_normal(len(T(d))); X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X[(f<lo)|(f>hi)]=0
    y=np.fft.irfft(X,len(x)); return y/(np.max(np.abs(y))+1e-9)
def sweep(f0,f1,d,a=0.3,shape='sin'):
    t=T(d); fr=f0*(f1/f0)**(t/d); ph=2*np.pi*np.cumsum(fr)/SR
    w=np.sin(ph) if shape=='sin' else (2*((ph/(2*np.pi))%1)-1)
    return a*w
def pop(a=0.35,f=700):
    t=T(0.12); fr=f*(1+1.5*np.exp(-t*60)); ph=2*np.pi*np.cumsum(fr)/SR
    return a*np.sin(ph)*np.exp(-t*35)
def bloop(a=0.3,f=380):
    t=T(0.22); fr=f*(1+1.6*t/0.22); ph=2*np.pi*np.cumsum(fr)/SR
    return a*np.sin(ph)*np.sin(np.pi*t/0.22)**0.7
def chime(f,d=1.6,a=0.2):
    t=T(d); return a*(np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*f*2.76*t))*np.exp(-t*2.4)*np.minimum(t/0.004,1)
def whoosh(a=0.3,d=0.5,lo=400,hi=3500):
    t=T(d); return a*bp(d,lo,hi)*np.sin(np.pi*t/d)**1.5
def thump(a=0.6,f=90,d=0.5):
    t=T(d); fr=f*(1+1.5*np.exp(-t*25)); ph=2*np.pi*np.cumsum(fr)/SR
    return a*(np.sin(ph)*np.exp(-t*8)+bp(d,100,900)*np.exp(-t*20)*0.5)
def bonk(a=0.5):
    t=T(0.45); fr=300+80*np.sin(2*np.pi*13*t)*np.exp(-t*7); ph=2*np.pi*np.cumsum(fr)/SR
    return a*(np.sin(ph)*np.exp(-t*7)+0.4*np.sin(2*ph)*np.exp(-t*10))
def tick(a=0.15,f=2400):
    t=T(0.06); return a*np.sin(2*np.pi*f*t)*np.exp(-t*90)
def pluck(f,d=0.7,a=0.15):
    t=T(d); x=np.zeros_like(t)
    for k in range(1,5): x+=np.sin(2*np.pi*f*k*t)/k**1.6*np.exp(-t*(4+k*3))
    return a*x*np.minimum(t/0.004,1)
def pad(fs,d,a=0.05):
    t=T(d); x=sum(np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*f*2.001*t) for f in fs)
    env=np.minimum(t/0.8,1)*np.minimum((d-t)/0.8,1); return a*x*env
def hz(m): return 440*2**((m-69)/12)

# ---------------- music: spacey pad + pentatonic plucks (96 bpm)
bpm=96; beat=60/bpm; bar=4*beat
chords=[[48,55,64,71],[45,52,60,67],[41,48,57,64],[43,50,59,65]]   # Cmaj7 Am7 Fmaj7 G7sus-ish
mel=[[76,79,81,79,76,74,72,74],[76,79,84,81,79,76,79,81],[74,76,79,76,74,72,69,72],[72,74,76,79,76,74,72,72]]
t0=0; b=0
while t0<D-0.2:
    add(t0,pad([hz(m) for m in chords[b%4]],bar+0.6,0.035),0.5)
    for k in range(8):
        tt=t0+k*beat/2
        if tt<D-0.6: add(tt,pluck(hz(mel[b%4][k]),0.6,0.10),0.3+0.4*(k%2))
    add(t0,thump(0.18,60,0.35),0.5); add(t0+2*beat,thump(0.14,60,0.3),0.5)
    for k in range(8): add(t0+k*beat/2+beat/4, tick(0.03,6000),0.6)
    t0+=bar; b+=1

# ---------------- SFX
F=lambda fr: fr/30
add(0.0,whoosh(0.3,0.7,600,5000)); add(0.0,pop(0.35,650)); add(F(8),pop(0.4,520)); add(F(8),chime(1318.5,1.4,0.18))
# S2 ISS + capsule
add(F(90),pop(0.35,600)); add(F(90),chime(1046.5,1.2,0.15)); add(F(94),pop(0.3,700)); add(F(102),pop(0.35,560))
add(F(124),whoosh(0.25,0.5)); add(F(140),thump(0.35,180,0.25))
add(F(142),sweep(1400,300,2.0,0.10)*np.linspace(0.2,1,int(2.0*SR)))
fire=bp(2.2,60,700)*np.minimum(T(2.2)/1.0,1)*np.minimum((2.2-T(2.2))/0.4,1); add(F(156),fire*0.35)
add(F(188),thump(0.8,55,0.9)); add(F(188),whoosh(0.35,0.8,200,2000)); add(F(188),pop(0.3,400))
# S3 washer enters, blobs
add(F(220),whoosh(0.3,0.7)); add(F(234),bloop(0.25,500)); add(F(240),bloop(0.25,650))
for i in range(8): add(F(260+i*5.5),bloop(0.28,300+i*40),0.3+0.05*i)
add(F(266),pop(0.3,600)); add(F(306),pop(0.4,520)); add(F(306),chime(1568,1.4,0.18))
# S4 slow drum hum + earth inset drops
hum=bp(4.7,60,240)*(0.6+0.4*np.sin(2*np.pi*1.2*T(4.7))); add(F(360),hum*0.12)
add(F(360),pop(0.35,560))
for fr in (396,440,484): add(F(fr),thump(0.25,220,0.18),0.3)
# S5 spin: motor whine up + rotation whooshes
whine=sweep(110,520,5.0,0.07,'saw')*np.minimum(T(5.0)/0.5,1); add(F(500),whine)
add(F(500),pop(0.3,600)); add(F(552),bonk(0.5)); add(F(552),pop(0.35,500))
for k in range(9): add(F(520)+k*0.5,whoosh(0.18+0.02*k,0.45,300,2500),0.3+0.4*(k%2))
add(F(570),sweep(500,700,1.2,0.12)*np.sin(2*np.pi*7*T(1.2)))   # dizzy warble
# S6 spin works -> door bursts
for j,m in enumerate([72,76,79,84]): add(F(650)+j*0.07,pluck(hz(m),0.7,0.2),0.5)
for k in range(14): add(F(652)+k*0.09,tick(0.12,1800+k*90),0.2+0.6*rng.random())
add(F(690),bonk(0.55)); add(F(692),whoosh(0.45,0.9,200,6000)); add(F(692),thump(0.5,80,0.5))
for k in range(16): add(F(694)+k*0.08+rng.random()*0.04,bloop(0.22,260+rng.random()*500),rng.random())
# S7 ending
add(F(790),pop(0.35,600)); add(F(798),pop(0.4,520))
for j,m in enumerate([72,76,79,84,88]): add(F(798)+j*0.09,chime(hz(m),1.6,0.12),0.5)
add(F(830),pop(0.35,700)); add(F(830),bloop(0.25,600))

mix=np.stack([L,R],1); fade=np.minimum(1,(D-np.arange(n)/SR)/0.6)[:,None]; mix*=fade
mix/=np.max(np.abs(mix))*1.12
with wave.open('space_audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok')

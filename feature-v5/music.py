"""Original 112-bar score. No reference audio is used. Event times share film bars."""
import json,wave,subprocess
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parent
cfg=json.loads((ROOT/'timeline.json').read_text(encoding='utf8'))
SR=44100;D=cfg['duration'];N=D*SR
rng=np.random.default_rng(29092026);mix=np.zeros((N,2),np.float32)
events=[]
def hz(n):return 440*2**((n-69)/12)
def add(at,s,g=.1,pan=0):
    start=round(at*SR)
    if start>=N:return
    if start<0:s=s[-start:];start=0
    count=min(len(s),N-start)
    if count>0:mix[start:start+count]+=s[:count,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)],np.float32)*g
def pluck(note,d=.9):
    t=np.arange(round(d*SR),dtype=np.float32)/SR;f=hz(note)
    wave_=np.sin(2*np.pi*f*t+1.2*np.sin(2*np.pi*f*2*t)*np.exp(-t*12))+.14*np.sin(2*np.pi*f*3*t)*np.exp(-t*10)
    return wave_*np.minimum(1,t/.004)*np.exp(-t/.24)*np.minimum(1,(d-t)/.03)
def bell(note,d=1.5):
    t=np.arange(round(d*SR),dtype=np.float32)/SR;f=hz(note)
    return (np.sin(2*np.pi*f*t)+.29*np.sin(2*np.pi*f*2.76*t)+.13*np.sin(2*np.pi*f*5.4*t))*np.exp(-t*4)*np.minimum(1,t/.002)*np.minimum(1,(d-t)/.02)
def kick(at,g):
    t=np.arange(round(.42*SR),dtype=np.float32)/SR
    add(at,np.sin(2*np.pi*(49*t+3.6*(1-np.exp(-t*32))))*np.exp(-t*15),g)
def noise(at,g,d=.12,pan=0):
    t=np.arange(round(d*SR),dtype=np.float32)/SR;n=rng.normal(size=len(t)).astype(np.float32)
    hi=n-np.convolve(n,np.ones(6)/6,'same')
    add(at,hi*np.exp(-t/d*7),g,pan)
def pad(at,chord,d,g):
    t=np.arange(round(d*SR),dtype=np.float32)/SR;env=np.minimum(1,t/.7)*np.minimum(1,(d-t)/.8)
    for j,n in enumerate(chord):
        f=hz(n);s=(np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*f*1.003*t))
        add(at,s*env,g/len(chord),-.6+j*.4)
def bass(at,n,d=.36,g=.09):
    t=np.arange(round(d*SR),dtype=np.float32)/SR;f=hz(n)
    s=np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*f*2*t)
    add(at,s*np.minimum(1,t/.008)*np.minimum(1,(d-t)/.04)*np.exp(-t*4),g)
def hit(at,name,g=.25,pan=0):
    events.append(dict(t=at,name=name))
    if name in ('coin','pin','print','merge'):
        add(at,bell({'coin':88,'pin':82,'print':67,'merge':74}[name],.5),g,pan)
        noise(at,g*.18,.045,pan)
    elif name=='impact':kick(at,g);add(at,bell(50,1.8),g*.23);noise(at,g*.2,.34)
    elif name=='riser':
        d=.65;t=np.arange(round(d*SR),dtype=np.float32)/SR;n=rng.normal(size=len(t)).astype(np.float32)
        lo=np.convolve(n,np.ones(32)/32,'same');s=(lo+.08*n)*(t/d)**2*np.minimum(1,(d-t)/.015)
        add(at,s,g,-.4);add(at+.018,s,g*.7,.4)

# Four harmonic regions. Thin passages make the spatial/typographic impacts audible.
chords=[[50,57,62,65],[46,53,60,65],[53,60,65,69],[48,55,62,67]]
motifs=[[74,77,81,79,77,74,72,69],[77,81,84,82,81,77,74,72],[74,79,81,86,84,81,79,74],[72,76,79,83,81,79,76,74]]
for bar in range(112):
    at=bar*2;s=next(x for x in cfg['scenes'] if x['start']<=at<x['end']);local=at-s['start'];sid=s['id']
    quiet=sid in ('condition','mean','interval');climax=sid in ('galton','law','standard','test');ending=sid=='finale'
    energy=.56 if quiet else 1.04 if climax else .82
    if local<2:energy*=.58
    if ending:energy=.40
    chord=chords[(bar//4)%4];pad(at,chord,2.75,.18*energy)
    if not ending:
        for beat in range(4):
            if not quiet or beat in (0,2):kick(at+beat*.5,.28*energy if beat==0 else .17*energy)
            bass(at+beat*.5+(.25 if beat%2 else 0),chord[0]-12,g=.14*energy)
            if beat%2 and not quiet:noise(at+beat*.5,.047*energy,.22)
            noise(at+beat*.5+.25,.016*energy,.07,(-1)**beat*.35)
    count=4 if quiet or ending else 8
    for k in range(count):
        when=at+k*2/count;note=chord[k%4]+12
        add(when,pluck(note,1.0),.052*energy,(-1)**k*.58)
        add(when+.375,pluck(note,1.0),.017*energy,(-1)**(k+1)*.6)
    if bar>=6 and not quiet:
        motif=motifs[(bar//8)%4]
        for k,note in enumerate(motif):
            if ending and k%2:continue
            add(at+k*.25,bell(note,1.5),.038*energy,((k%3)-1)*.21)
    if s['end']-at<=2 and not ending:
        for k in range(6):noise(at+1.25+k*.125,.012+k*.004,.13,(-1)**k*.5)

# Actual opening sequence: twelve high contacts and four lower contacts.
observed=[1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1]
for offset in (1.7,195):
    for i,h in enumerate(observed):add(offset+i*.23,bell(88 if h else 64,.4),.095 if h else .065,(-1)**i*.42)
# Identifiable scene mechanics, placed at their own operation rate.
for j in range(48):hit(25+j*.22,'pin',.027,(j%11-5)/7)
for j in range(16):hit(41+j*.25,'pin',.024,(-1)**j*.35)
for start in (136,141,146):
    for j in range(6):hit(start+.65+j/1.2,'merge',.035)
for j in range(40):hit(177+j*.25,'print',.038,-.2+.4*(j%2))
for cue in cfg['cues']:
    if cue['name']=='impact':hit(cue['t'],'impact',.27)
    elif cue['name']=='riser':hit(cue['t'],'riser',.10)
    else:add(cue['t'],bell(86,1.6),.034,.28)
# Final sustained resolution; brief fade, no long dead tail.
pad(218,[50,57,62,69],6,.16)
env=np.minimum(1,np.arange(N,dtype=np.float32)/(.12*SR))*np.minimum(1,(N-np.arange(N,dtype=np.float32))/(.55*SR))
mix*=env[:,None];mix=np.tanh(mix*1.35);mix*=.84/max(np.max(np.abs(mix)),1e-9)
raw=ROOT/'out'/'soundtrack-raw.wav';out=ROOT/'out'/'soundtrack.wav'
with wave.open(str(raw),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
target='loudnorm=I=-16:TP=-3:LRA=9'
result=subprocess.run(['ffmpeg','-hide_banner','-i',str(raw),'-af',target+':print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
stats=json.loads(result[result.rindex('{'):result.rindex('}')+1])
flt=target+':'+':'.join(f'{a}={stats[b]}' for a,b in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])+':linear=true'
subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af',flt,'-ar',str(SR),'-c:a','pcm_s16le',str(out)],check=True)
(ROOT/'out'/'audio-events.json').write_text(json.dumps(events,indent=2),encoding='utf8')
(ROOT/'out'/'audio-normalization.json').write_text(json.dumps(stats,indent=2),encoding='utf8')
print('Generated original stereo score:',D,'seconds,',len(events),'mechanical sound events')

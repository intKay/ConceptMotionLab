import json,subprocess,re,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
out=ROOT/'out';video=out/'film-v5.mp4'
cfg=json.loads((ROOT/'timeline.json').read_text(encoding='utf8'))
def run(cmd):return subprocess.run(cmd,capture_output=True,text=True,encoding='utf8',errors='replace',check=True)
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert(v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',6720)
assert abs(float(probe['format']['duration'])-224)<.035
assert abs(float(a['duration'])-float(v['duration']))<1/30
assert a['channels']==2 and int(a['sample_rate'])==44100
scan=run(['ffmpeg','-hide_banner','-v','info','-i',str(video),'-vf','blackdetect=d=0.25:pix_th=0.015:pic_th=0.98','-af','silencedetect=n=-45dB:d=0.5','-f','null','NUL'])
(out/'decode-scan.log').write_text(scan.stderr,encoding='utf8')
black=re.findall(r'black_start:[^\r\n]+',scan.stderr);silence=re.findall(r'silence_start:[^\r\n]+',scan.stderr)
assert not black and not silence,(black,silence)
ln=run(['ffmpeg','-hide_banner','-i',str(video),'-vn','-af','loudnorm=I=-16:TP=-3:LRA=9:print_format=json','-f','null','NUL']).stderr
loud=json.loads(ln[ln.rindex('{'):ln.rindex('}')+1])
assert float(loud['input_tp'])<0
frames=out/'video-frames';frames.mkdir(exist_ok=True)
# Every caption beat plus cuts on both sides and selected formula/motion states.
midpoints=[min(c['t']+2.0,cfg['duration']-.5) for c in cfg['captions']]
cuts=[round(s['start']+dt,3) for s in cfg['scenes'][1:] for dt in [-.05,.05]]
times=sorted(set([0,.25,223.5]+midpoints+cuts+[33,38,68,94,104,124,149,159,164,168,184,207,211]))
for t in times:
    run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-q:v','2',str(frames/f'{t:07.2f}.jpg')])
for page in range((len(midpoints)+11)//12):
    ts=midpoints[page*12:page*12+12];sheet=Image.new('RGB',(1600,((len(ts)+3)//4)*252),'#07161e');dr=ImageDraw.Draw(sheet)
    for i,t in enumerate(ts):
        x=i%4*400;y=i//4*252;sheet.paste(Image.open(frames/f'{t:07.2f}.jpg').resize((400,225)),(x,y));dr.text((x+8,y+231),f'{t:06.2f}s',fill='white')
    sheet.save(out/f'final-contact-{page+1}.jpg',quality=93)
sheet=Image.new('RGB',(1600,((len(cuts)+3)//4)*252),'#07161e');dr=ImageDraw.Draw(sheet)
for i,t in enumerate(cuts):
    x=i%4*400;y=i//4*252;sheet.paste(Image.open(frames/f'{t:07.2f}.jpg').resize((400,225)),(x,y));dr.text((x+8,y+231),f'{t:06.2f}s',fill='white')
sheet.save(out/'final-cuts.jpg',quality=93)
oldExpected={'feature-v4/out/film-v4.mp4':'e50ac26907780cd384753e728a367049ba6c61b8eb482f30597927dbb61b1657','long/out/film.mp4':'52f47471eb75a39b182b52e7cff3429224b3ace7df83f45a1bb9002960564438'}
old={}
for path,expected in oldExpected.items():
    sha=hashlib.sha256((ROOT.parent/path).read_bytes()).hexdigest();assert sha==expected;old[path]=sha
result={'passed':True,'video':{k:v.get(k) for k in ['codec_name','width','height','pix_fmt','r_frame_rate','nb_frames','duration']},'audio':{k:a.get(k) for k in ['codec_name','sample_rate','channels','duration']},'containerDuration':probe['format']['duration'],'bytes':video.stat().st_size,'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'blackEvents':black,'silenceEvents':silence,'loudness':loud,'extractedFrames':len(times),'frameTimes':times,'preservedOldFilms':old}
(out/'media-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False))

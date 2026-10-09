import json
import re
import subprocess
from pathlib import Path
from PIL import Image,ImageDraw

root=Path(__file__).resolve().parent
video=root/'out'/'film-v4.mp4'
probe=json.loads(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels,duration','-of','json',str(video)],capture_output=True,text=True,check=True).stdout)
assert abs(float(probe['format']['duration'])-210)<.03
v,a=probe['streams'][:2]
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1600,900,'30/1',6300)
assert abs(float(a['duration'])-210)<.03
check=subprocess.run(['ffmpeg','-hide_banner','-v','info','-i',str(video),'-vf','blackdetect=d=0.25:pix_th=0.015','-af','silencedetect=n=-45dB:d=0.5','-f','null','NUL'],capture_output=True,text=True,check=True)
events=re.findall(r'black_start|silence_start',check.stderr)
assert not events,events
times=[1,4,9,16,23,31,40,47,55,62,70,79,86,94,102,110,118,126,134,142,151,158,168,175,181,190,196,202,207]
frames=root/'out'/'video_frames';frames.mkdir(exist_ok=True)
for t in times:
    subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1',str(frames/f'{t:03d}.jpg')],check=True)
tw,th=400,225;cols=5;rows=(len(times)+cols-1)//cols
sheet=Image.new('RGB',(tw*cols,(th+24)*rows),'#0b1019');draw=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
    x=(i%cols)*tw;y=(i//cols)*(th+24)
    sheet.paste(Image.open(frames/f'{t:03d}.jpg').resize((tw,th)),(x,y))
    draw.text((x+8,y+228),f'{t}s',fill='white')
sheet.save(root/'out'/'video_contact.jpg',quality=92)
print(json.dumps({'duration':probe['format']['duration'],'size':probe['format']['size'],'video':v,'audio':a,'black_or_silence_events':len(events),'frames_inspected':len(times)},ensure_ascii=False))

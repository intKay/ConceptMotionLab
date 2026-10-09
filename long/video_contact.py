from pathlib import Path
from subprocess import run
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parent
video=root/'out'/'film.mp4'
times=[.5,5,9.5]+[x+5 for x in range(10,210,10)]+[39.9,40.1,99.9,100.1,159.9,160.1,199.9,200.1]
times=sorted(set(times))
folder=root/'out'/'video_frames';folder.mkdir(exist_ok=True)
for t in times:
    path=folder/f'{t:06.2f}.jpg'
    run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1',str(path)],check=True)
cols=4;tw,th=320,180;rows=(len(times)+cols-1)//cols
sheet=Image.new('RGB',(cols*tw,rows*(th+25)),'#080d18');d=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
    pic=Image.open(folder/f'{t:06.2f}.jpg').convert('RGB').resize((tw,th))
    x,y=(i%cols)*tw,(i//cols)*(th+25)
    sheet.paste(pic,(x,y));d.text((x+7,y+183),f'{t:.2f}s',fill='#fff')
sheet.save(root/'out'/'video_contact.jpg',quality=92)
print('wrote',root/'out'/'video_contact.jpg','frames',len(times))

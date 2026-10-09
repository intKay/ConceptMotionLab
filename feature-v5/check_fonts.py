from pathlib import Path
from PIL import ImageFont

root=Path(__file__).resolve().parent
text=''.join((root/name).read_text(encoding='utf8') for name in ['scenes.js','timeline.json','draw.js','film.js'])
chars={c for c in text if ord(c)>127 and not c.isspace()}
for path in (root.parent/'long'/'fonts').glob('*.ttf'):
    font=ImageFont.truetype(str(path),48)
    missing_glyph=bytes(font.getmask(chr(0x10ffff)))
    missing=''.join(sorted(c for c in chars if bytes(font.getmask(c))==missing_glyph))
    print(path.name,'missing',ascii(missing))
    assert not missing

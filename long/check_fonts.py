import json
from pathlib import Path
from PIL import ImageFont

root=Path(__file__).resolve().parent
scenes=json.loads((root/'timeline.json').read_text(encoding='utf-8'))['scenes']
chars=set(''.join(str(s[k]) for s in scenes for k in ('label','title','caption')))
for path in sorted((root/'fonts').glob('*.ttf')):
    font=ImageFont.truetype(str(path),48)
    tofu=bytes(font.getmask('\U0010ffff'))
    missing=''.join(sorted(c for c in chars if bytes(font.getmask(c))==tofu))
    print(path.name, 'same glyph as missing-character marker:',ascii(missing))

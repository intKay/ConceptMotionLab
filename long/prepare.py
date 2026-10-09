from pathlib import Path

project = Path(__file__).resolve().parent.parent
dest = project / 'long'
source = (project / 'scripts' / 'export.mjs').read_text(encoding='utf-8')
source = source.replace("resolve(dirname(fileURLToPath(import.meta.url)),'..')", "resolve(dirname(fileURLToPath(import.meta.url)))")
source = source.replace("'out/sample.mp4'", "'out/film.mp4'")
source = source.replace("'out','shots'", "'shots'")
if not (dest / 'export.mjs').exists():
    (dest / 'export.mjs').write_text(source, encoding='utf-8')

music = (project / 'scripts' / 'music.py').read_text(encoding='utf-8')
music = music.replace('Path(__file__).resolve().parents[1]', 'Path(__file__).resolve().parent')
music = music.replace('20260928', '20260929')
music = music.replace('breakdown = 20 <= start < 26', 'breakdown = 100 <= start < 110 or 160 <= start < 170')
music = music.replace('ending = start >= 44', 'ending = start >= 202')
music = music.replace('if bar in (4,9,14,20):', 'if bar in (4,24,49,64,84,94):')
music = music.replace('add(10+j*.117', 'add(30+j*.117')
if not (dest / 'music.py').exists():
    (dest / 'music.py').write_text(music, encoding='utf-8')

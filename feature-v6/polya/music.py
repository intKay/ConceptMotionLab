"""《回家的概率》原创程序配乐（48 秒，100 BPM，20 小节）。不使用任何外部音频素材。

延续 fireflies 10–14 秒用户认可的做法：数据事件 = 音粒，泛音列音高，长混响。
- 每一次“回到原点”= 一粒音。一维密如细雨，二维稀疏，三维几乎只剩开头几粒，随后安静：维度越高，声音越少。
- 首次回家用较亮的玻璃音，之后的回访音粒逐次变轻。
- 行者走失后（三维后段）出现一层高而失谐的泛音，代表越走越远的人。
- “为什么”一段把三个部分和变成三条持续音：一维是无限上行的谢泼德音（∞），二维缓慢爬升（∞，但很慢），
  三维的频率 = 110 Hz × 部分和，收敛到 110 × 1.516 ≈ 166.8 Hz，几乎正好是纯五度（3/2），停住。
所有时刻读自 out/events.json（由 film.js 的 __events() 导出）。
    python -X utf8 feature-v6/polya/music.py   （先运行 export.mjs --events）
"""
import json, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
cue = json.loads((ROOT / 'out' / 'events.json').read_text(encoding='utf8'))
SR = 48000; DUR = cue['duration']; N = int(DUR * SR); BAR = cue['bar']; BEAT = BAR / 4
F0 = 55.0
rng = np.random.default_rng(20261009)
bus = {k: np.zeros((N, 2)) for k in ('wet', 'far', 'dry')}   # wet=普通混响，far=更远的长混响，dry=低频不混响
ev = cue['events']
get = lambda typ, **kw: [e for e in ev if e['type'] == typ and all(e.get(k) == v for k, v in kw.items())]
first = lambda typ, **kw: get(typ, **kw)[0]


def add(at, s, g=1.0, pan=0.0, to='wet'):
    i = int(round(at * SR))
    if i >= N or g == 0: return
    if i < 0: s = s[-i:]; i = 0
    n = min(len(s), N - i)
    lr = np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)])
    bus[to][i:i + n] += s[:n, None] * lr * g


tt = lambda d: np.arange(int(d * SR)) / SR


def grain(f, d=.06):
    t = tt(d); return np.sin(2 * np.pi * f * t) * np.sin(np.pi * t / d) ** 2


def glint(f, d=1.0, bright=1.0, ratio=3.5):
    t = tt(d); idx = bright * 2.0 * np.exp(-t * 7)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * ratio * t)) + .2 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9)
    return s * np.minimum(1, t / .004) * np.exp(-t / (d * .3)) * np.minimum(1, (d - t) / .02)


def bell(f, d=3.0):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 1.5) + .18 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 3)
    return s * np.minimum(1, t / .003) * np.exp(-t / (d * .35)) * np.minimum(1, (d - t) / .05)


def tone(freq, d, a=.5, r=.8, partials=((1, 1), (2, .3), (3, .1))):
    t = tt(d); f = freq(t) if callable(freq) else np.full_like(t, freq)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return sum(w * np.sin(k * ph) for k, w in partials) * np.minimum(1, t / a) * np.minimum(1, (d - t) / r)


def noise_swell(d, rev=False, lo=60):
    t = tt(d); x = np.convolve(rng.normal(size=len(t)), np.ones(lo) / lo, 'same')
    e = (t / d) ** 2.2 * np.minimum(1, (d - t) / .03)
    s = x * e; return s[::-1] if rev else s


ramp = lambda t, a, b: np.clip((t - a) / (b - a), 0, 1)
t = tt(DUR)

# ---- 1. 地面：55 Hz 泛音列持续层，层数随维度增加 ----
breath = .6 + .4 * np.sin(np.pi * ((t % BAR) / BAR)) ** 2
layers = [(1, 0, 0, 1.0), (2, .5, 0, .5), (3, 10.8, .1, .3), (5, 21.4, -.07, .18), (7, 22.4, .11, .12)]
for p, on, det, w in layers:
    env = ramp(t, on, on + 2.5) * (1 - .75 * ramp(t, 32.4, 33.6)) * (1 + 1.2 * ramp(t, 43.2, 45.5) * (p <= 5))
    env *= np.minimum(1, t / 1.5) * np.minimum(1, (DUR - t) / 1.2)
    s = np.sin(2 * np.pi * (F0 * p + det) * t + .3 * np.sin(2 * np.pi * .13 * p * t))
    add(0, s * env * breath, .05 * w, 0, 'dry' if p <= 2 else 'wet')

# ---- 2. 脉动：一维到三维前段每拍一叩；三维中后段逐渐消失（走失） ----
for b in range(int(DUR / BEAT)):
    at = b * BEAT
    if at < 4.8 or at >= 30.0: continue
    fade = 1 - np.clip((at - 25.5) / 4.5, 0, 1)
    p = [2, 2, 3, 2][int(at / BAR) % 4] if at < 21.4 else 2
    k = tt(.2); s = np.sin(2 * np.pi * F0 * p * k) * np.minimum(1, k / .003) * np.exp(-k / .05)
    add(at, s, (.09 if b % 4 == 0 else .045) * fade)

# ---- 3. 标题：家的钟声 ----
e = first('title'); add(e['t'], bell(F0 * 8, 3.5), .16, 0); add(e['t'] + .02, bell(F0 * 12, 3.0), .05, .2)

# ---- 4. 主角 16 步：左右轻叩，回到原点时是家的音 ----
for e in get('step'):
    if e['home']: add(e['t'], glint(F0 * 8, 1.2, .8), .14, 0)
    else:
        p = 6 + abs(e['x']) * (1 if e['x'] > 0 else .5)
        add(e['t'], grain(F0 * p, .07), .10, np.clip(e['x'] / 5, -.9, .9))

# ---- 5. 回到原点：音粒 ----
sets = {1: [8, 9, 10, 12], 2: [10, 12, 14, 15, 16], 3: [16, 18, 20, 21, 24]}
from collections import Counter
same = Counter((e['d'], e['s']) for e in get('ret'))       # 同一步多人同时回家：按人数开方压低，并错开几十毫秒
for e in get('ret'):
    if e['hero'] and e['s'] <= 16: continue          # 已在步进中发声
    d, w, v = e['d'], e['w'], e['visit']
    f = F0 * sets[d][w % len(sets[d])]
    pan = ((w * 0.618) % 1) * 1.6 - .8
    c = same[(d, e['s'])]; gc = 1 / np.sqrt(c); e = dict(e, t=e['t'] + (((w * 0.377) % 1) * .09 if c > 1 else 0))
    if e['first']:
        add(e['t'], glint(f, .9 if d > 1 else .5, .7), {1: .022, 2: .06, 3: .11}[d] * gc, pan, 'far' if d == 3 else 'wet')
    else:
        add(e['t'], grain(f, .06), {1: .014, 2: .03, 3: .05}[d] / np.sqrt(v) * gc, pan)

# ---- 6. 倒带与展开 ----
for e in get('rewind'):
    add(e['t'], noise_swell(e['dur'] + .3), .09, 0)
    add(e['t'], tone(lambda x, d=e['dur']: F0 * 8 * 2 ** (-1.5 * x / d), e['dur'] + .2, .05, .3), .05, 0)
    add(e['t'] + e['dur'] - .05, bell(F0 * 8, 2.5), .10, 0)
for e in get('unfold'):
    p = 3 if e['d'] == 2 else 5
    add(e['t'], tone(F0 * p * 2, 3.0, .6, 1.4), .06, -.3 if e['d'] == 2 else .3)
    add(e['t'] + .3, glint(F0 * p * 4, 1.5, .5, 2.0), .07, .4 if e['d'] == 2 else -.4)

# ---- 7. 三维的走失层：高而失谐，随回家停止而浮现 ----
lost = sum(np.sin(2 * np.pi * (F0 * p + dt) * t + 2 * np.sin(2 * np.pi * .07 * (j + 1) * t)) for j, (p, dt) in enumerate([(21, .0), (22, .9), (23, -.7), (25, .4)]))
lenv = ramp(t, 24.5, 29) * (1 - ramp(t, 32.4, 34)) + .5 * ramp(t, 43.2, 45) * (1 - ramp(t, 46.5, 48))
add(0, lost * lenv * (.6 + .4 * np.sin(2 * np.pi * .3 * t)), .012, 0, 'far')

# ---- 8. 为什么：泳道长出 = 轻弹；部分和 = 三条持续音 ----
e = first('why'); add(e['t'], tone(F0, 3, .02, 2.5, ((1, 1), (2, .5))), .12, 0, 'dry')
for e in get('lane'):
    f = F0 * {1: 8, 2: 12, 3: 16}[e['d']] * (1 + 2 * e['u'])
    add(e['t'], grain(f, .05), .05 * (.4 + 3 * e['u']), {1: -.5, 2: 0, 3: .5}[e['d']])
st = first('stack'); T0 = st['t']; T1 = 43.6; L = T1 - T0
cv = {int(k): np.array(v) for k, v in st['curve'].items()}
S = lambda d, x: np.interp(T0 + x, cv[d][:, 0], cv[d][:, 1])
# 一维：谢泼德音，八度位置 = log2(S)，无限上行
x = tt(L); oc = np.log2(S(1, x)) * 1.0
shep = np.zeros_like(x)
for j in range(6):
    pos = (oc + j) % 6; f = 55 * 2 ** pos
    ph = 2 * np.pi * np.cumsum(f) / SR
    shep += np.sin(ph) * np.exp(-((pos - 3) ** 2) / 2.2)
add(T0, shep * np.minimum(1, x / .6) * np.minimum(1, (L - x) / 1.5), .045, -.45)
# 二维：频率 = 110 × S，缓慢但不停地上升
add(T0, tone(lambda x: 110 * S(2, x), L, .6, 1.5), .06, 0)
# 三维：频率 = 110 × S → 110 × 1.516，收敛后保持到片尾
L3 = DUR - T0
add(T0, tone(lambda x: 110 * np.where(x < L, S(3, np.minimum(x, L)), st['M3']), L3, .6, 2.0, ((1, 1), (2, .4), (3, .15))), .07, .45)
for e in get('formula'):
    add(e['t'], bell(F0 * [8, 10, 12, 9][e['i']], 2.5), .07, [-.3, .3, -.2, .4][e['i']])

# ---- 9. 尾声：泛音和弦；最后一声家的钟 ----
e = first('coda')
for j, p in enumerate([2, 3, 4, 5, 6, 8]):
    add(e['t'] + j * .15, tone(F0 * p, DUR - e['t'] - j * .15, 1.5, 2.5), .03, -.6 + .24 * j)
add(46.0, bell(F0 * 8, 2.0), .12, 0)

# ---- 混响：两种长度的合成脉冲响应，FFT 卷积 ----
def reverb(x, sec, decay):
    L = int(sec * SR); k = np.arange(L) / SR
    ir = rng.normal(size=(L, 2)) * np.exp(-k / decay)[:, None]; ir[:int(.015 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    nfft = 1 << int(np.ceil(np.log2(N + L)))
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[:N] for c in range(2)], 1)
out = bus['wet'] * .75 + reverb(bus['wet'], 2.6, .6) * .45 + bus['far'] * .35 + reverb(bus['far'], 5.0, 1.5) * .8 + bus['dry']
out *= np.minimum(1, (DUR - t) / .8)[:, None] * np.minimum(1, t / .05)[:, None]
out = np.tanh(out * 1.3) / 1.3
out *= 10 ** (-1 / 20) / np.abs(out).max()
with wave.open(str(ROOT / 'out' / 'score.wav'), 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((out * 32767).astype('<i2').tobytes())
print(f'wrote out/score.wav  {DUR}s  rms {20 * np.log10(np.sqrt((out ** 2).mean())):.1f} dBFS')
for s0 in range(0, DUR, 4):
    seg = out[s0 * SR:(s0 + 4) * SR]; print(f'  {s0:2d}-{s0 + 4:2d}s  rms {20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9):6.1f}  peak {20 * np.log10(np.abs(seg).max() + 1e-9):5.1f}')

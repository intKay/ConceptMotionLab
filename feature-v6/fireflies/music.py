"""《你撞见的黑暗》原创程序配乐（24 秒，100 BPM，10 小节）。不使用任何外部音频素材。

声音即数据：所有提示点读自 out/events.json（由 film.js 的 __events() 导出，与画面同源）。
- 音高系统：以 55 Hz 为基音的自然泛音列（含第 7、11、13 泛音），不用十二平均律。
- 每次萤火闪光 = 一个 FM 玻璃音，时刻不量化（泊松节奏与 100 BPM 底层脉动错位）。
- 每次抬头 = 一粒极短音粒，音高由它落入的间隔长度决定：长间隔更低。480 粒的整体音高中心随之下沉。
- 两条均值线 = 两个持续音，频率 = 220 Hz × 均值；加权均值从 0.99 滑到 1.94，听到的是一个“几乎八度”的上滑。
    python -X utf8 feature-v6/fireflies/music.py   （先运行 export.mjs --events）
"""
import json, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
cue = json.loads((ROOT / 'out' / 'events.json').read_text(encoding='utf8'))
SR = 48000; DUR = cue['duration']; N = int(DUR * SR); BAR = cue['bar']; BEAT = BAR / 4
F0 = 55.0
rng = np.random.default_rng(20261009)
mix = np.zeros((N, 2), np.float64)
dry = np.zeros((N, 2), np.float64)       # 不进混响的成分（低频持续音）


def add(at, s, g=1.0, pan=0.0, wet=True):
    i = int(round(at * SR))
    if i >= N: return
    if i < 0: s = s[-i:]; i = 0
    n = min(len(s), N - i)
    lr = np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)])
    (mix if wet else dry)[i:i + n] += s[:n, None] * lr * g


def tt(d): return np.arange(int(d * SR)) / SR


def env(t, a, d, total=None):
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
    if total: e *= np.minimum(1, (total - t) / .02)
    return e


def glint(p, d=1.1, bright=1.0):
    """FM 玻璃音：载波=第 p 泛音，调制比 3.5（非整数，偏玻璃质感）"""
    t = tt(d); f = F0 * p
    idx = bright * 2.2 * np.exp(-t * 6)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t))
    s += .25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9)
    return s * env(t, .004, d * .32, d)


def grain(p, d=.05):
    t = tt(d); f = F0 * p
    return np.sin(2 * np.pi * f * t) * np.sin(np.pi * t / d) ** 2


def air(d, f_from, f_to):
    """下落的气流：随时间滑动的共振带通噪声（逐块滤波）"""
    n = int(d * SR); x = rng.normal(size=n); out = np.zeros(n); y1 = y2 = 0.0
    for k in range(n):
        u = k / n; f = f_from * (f_to / f_from) ** u; r = .985
        c = 2 * r * np.cos(2 * np.pi * f / SR)
        y = x[k] * (1 - r) + c * y1 - r * r * y2; y2, y1 = y1, y; out[k] = y
    t = np.arange(n) / SR
    return out / (np.abs(out).max() + 1e-9) * np.sin(np.pi * t / d) ** 1.5


def tone(freq_fn, d, a=.6, r=.8, partials=((1, 1), (2, .35), (3, .12))):
    """频率可随时间变化的持续音（相位累积，滑音无断裂）"""
    t = tt(d); f = freq_fn(t); ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(w * np.sin(k * ph) for k, w in partials)
    return s * np.minimum(1, t / a) * np.minimum(1, (d - t) / r)


ev = cue['events']
get = lambda typ: [e for e in ev if e['type'] == typ]

# ---- 1. 夜气：基音 1/2/3 泛音缓慢拍频，整片渐强，每小节一次“呼吸” ----
t = tt(DUR)
grow = np.clip(t / 9, 0, 1) * (1 - .35 * np.clip((t - 19.2) / 4.8, 0, 1))
drone = (np.sin(2 * np.pi * F0 * t) + .5 * np.sin(2 * np.pi * (F0 * 2 + .13) * t) + .22 * np.sin(2 * np.pi * (F0 * 3 - .09) * t))
breath = .55 + .45 * np.sin(np.pi * ((t % BAR) / BAR)) ** 2
add(0, drone * grow * breath * np.minimum(1, (DUR - t) / .6), .055, 0, wet=False)
noise = rng.normal(size=N); lp = np.convolve(noise, np.ones(40) / 40, 'same')
add(0, lp * breath * (.3 + .7 * grow) * np.minimum(1, t / 2) * np.minimum(1, (DUR - t) / .6), .05)

# ---- 2. 底层脉动：第 3 小节起，每拍一个极短的低泛音“叩”（音高随小节在 2/3/4 泛音间走） ----
for b in range(int(DUR / BEAT)):
    at = b * BEAT
    if at < 2 * BAR or at >= 19.2: continue
    bar = int(at / BAR); p = [2, 2, 3, 2, 4, 3, 2, 3][bar % 8]
    k = tt(.18); s = np.sin(2 * np.pi * F0 * p * k) * env(k, .003, .045, .18)
    add(at, s, .10 if b % 4 == 0 else .05, .0)

# ---- 3. 萤火闪光：FM 玻璃音，时刻不量化 ----
pent = [8, 9, 10, 11, 12, 13, 14, 16]
for e in get('flash'):
    i = e['i']; fast = e['fast']
    if fast:   # 快进：音高随序号逐级抬升，形成加速上行的串
        p = pent[min(len(pent) - 1, (i * 3) % 8)] * (1 if i < 50 else 1.5 if i < 80 else 2)
        add(e['t'], glint(p, .45, .6), .045, e['pan'] * .8)
    else:
        p = pent[(i * 5 + 2) % 8]
        add(e['t'], glint(p, 1.4), .16, e['pan'] * .7)

# ---- 4. 示范一瞥：下落气流 → 冷色落点 → 括号闭合时报出这段黑暗的“长度音” ----
e = get('demoFall')[0]; add(e['t'], air(.34, 3200, 700), .09)
e = get('demoLand')[0]; k = tt(1.6)
add(e['t'], (np.sin(2 * np.pi * 880 * k) + .4 * np.sin(2 * np.pi * 1320 * k)) * env(k, .002, .5, 1.6), .09, .4)
e = get('demoClose')[0]; k = tt(1.8)
add(e['t'], tone(lambda x: np.full_like(x, 220 / e['len']), 1.8, .02, 1.2), .07, .2)

# ---- 5. 长卷折行：四行各落一个泛音（第 4、5、6、7 泛音），合成自然泛音和弦 ----
for e in get('rowSettle'):
    p = [7, 6, 5, 4][e['r']]
    add(e['t'] - .25, tone(lambda x, p=p: F0 * p * (1 + .002 * np.sin(2 * np.pi * 4.5 * x)), 5.0, .35, 1.5), .045, -.6 + .4 * e['r'])
    add(e['t'], glint(p * 2, .8, .4), .05, -.6 + .4 * e['r'])

# ---- 6. 480 次抬头：音粒，长间隔→低泛音 ----
for e in get('glance'):
    p = int(np.clip(round(30 / (e['len'] + .7)), 5, 32))
    add(e['t'], grain(p, .06), .033, e['pan'] * .9)

# ---- 7. 黑暗立起成柱：由长到短依次落地，音高由低到高 ----
for e in get('barLand'):
    p = int(np.clip(round(26 / (e['len'] + .9)), 4, 28))
    add(e['t'], glint(p, .5, .3), .035, -.8 + 1.6 * e['rank'] / 96)

# ---- 8. 均值线 = 持续音：220 Hz × 均值 ----
m1 = get('mean1')[0]; w = get('weight')[0]; end = DUR - m1['t']
add(m1['t'], tone(lambda x: np.full_like(x, 220 * m1['value']), end, .5, 1.6), .07, -.25)
curve = np.array(w['curve'])
def wf(x):
    return 220 * np.interp(w['t'] + x, curve[:, 0], curve[:, 1])
add(w['t'], tone(wf, DUR - w['t'], .4, 1.6, ((1, 1), (2, .25), (4, .06))), .075, .25)

# ---- 9. 收束：第 2/4/5/6/8 泛音铺开，尾声单只萤火 ----
r = get('resolve')[0]
for j, p in enumerate([2, 4, 5, 6, 8]):
    add(r['t'] + j * .12, tone(lambda x, p=p: F0 * p + 0 * x, DUR - r['t'] - j * .12, 1.2, 2.2), .028, -.6 + .3 * j)
c = get('coda')[0]; add(c['t'], glint(16, 1.4, 1.2), .12, .7)

# ---- 混响：合成指数衰减噪声脉冲响应，FFT 卷积 ----
L = int(2.6 * SR); k = np.arange(L) / SR
ir = rng.normal(size=(L, 2)) * np.exp(-k / .62)[:, None]
ir[:int(.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
nfft = 1 << int(np.ceil(np.log2(N + L)))
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[:N] for c in range(2)], 1)
out = mix * .78 + wet * .42 + dry
out *= np.minimum(1, (DUR - np.arange(N) / SR) / .5)[:, None]
out = np.tanh(out * 1.4) / 1.4
out *= 10 ** (-1 / 20) / np.abs(out).max()
pcm = (out * 32767).astype('<i2')
with wave.open(str(ROOT / 'out' / 'score.wav'), 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
rms = 20 * np.log10(np.sqrt((out ** 2).mean()))
print(f'wrote out/score.wav  {DUR}s  {SR}Hz stereo  peak -1.0 dBFS  rms {rms:.1f} dBFS')

"""《你撞见的黑暗》固定数据：泊松闪光间隔 + 均匀随机抬头。

输出 data.js（画面）与 out/model.json（配乐、验证）。随机数只在这里抽一次。
种子选择：从 1 开始顺序尝试，取第一个满足下列"代表性"条件的种子（条件写死在 ok() 中，
屏幕上的数字全部是该样本的实际统计值，不做缩放）。
    python -X utf8 feature-v6/fireflies/model.py
"""
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
G, M = 96, 480            # 96 段黑暗（间隔）、480 次随机抬头
ROW_CAP = 25.0            # 每行最多容纳 25 秒（按整段换行，像文字折行）
ACT1_SHIFT = .6           # 第一幕：片中时间 = 萤火时间 + 0.6
ACT1_END = 6.9            # 第一幕实时播放到萤火时间 6.9


def build(seed):
    rng = np.random.default_rng(seed)
    gaps = rng.exponential(1.0, G)
    flashes = np.concatenate([[0.0], np.cumsum(gaps)])        # F0..FG，F0=0
    total = flashes[-1]
    glances = np.sort(rng.uniform(0, total, M))
    hit_gap = np.searchsorted(flashes, glances, side='right') - 1   # 落入第 j 段：F[j] <= g < F[j+1]
    hits = np.bincount(hit_gap, minlength=G)
    order = rng.permutation(M)                                  # 抬头落下的先后顺序（与时刻无关）
    return rng, gaps, flashes, total, glances, hit_gap, hits, order


def demo_gap(gaps, flashes):
    # 第一幕示范的那一瞥：落进 [1.5, ACT1_END-0.4] 内完整出现的最长一段黑暗，取其 38% 处
    best = None
    for j in range(G):
        a, b = flashes[j], flashes[j + 1]
        if a >= 1.5 and b <= ACT1_END - .4 and (best is None or gaps[j] > gaps[best]):
            best = j
    return best


def ok(gaps, hits, flashes):
    mean = gaps.mean()
    wmean = (hits * gaps).sum() / hits.sum()
    j = demo_gap(gaps, flashes)
    return abs(mean - 1) < .03 and abs(wmean - 2) < .08 and gaps.max() < 5.0 and j is not None and gaps[j] > 1.3


seed = 1
while True:
    _, gaps, flashes, total, glances, hit_gap, hits, order = build(seed)
    if ok(gaps, hits, flashes):
        break
    seed += 1

# 折行：整段黑暗不跨行
rows, cur, start = [], [], 0.0
for j in range(G):
    if cur and flashes[j + 1] - start > ROW_CAP:
        rows.append(cur); cur, start = [], flashes[j]
    cur.append(j)
rows.append(cur)
row_of = [0] * G
for r, js in enumerate(rows):
    for j in js:
        row_of[j] = r

dj = demo_gap(gaps, flashes)
demo_t = float(flashes[dj] + .38 * gaps[dj])
mean = float(gaps.mean())
wmean = float((hits * gaps).sum() / hits.sum())
rank = np.argsort(-gaps, kind='stable')            # 由长到短
sorted_pos = np.empty(G, int); sorted_pos[rank] = np.arange(G)

# 每次闪光对应一只萤火虫在画面中的位置（只作场景，不携带数据）
frng = np.random.default_rng(seed + 7000)
fx = frng.uniform(140, 1780, G + 1); fy = frng.uniform(170, 640, G + 1)

data = dict(
    seed=seed, G=G, M=M, rowCap=ROW_CAP, act1Shift=ACT1_SHIFT, act1End=ACT1_END,
    gaps=[round(float(x), 6) for x in gaps], flashes=[round(float(x), 6) for x in flashes], total=round(float(total), 6),
    glances=[round(float(x), 6) for x in glances], hitGap=hit_gap.tolist(), hits=hits.tolist(), order=order.tolist(),
    rows=rows, rowOf=row_of, sortedPos=sorted_pos.tolist(),
    demoGap=int(dj), demoT=round(demo_t, 6),
    mean=mean, weightedMean=wmean, theoryMean=1.0, theoryWeightedMean=2.0,
    fireflyX=[round(float(x), 1) for x in fx], fireflyY=[round(float(y), 1) for y in fy],
)
(ROOT / 'out').mkdir(exist_ok=True)
(ROOT / 'out' / 'model.json').write_text(json.dumps(data), encoding='utf8')
(ROOT / 'data.js').write_text('// 由 model.py 生成，勿手改\nexport default ' + json.dumps(data) + ';\n', encoding='utf8')
print(f'seed={seed} gaps={G} glances={M} total={total:.3f}s rows={len(rows)} '
      f'mean={mean:.4f} weighted={wmean:.4f} max={gaps.max():.3f} hitsMax={hits.max()} zeroHit={(hits==0).sum()} '
      f'demoGap={dj} len={gaps[dj]:.3f} at={demo_t:.3f}')

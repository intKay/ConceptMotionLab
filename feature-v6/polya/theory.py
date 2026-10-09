"""Pólya 回返定理的精确理论表：简单对称随机游走在 d=1,2,3 维。

u[d][m] = P(第 2m 步恰在原点)，f = 首次回到原点的分布（更新方程 u_n = Σ f_k u_{n-k}），
F[d][m] = P(前 2m 步内至少回过一次原点)，S[d][m] = Σ_{k<=m} u[d][k]（期望在家次数的部分和，含出发那一次）。
    1D: u = C(2m,m)/4^m
    2D: u = (C(2m,m)/4^m)^2
    3D: u = C(2m,m)/4^m · a(m)/9^m，a(m) = Σ_k C(m,k)^2 C(2k,k)（三项式系数平方和，OEIS A002893）
输出 theory.js（画面）与 out/theory.json（配乐、验证）。
    python -X utf8 feature-v6/polya/theory.py
"""
import json
from math import lgamma, log, exp
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
NSTEP = 16384                    # 二维、三维画面走到 16384 步
MM = NSTEP // 2
P3 = 0.3405373296                 # 三维回返概率（Watson 积分给出的已知常数）
M3 = 1 / (1 - P3)                 # 期望在家次数 1.516386…

m = np.arange(MM + 1)
lg = np.vectorize(lgamma)
c = np.exp(lg(2 * m + 1) - 2 * lg(m + 1) - m * log(4))          # C(2m,m)/4^m
u1 = c
u2 = c * c
a = np.empty(MM + 1)
for n in range(MM + 1):                                           # a(n)/9^n，对数域求和避免溢出
    k = np.arange(n + 1)
    lt = 2 * (lgamma(n + 1) - lg(k + 1) - lg(n - k + 1)) + lg(2 * k + 1) - 2 * lg(k + 1) - n * log(9)
    mx = lt.max(); a[n] = exp(mx) * np.exp(lt - mx).sum()
u3 = c * a
assert abs(u3[1] - 1 / 6) < 1e-12 and abs(u2[1] - .25) < 1e-12


def first_return(u):
    f = np.zeros_like(u)
    for n in range(1, len(u)):
        f[n] = u[n] - np.dot(f[1:n], u[n - 1:0:-1])
    return f


out = {}
for d, u in ((1, u1), (2, u2), (3, u3)):
    f = first_return(u)
    out[d] = dict(u=u, F=np.cumsum(f), S=np.cumsum(u))
# 校验：三维部分和应逼近 1/(1-P3)，F 应逼近 P3（尾项 ~ m^{-1/2}）
tail3 = M3 - out[3]['S'][-1]
print(f'3D: S(8192)={out[3]["S"][-1]:.6f}  limit {M3:.6f}  tail {tail3:.5f};  F(16384)={out[3]["F"][-1]:.6f}  limit {P3}')
print(f'2D: F(16384)={out[2]["F"][-1]:.4f}  S={out[2]["S"][-1]:.4f};  1D: F(1024)={out[1]["F"][512]:.4f}  S(16384)={out[1]["S"][-1]:.2f}')
print(f'2D 渐近 1-π/ln n at 16384: {1 - np.pi / log(NSTEP):.4f}')

r = lambda arr: [float(f'{x:.7g}') for x in arr]
data = dict(NSTEP=NSTEP, P3=P3, M3=M3,
            u={d: r(out[d]['u']) for d in out}, F={d: r(out[d]['F']) for d in out}, S={d: r(out[d]['S']) for d in out})
(ROOT / 'out').mkdir(exist_ok=True)
(ROOT / 'out' / 'theory.json').write_text(json.dumps(data), encoding='utf8')
(ROOT / 'theory.js').write_text('// 由 theory.py 生成，勿手改\nexport default ' + json.dumps(data) + ';\n', encoding='utf8')

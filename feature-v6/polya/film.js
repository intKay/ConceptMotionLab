// v6 第四方向《回家的概率》：Pólya 回返定理。
// 一维、二维的简单对称随机游走必然回到原点；三维只有约 34%。原因：期望回家次数 Σ P(第 n 步在家) 在三维收敛。
// 画面只由 t 与固定数据决定：行走路径在页面加载时用固定种子 PRNG 一次生成，理论值来自 theory.js（theory.py 精确计算）。
import TH from './theory.js';

const W = 1920, H = 1080, DUR = 48;
const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
const C = {
  bg0: '#07070b', bg1: '#0e0c15', ink: '#efe9dd', dim: '#8d8a99', faint: '#3b3a4c',
  home: '#ffb45a', homeRGB: '255,180,90', away: '#9aaeff', awayRGB: '154,174,255', violetRGB: '190,150,255',
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eout = x => 1 - Math.pow(1 - clamp(x), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const win = (t, a, b, c, d) => sm(seg(t, a, b)) * (1 - sm(seg(t, c, d)));
const mix = (a, b, u) => a.split(',').map((v, i) => Math.round(lerp(+v, +b.split(',')[i], u))).join(',');

// ---------- 时间轴（100 BPM，一小节 2.4 秒，共 20 小节） ----------
const T = {
  single: 2.4, stepDt: .15, crowd: 4.8, crowdEnd: 9.2,
  rew1: 9.6, rew1End: 10.8, axis2: 10.8,
  d2: 12.0, d2End: 19.8, rew2: 20.4, rew2End: 21.4, tilt: 21.4, tiltEnd: 22.8,
  d3: 22.8, d3End: 31.0, why: 32.4, lanes: 33.0, stack: 35.4, stackEnd: 39.0, formula: 39.6, coda: 43.2,
};
const NS = TH.NSTEP, N1 = 1024, W1 = 160, W2 = 240, W3 = 400, HERO_STEPS = 16;

// ---------- 固定种子行走 ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SEED = { 1: 20261009, 2: 20261010, 3: 20261011 };
function walks(d, nw, ns) {
  const rnd = mulberry32(SEED[d]), P = new Int16Array(nw * (ns + 1) * d), first = new Float64Array(nw).fill(Infinity), rets = [];
  for (let w = 0; w < nw; w++) {
    const o = w * (ns + 1) * d, p = [0, 0, 0];
    for (let s = 1; s <= ns; s++) {
      const r = Math.floor(rnd() * 2 * d), ax = r >> 1; p[ax] += (r & 1) ? 1 : -1;
      for (let a = 0; a < d; a++) P[o + s * d + a] = p[a];
      if (p[0] === 0 && p[1] === 0 && p[2] === 0) { if (first[w] === Infinity) first[w] = s; rets.push([s, w]); }
    }
  }
  return { d, nw, ns, P, first, rets };
}
const WK = { 1: walks(1, W1, N1), 2: walks(2, W2, NS), 3: walks(3, W3, NS) };
// 一维主角：编号最小、前 16 步至少回家 3 次的行者，交换到 0 号（展示选择，记录在 DESIGN.md）
const heroOrig = (() => { const k = WK[1]; for (let w = 0; w < k.nw; w++) { let c = 0; for (let s = 2; s <= HERO_STEPS; s += 2) if (k.P[w * (N1 + 1) + s] === 0) c++; if (c >= 3) return w; } return 0; })();
const order1 = Array.from({ length: W1 }, (_, i) => i); order1[0] = heroOrig; order1[heroOrig] = 0;
const pos = (k, w, s, a) => k.P[(w * (k.ns + 1) + s) * k.d + a];
const retSorted = {}; for (const d of [1, 2, 3]) retSorted[d] = Float64Array.from(WK[d].rets.map(r => r[0])).sort();
const heroRets = []; for (let s = 2; s <= N1; s += 2) if (pos(WK[1], heroOrig, s, 0) === 0) heroRets.push(s);
const countIn = (arr, a, b) => { const lb = x => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m + 1; else hi = m; } return lo; }; return Math.max(0, lb(b) - lb(a)); };
const returnedBy = (d, n) => { const f = WK[d].first; let c = 0; for (let i = 0; i < f.length; i++) if (f[i] <= n) c++; return c / f.length; };
const theoryF = (d, n) => { const m = Math.floor(n / 2), F = TH.F[d]; return m <= 0 ? 0 : F[Math.min(m, F.length - 1)]; };

// ---------- 各维的“已走步数” n(t) ----------
function n1(t) {
  if (t < T.single) return 0;
  if (t < T.crowd) { const x = (t - T.single) / T.stepDt, i = Math.floor(x); return Math.min(HERO_STEPS, i + sm(clamp((x - i) * 1.7))); }
  if (t < T.rew1) return HERO_STEPS * Math.pow(N1 / HERO_STEPS, seg(t, T.crowd, T.crowdEnd));
  return N1 * (1 - eio(seg(t, T.rew1, T.rew1End)));
}
const nLog = (t, a, b) => t < a ? 0 : Math.pow(NS, seg(t, a, b));
function n2(t) { if (t < T.rew2) return nLog(t, T.d2, T.d2End); return NS * (1 - eio(seg(t, T.rew2, T.rew2End))); }
const n3 = t => nLog(t, T.d3, T.d3End);
const filmOfStep = (d, s) => d === 1 ? T.crowd + (T.crowdEnd - T.crowd) * Math.log(s / HERO_STEPS) / Math.log(N1 / HERO_STEPS)
  : d === 2 ? T.d2 + (T.d2End - T.d2) * Math.log(s) / Math.log(NS) : T.d3 + (T.d3End - T.d3) * Math.log(s) / Math.log(NS);
const amberOf = (first, n) => n >= first ? clamp((Math.log(n) - Math.log(first)) / .12 + .35) : 0;

// ---------- 绘制工具 ----------
const FONT = o => `${o.w ?? 400} ${o.size ?? 32}px ${o.serif ? 'FilmSerif' : 'FilmSans'}`;
function text(s, x, y, o = {}) {
  if ((o.a ?? 1) <= .003) return;
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; ctx.font = FONT(o);
  ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = (o.ls ?? 0) + 'px';
  ctx.fillStyle = o.color ?? C.ink; ctx.fillText(s, x, y); ctx.restore();
}
const measure = (s, o) => { ctx.save(); ctx.font = FONT(o); ctx.letterSpacing = (o.ls ?? 0) + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; };
// 逐字浮现；parts 可含上标 {s, sup:true}
function reveal(parts, x, y, t0, t, o = {}) {
  if (typeof parts === 'string') parts = [{ s: parts }];
  const per = o.per ?? .03; let total = 0;
  for (const p of parts) total += measure(p.s, p.sup ? { ...o, size: (o.size ?? 32) * .6 } : o);
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x, i = 0;
  for (const p of parts) {
    const po = p.sup ? { ...o, size: (o.size ?? 32) * .6 } : o, dy = p.sup ? -(o.size ?? 32) * .42 : 0;
    for (const ch of [...p.s]) {
      const u = eout(seg(t, t0 + i * per, t0 + i * per + .5));
      if (u > 0) text(ch, cx, y + dy + (1 - u) * 16, { ...po, color: p.color ?? po.color, align: 'left', a: (o.a ?? 1) * u });
      cx += measure(ch, po); i++;
    }
  }
}
function glow(x, y, r, rgb, a) {
  if (a <= .002 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.22, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}
const grain = document.createElement('canvas'); grain.width = grain.height = 256;
{ const g = grain.getContext('2d'), im = g.createImageData(256, 256), r = mulberry32(7);
  for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }

// 家（原点）的光：强度跟随最近 0.15 秒内的回家次数
function homeLight(x, y, t, d, nNow, nPrev, base = 1) {
  const cnt = d === 0 ? 0 : (t < T.crowd && d === 1)
    ? heroRets.filter(s => s > nPrev && s <= nNow).length
    : countIn(retSorted[d], nPrev, nNow);
  const pulse = 1 - Math.exp(-cnt / (d === 1 && t >= T.crowd ? 10 : 1.5));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(x, y, 46 + 120 * pulse, C.homeRGB, base * (.35 + .65 * pulse));
  glow(x, y, 9, C.homeRGB, base);
  ctx.restore();
  return pulse;
}

// ---------- 一维：时空长河（横向=位置，纵向=时间） ----------
function oneD(t) {
  if (t < 1.4 || t > T.d2 + .2) return;
  const k = WK[1], n = n1(t), nf = Math.floor(n), fr = n - nf;
  const a = sm(seg(t, 1.4, 2.4)) * (1 - sm(seg(t, T.rew1End - .3, T.d2)));
  const rw = seg(t, T.rew1, T.rew1End), Y0 = lerp(210, 540, eio(rw));
  const hx = 960, sc = 230 / Math.sqrt(Math.max(n, HERO_STEPS)), span = Math.max(n, HERO_STEPS);
  const yOf = s => Y0 + 680 * s / span * (1 - eio(rw) * 0);
  // 原点竖线（家的“经线”）
  ctx.strokeStyle = `rgba(${C.homeRGB},${.22 * a})`; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
  ctx.beginPath(); ctx.moveTo(hx, Y0); ctx.lineTo(hx, Y0 + 680 * (n > 0 ? 1 : 0) * (1 - eio(rw))); ctx.stroke(); ctx.setLineDash([]);
  // 位置轴
  ctx.strokeStyle = `rgba(${C.awayRGB},${.25 * a})`; ctx.beginPath(); ctx.moveTo(140, Y0); ctx.lineTo(1780, Y0); ctx.stroke();
  const crowdA = sm(seg(t, T.crowd, T.crowd + .7));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < W1; i++) {
    const w = order1[i], wa = (i === 0 ? 1 : crowdA) * a; if (wa <= .01) continue;
    const am = amberOf(k.first[w], n), rgb = mix(C.awayRGB, C.homeRGB, am);
    ctx.strokeStyle = `rgba(${rgb},${(i === 0 && t < T.crowd ? .9 : .16 + .1 * am) * wa})`; ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(hx, yOf(0));
    for (let s = 1; s <= nf; s++) ctx.lineTo(hx + pos(k, w, s, 0) * sc, yOf(s));
    let hxp = hx + pos(k, w, nf, 0) * sc;
    if (nf < k.ns && fr > 0) { hxp = lerp(hxp, hx + pos(k, w, nf + 1, 0) * sc, fr); ctx.lineTo(hxp, yOf(n)); }
    ctx.stroke();
    if (i === 0 && t < T.crowd + 1) {
      glow(hxp, yOf(n), 30, rgb, wa * (t < T.crowd ? 1 : 1 - seg(t, T.crowd, T.crowd + 1)));
      ctx.fillStyle = `rgba(${rgb},${wa})`; ctx.beginPath(); ctx.arc(hxp, yOf(n), 5, 0, 7); ctx.fill();
    } else if (n > 0) { ctx.fillStyle = `rgba(${rgb},${.8 * wa})`; ctx.fillRect(hxp - 1.2, yOf(n) - 1.2, 2.4, 2.4); }
  }
  ctx.restore();
  // 刻度：±σ
  if (t > T.crowd + .5 && t < T.rew1 + .3) {
    const sa = a * win(t, T.crowd + .5, T.crowd + 1.2, T.rew1, T.rew1 + .3) * .8;
    for (const sg of [-2, -1, 1, 2]) {
      const x = hx + sg * Math.sqrt(n) * sc;
      ctx.strokeStyle = `rgba(${C.awayRGB},${.18 * sa})`; ctx.beginPath(); ctx.moveTo(x, Y0 - 8); ctx.lineTo(x, Y0 + 8); ctx.stroke();
      text(`${sg > 0 ? '+' : '−'}${Math.abs(sg)}√n`, x, Y0 - 16, { size: 17, color: C.dim, align: 'center', a: sa });
    }
  }
  homeLight(hx, Y0, t, 1, n, n1(t - .15), a);
  if (t < T.crowd + .6) text('家', hx + 20, Y0 - 16, { size: 22, color: C.home, a: a * (1 - seg(t, T.crowd, T.crowd + .6)) });
  // 时间箭头
  text('时间 ↓', 140, Y0 + 40, { size: 18, color: C.faint, a: a * (1 - eio(rw)) });
}

// ---------- 二维、三维：透视投影 ----------
const yawAt = t => .035 * t + .2 * Math.max(0, (t - T.tilt) - (1 - Math.exp(-Math.max(0, t - T.tilt))));
const tiltAt = t => lerp(0, 1.02, eio(seg(t, T.tilt, T.tiltEnd))) - .08 * sm(seg(t, T.coda, DUR)) + .06 * Math.sin(Math.max(0, t - T.tiltEnd) * .35) * sm(seg(t, T.tiltEnd, T.tiltEnd + 2));
function camera(t, n, R) {
  const yaw = yawAt(t), th = tiltAt(t), k = R / Math.sqrt(Math.max(n, 8));
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(th), st = Math.sin(th);
  return (x, y, z) => {
    const x1 = x * cy - y * sy, y1 = x * sy + y * cy;
    const yv = y1 * ct - z * st, dz = y1 * st + z * ct;
    const s = 1900 / (1900 + dz * k);
    return [960 + x1 * k * s, 560 + yv * k * s, s, dz * k];
  };
}
function cloud(t, d, n, R, alpha) {
  if (alpha <= .005) return;
  const k = WK[d], nf = Math.floor(n), fr = n - nf, prj = camera(t, n, R);
  const TAIL = 256, STRIDE = 16, dens = Math.min(1, 200 / k.nw);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
  for (let w = 0; w < k.nw; w++) {
    const am = amberOf(k.first[w], n), rgb = mix(d === 3 ? mix(C.awayRGB, C.violetRGB, .45) : C.awayRGB, C.homeRGB, am);
    const P = s => prj(pos(k, w, s, 0), pos(k, w, s, 1), d === 3 ? pos(k, w, s, 2) : 0);
    const cut = Math.max(0, nf - TAIL);
    // 旧轨迹：固定步长抽稀
    ctx.strokeStyle = `rgba(${rgb},${(.045 + .04 * am) * alpha * dens})`; ctx.lineWidth = 1;
    ctx.beginPath(); let p = P(0); ctx.moveTo(p[0], p[1]);
    for (let s = STRIDE; s < cut; s += STRIDE) { p = P(s); ctx.lineTo(p[0], p[1]); }
    p = P(cut); ctx.lineTo(p[0], p[1]); ctx.stroke();
    // 新轨迹：逐步
    ctx.strokeStyle = `rgba(${rgb},${(.2 + .1 * am) * alpha * dens})`; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (let s = cut + 1; s <= nf; s++) { p = P(s); ctx.lineTo(p[0], p[1]); }
    let hx = p[0], hy = p[1], hs = p[2];
    if (nf < k.ns && fr > 0) { const q = P(nf + 1); hx = lerp(hx, q[0], fr); hy = lerp(hy, q[1], fr); ctx.lineTo(hx, hy); }
    ctx.stroke();
    if (n > 0) { const fog = clamp(hs * 1.1 - .1); ctx.fillStyle = `rgba(${rgb},${alpha * (.55 + .45 * fog)})`; ctx.beginPath(); ctx.arc(hx, hy, 1.6 + 1.4 * hs * (.6 + am), 0, 7); ctx.fill(); }
  }
  ctx.restore();
  return prj;
}
// 坐标轴与距离圈（二维：同心圆；三维：三个大圆组成的球壳）
function frame(t, n, R, a, dims) {
  if (a <= .005) return;
  const prj = camera(t, n, R), L = 2.6 * Math.sqrt(Math.max(n, 8));
  const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const grow = [1, sm(seg(t, T.axis2, T.axis2 + .9)), sm(seg(t, T.tilt + .3, T.tiltEnd))];
  ctx.lineWidth = 1;
  axes.forEach((v, i) => {
    if (i >= dims || grow[i] <= 0) return;
    const A = prj(-v[0] * L * grow[i], -v[1] * L * grow[i], -v[2] * L * grow[i]), B = prj(v[0] * L * grow[i], v[1] * L * grow[i], v[2] * L * grow[i]);
    ctx.strokeStyle = `rgba(${C.awayRGB},${.2 * a})`; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  });
  const rings = dims === 3 ? [[0, 1], [0, 2], [1, 2]] : [[0, 1]];
  const rad = 2 * Math.sqrt(Math.max(n, 8) / dims);
  rings.forEach(([i, j], ri) => {
    const ga = ri === 0 ? 1 : grow[2]; if (ga <= 0) return;
    for (const rr of dims === 3 ? [rad] : [rad * .5, rad, rad * 1.5]) {
      ctx.beginPath();
      for (let q = 0; q <= 96; q++) {
        const ang = q / 96 * Math.PI * 2, v = [0, 0, 0]; v[i] = Math.cos(ang) * rr; v[j] = Math.sin(ang) * rr;
        const p = prj(v[0], v[1], v[2]); q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      }
      ctx.strokeStyle = `rgba(${C.awayRGB},${.09 * a * ga})`; ctx.stroke();
    }
  });
}

// ---------- 右上角：回家比例 ----------
function hud(t) {
  const a = win(t, T.crowd + .3, T.crowd + 1, T.why - .3, T.why + .3) + sm(seg(t, T.coda + 1.4, T.coda + 2.4)) * (t > T.why ? 1 : 0);
  if (a <= .005) return;
  const rows = [
    { d: 1, lab: '一维', on: T.crowd + .3, n: Math.min(n1(Math.min(t, T.rew1 - .01)), N1) },
    { d: 2, lab: '二维', on: T.d2 + .3, n: n2(Math.min(t, T.rew2 - .01)) },
    { d: 3, lab: '三维', on: T.d3 + .3, n: n3(t) },
  ];
  text('至少回过一次家', 1820, 92, { size: 18, color: C.dim, align: 'right', a, ls: 2 });
  rows.forEach((r, i) => {
    const ra = a * sm(seg(t, r.on, r.on + .6)); if (ra <= 0) return;
    const y = 160 + i * 78, sim = returnedBy(r.d, r.n), th = theoryF(r.d, r.n), live = t < [T.rew1, T.rew2, T.why][i];
    text(r.lab, 1500, y, { size: 22, color: C.dim, a: ra });
    text(`${(sim * 100).toFixed(1)}%`, 1730, y + 4, { size: 44, w: 600, color: r.d === 3 && t > T.d3End - 2 ? C.away : C.home, align: 'right', a: ra });
    text(`理论 ${(th * 100).toFixed(1)}%`, 1820, y - 8, { size: 15, color: C.dim, align: 'right', a: ra });
    text(`${Math.floor(r.n).toLocaleString('en')} 步`, 1820, y + 12, { size: 15, color: live ? C.ink : C.faint, align: 'right', a: ra * .8 });
  });
}

// ---------- 第四幕：为什么 ----------
const LANE_Y = [380, 560, 740], LANE_X = 300, BARS = 48, BAR_DX = 17, LANE_H = 300;
const COL_X = [1250, 1420, 1590], COL_BASE = 905, COL_SC = 150, COL_TOP = 150;
const Kof = t => Math.pow(TH.u[1].length - 1, seg(t, T.stack, T.stackEnd));     // 已累加的项数（偶数步 2m 的 m）
function why(t) {
  if (t < T.why - .1 || t > T.coda + 1.5) return;
  const out = 1 - sm(seg(t, T.coda, T.coda + 1.2));
  const laneA = sm(seg(t, T.lanes - .3, T.lanes + .4)) * (1 - sm(seg(t, T.formula - .4, T.formula + .3)));
  const colA = sm(seg(t, T.stack - .4, T.stack + .2)) * out;
  const K = t >= T.stack ? Kof(t) : 0;
  const labels = [['一维', '∝ n', '−1/2'], ['二维', '∝ n', '−1'], ['三维', '∝ n', '−3/2']];
  reveal('第 n 步恰好在家的概率', LANE_X - 200, 270, T.lanes, t, { size: 24, color: C.dim, a: laneA, per: .02 });
  for (let d = 1; d <= 3; d++) {
    const y0 = LANE_Y[d - 1], u = TH.u[d];
    if (laneA > 0) {
      text(labels[d - 1][0], LANE_X - 200, y0, { size: 26, w: 600, a: laneA });
      reveal([{ s: labels[d - 1][1] }, { s: labels[d - 1][2], sup: true }], LANE_X - 200, y0 + 30, T.lanes + .4 * d, t, { size: 20, color: C.dim, a: laneA });
      ctx.strokeStyle = `rgba(${C.awayRGB},${.2 * laneA})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(LANE_X - 10, y0 + .5); ctx.lineTo(LANE_X + BARS * BAR_DX, y0 + .5); ctx.stroke();
    }
    // 柱：先在泳道依次长出，再一根根飞进右侧的“累加柱”
    for (let m = 1; m <= BARS; m++) {
      const h = u[m] * LANE_H, x = LANE_X + (m - 1) * BAR_DX;
      const born = T.lanes + .25 * d + m * .035, grow = eout(seg(t, born, born + .35));
      if (grow <= 0) continue;
      const leave = t >= T.stack ? T.stack + (T.stackEnd - T.stack) * Math.log(m) / Math.log(TH.u[1].length - 1) : Infinity;
      const fu = eio(seg(t, leave, leave + .45));
      if (fu <= 0) {
        ctx.fillStyle = `rgba(${d === 3 ? C.violetRGB : C.awayRGB},${.75 * laneA})`; ctx.fillRect(x, y0 - h * grow, BAR_DX - 5, h * grow);
      } else {
        ctx.strokeStyle = `rgba(${C.awayRGB},${.25 * laneA})`; ctx.strokeRect(x + .5, y0 - h + .5, BAR_DX - 6, h - 1);
        if (fu < 1) {
          const Sprev = TH.S[d][m - 1], ty = COL_BASE - Math.min(Sprev * COL_SC, COL_BASE - COL_TOP);
          const bx = lerp(x, COL_X[d - 1] - 40, fu), by = lerp(y0, ty, fu) - Math.sin(Math.PI * fu) * 80;
          const bw = lerp(BAR_DX - 5, 80, fu), bh = lerp(h, u[m] * COL_SC, fu);
          ctx.fillStyle = `rgba(${C.homeRGB},${.85 * colA})`; ctx.fillRect(bx, by - bh, bw, bh);
        }
      }
    }
    // 累加柱
    if (colA > 0) {
      const mLanded = K <= 0 ? 0 : Math.max(0, Math.floor(Math.pow(TH.u[1].length - 1, seg(t - .45, T.stack, T.stackEnd))));
      const S = TH.S[d][Math.min(mLanded, TH.S[d].length - 1)], hpx = S * COL_SC, over = hpx > COL_BASE - COL_TOP;
      const cx = COL_X[d - 1], top = COL_BASE - Math.min(hpx, COL_BASE - COL_TOP);
      const g = ctx.createLinearGradient(0, top, 0, COL_BASE);
      g.addColorStop(0, `rgba(${C.homeRGB},${.9 * colA})`); g.addColorStop(1, `rgba(${C.homeRGB},${.25 * colA})`);
      ctx.fillStyle = g; ctx.fillRect(cx - 40, top, 80, COL_BASE - top);
      // 出发时那一次（底部第一格）
      ctx.strokeStyle = `rgba(20,16,20,${.6 * colA})`; ctx.beginPath(); ctx.moveTo(cx - 40, COL_BASE - COL_SC); ctx.lineTo(cx + 40, COL_BASE - COL_SC); ctx.stroke();
      if (over) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(cx, COL_TOP, 90, C.homeRGB, .6 * colA); ctx.restore(); }
      text(labels[d - 1][0], cx, COL_BASE + 40, { size: 24, w: 600, align: 'center', a: colA });
      const val = d === 1 && over ? `${S.toFixed(0)} → ∞` : d === 2 ? `${S.toFixed(2)} → ∞` : `${S.toFixed(3)}`;
      text(val, cx, top - 18, { size: 26, w: 600, color: C.home, align: 'center', a: colA * sm(seg(t, T.stack + .3, T.stack + .8)) });
      if (d === 3) text(`极限 ${TH.M3.toFixed(3)}`, cx, top - 50, { size: 18, color: C.dim, align: 'center', a: colA * sm(seg(t, T.stackEnd - .6, T.stackEnd)) });
    }
  }
  // 3D 极限虚线
  const la = colA * sm(seg(t, T.stackEnd - .6, T.stackEnd));
  if (la > 0) { const y = COL_BASE - TH.M3 * COL_SC; ctx.setLineDash([4, 6]); ctx.strokeStyle = `rgba(${C.homeRGB},${.6 * la})`; ctx.beginPath(); ctx.moveTo(COL_X[2] - 60, y); ctx.lineTo(COL_X[2] + 60, y); ctx.stroke(); ctx.setLineDash([]); }
  if (colA > 0) text('期望在家次数（含出发那一次）', (COL_X[0] + COL_X[2]) / 2, COL_BASE + 82, { size: 18, color: C.dim, align: 'center', a: colA });
  // 推理
  const fa = out, fx = 110;
  reveal('每回一次家，都是一次全新的出发。', fx, 400, T.formula + .1, t, { serif: true, size: 38, w: 600, a: fa, per: .04 });
  reveal([{ s: '期望在家次数  m = 1 + p + p' }, { s: '2', sup: true }, { s: ' + p' }, { s: '3', sup: true }, { s: ' + … = 1 / (1 − p)' }], fx, 480, T.formula + .9, t, { size: 32, a: fa, per: .025 });
  reveal([{ s: 'm = ∞     →   p = 1', color: C.home }, { s: '        一维、二维：必然回家', color: C.dim }], fx, 572, T.formula + 1.9, t, { size: 30, a: fa, per: .025 });
  reveal([{ s: 'm ≈ 1.516  →   p ≈ 0.340', color: C.away }, { s: '     三维：约 66% 永不回来', color: C.dim }], fx, 634, T.formula + 2.6, t, { size: 30, a: fa, per: .025 });
}

// ---------- 文字 ----------
function words(t) {
  const X = 110, Y = 1000;
  // 片头
  const ta = 1 - sm(seg(t, 2.0, 2.6));
  reveal('回家的概率', 960, 440, .25, t, { serif: true, size: 96, w: 700, align: 'center', a: ta, per: .09, ls: 6 });
  reveal('每一步，随机选一个方向。它还回得来吗？', 960, 640, .9, t, { size: 28, color: C.dim, align: 'center', a: ta, per: .025 });
  const cap = (s, a0, a1, o = {}) => reveal(s, X, Y, a0, t, { size: 30, a: 1 - sm(seg(t, a1 - .3, a1)), per: .022, ...o });
  cap('一维：每一步向左或向右，各一半。', 2.6, 5.2);
  cap('160 个行者同时出发。经过一次原点，就染成暖色。', 5.2, 7.7);
  cap('一维：几乎全部回过家。', 7.7, 10.5, { color: C.home });
  cap('再给一个方向：上、下、左、右，各四分之一。', 10.8, 13.4);
  cap('二维：240 个行者，每人走 16,384 步。', 13.4, 15.9);
  cap('回家越来越慢，但终会回来——概率为 1。', 15.9, 18.1);
  cap([{ s: '要让 99% 的人回过家，大约需要 10' }, { s: '135', sup: true }, { s: ' 步。' }], 18.1, 21.2);
  text('量级估计：二维未回家概率 ≈ 1 / Σ P(在家)', X, Y + 34, { size: 16, color: C.faint, a: win(t, 18.4, 18.9, 20.9, 21.2) });
  cap('再加一个方向：前后、左右、上下，各六分之一。', 21.4, 24.0);
  cap('三维：回过家的人，停在三分之一左右。', 24.0, 27.4);
  cap('其余的，越走越远——按理论，约 66% 永远不再回来。', 27.4, 30.6, { color: C.away });
  cap('同样的规则，只多了一个方向。', 30.6, 32.4);
  reveal('为什么第三个方向改变了结局？', X, 150, T.why, t, { serif: true, size: 50, w: 700, a: 1 - sm(seg(t, T.coda - .2, T.coda + .5)), per: .05 });
  // 片尾
  const qa = sm(seg(t, T.coda + .3, T.coda + 1));
  reveal('“喝醉的人总能找到回家的路，', X, 860, T.coda + .5, t, { serif: true, size: 44, w: 600, a: qa, per: .05 });
  reveal('喝醉的鸟却可能永远迷失。”', X, 924, T.coda + 1.8, t, { serif: true, size: 44, w: 600, a: qa, per: .05 });
  reveal('—— 角谷静夫（Shizuo Kakutani）谈 Pólya 回返定理', X, 978, T.coda + 3.0, t, { size: 20, color: C.dim, a: qa, per: .015 });
  text('画面：固定种子模拟（一维 160 人 × 1,024 步；二维 240 人、三维 400 人，各 16,384 步），百分比旁为同步数下的精确理论值；三维回家概率 0.3405 为已知常数。', X, 1046, { size: 15, color: C.faint, a: sm(seg(t, T.coda + 2.5, T.coda + 3.2)) });
}

// ---------- 合成 ----------
function background(t) {
  const g = ctx.createRadialGradient(960, 560, 100, 960, 560, 1200);
  g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg0); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function finish(t) {
  const f = Math.floor(t * 30); ctx.save(); ctx.globalAlpha = .04; ctx.globalCompositeOperation = 'overlay';
  ctx.translate(-((f * 97) % 256), -((f * 57) % 256)); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
}
export function render(t) {
  t = clamp(t, 0, DUR - 1e-6);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  background(t);
  // 片头：家在画面中央出现，随后上移成为一维长河的源头
  if (t < 2.6) {
    const a = sm(seg(t, .1, .8)), y = lerp(540, 210, eio(seg(t, 1.6, 2.4)));
    homeLight(960, y, t, 0, 0, 0, a * (1 - sm(seg(t, 2.3, 2.6))));
  }
  oneD(t);
  // 二维
  const a2 = sm(seg(t, T.axis2, T.axis2 + .6)) * (1 - sm(seg(t, T.tiltEnd - .2, T.tiltEnd + .4)));
  if (a2 > 0) {
    const n = n2(t); frame(t, n, 230, a2, t < T.tilt ? 2 : 3); cloud(t, 2, n, 230, a2);
    const p = camera(t, n, 230)(0, 0, 0); homeLight(p[0], p[1], t, 2, n, n2(t - .15), a2);
  }
  // 三维
  const dimWhy = lerp(1, .1, sm(seg(t, T.why, T.why + 1))) + lerp(0, .9, sm(seg(t, T.coda, T.coda + 1.6)));
  const a3 = sm(seg(t, T.tilt + .6, T.tiltEnd)) * dimWhy;
  if (a3 > 0) {
    const n = Math.max(n3(t), t < T.d3 ? 0 : 0); frame(t, Math.max(n, 1), 260, a3, 3);
    if (t >= T.d3) cloud(t, 3, n, 260, a3);
    const p = camera(t, Math.max(n, 1), 260)(0, 0, 0); homeLight(p[0], p[1], t, 3, n, n3(t - .15), a3);
  }
  why(t); hud(t); words(t);
  const fin = sm(seg(t, DUR - .6, DUR)); if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin * .6})`; ctx.fillRect(0, 0, W, H); }
  finish(t);
}

// ---------- 声音提示点（供 music.py 读取，音画同源） ----------
function events() {
  const ev = [];
  for (let s = 1; s <= HERO_STEPS; s++) ev.push({ t: T.single + s * T.stepDt, type: 'step', x: pos(WK[1], heroOrig, s, 0), home: pos(WK[1], heroOrig, s, 0) === 0 });
  for (const d of [1, 2, 3]) {
    const k = WK[d], visits = new Map();
    for (const [s, w] of k.rets) {
      const v = (visits.get(w) ?? 0) + 1; visits.set(w, v);
      const hero = d === 1 && w === heroOrig;
      let t; if (d === 1 && s <= HERO_STEPS) { if (!hero) continue; t = T.single + s * T.stepDt; } else t = filmOfStep(d, s);
      ev.push({ t, type: 'ret', d, w, s, visit: v, first: v === 1, hero });
    }
  }
  ev.push({ t: T.rew1, type: 'rewind', d: 1, dur: T.rew1End - T.rew1 }, { t: T.rew2, type: 'rewind', d: 2, dur: T.rew2End - T.rew2 });
  ev.push({ t: T.axis2, type: 'unfold', d: 2 }, { t: T.tilt, type: 'unfold', d: 3, dur: T.tiltEnd - T.tilt });
  for (let d = 1; d <= 3; d++) for (let m = 1; m <= BARS; m++) ev.push({ t: T.lanes + .25 * d + m * .035, type: 'lane', d, m, u: TH.u[d][m] });
  const curve = { 1: [], 2: [], 3: [] };
  for (let i = 0; i <= 120; i++) { const tt = T.stack + (T.stackEnd + .6 - T.stack) * i / 120, m = Math.max(0, Math.floor(Math.pow(TH.u[1].length - 1, seg(tt - .45, T.stack, T.stackEnd)))); for (const d of [1, 2, 3]) curve[d].push([tt, TH.S[d][Math.min(m, TH.S[d].length - 1)]]); }
  ev.push({ t: T.stack, type: 'stack', curve, M3: TH.M3 });
  [0, .9, 1.9, 2.6].forEach((dt, i) => ev.push({ t: T.formula + dt + .1, type: 'formula', i }));
  ev.push({ t: .25, type: 'title' }, { t: T.why, type: 'why' }, { t: T.coda, type: 'coda' });
  for (const [t, d] of [[T.crowd, 1], [T.d2, 2], [T.d3, 3]]) ev.push({ t, type: 'start', d });
  return { bpm: 100, bar: 2.4, duration: DUR, events: ev.sort((a, b) => a.t - b.t) };
}

// ---------- 页面接口 ----------
let fontsOK = [false, false];
const fontsReady = (async () => {
  try {
    await Promise.all([document.fonts.load('700 40px FilmSerif', '回家的概率喝醉鸟'), document.fonts.load('400 40px FilmSans', '一维二维三维∞→≈−…√')]);
    fontsOK = [document.fonts.check('700 40px FilmSerif', '回'), document.fonts.check('400 40px FilmSans', '维')];
  } catch {}
  await document.fonts.ready;
})();
let ready = false;
window.__ready = () => ready;
window.__duration = DUR;
window.__frame = t => { render(t); return cv.toDataURL('image/jpeg', .93); };
window.__events = events;
window.__diagnostics = () => ({
  fonts: fontsOK, heroWalker: heroOrig, heroReturnsIn16: heroRets.filter(s => s <= HERO_STEPS).length,
  returned: { 1: returnedBy(1, N1), 2: returnedBy(2, NS), 3: returnedBy(3, NS) },
  theory: { 1: theoryF(1, N1), 2: theoryF(2, NS), 3: theoryF(3, NS) },
  walkers: { 1: W1, 2: W2, 3: W3 }, returnsTotal: { 1: WK[1].rets.length, 2: WK[2].rets.length, 3: WK[3].rets.length },
  S3: TH.S[3][TH.S[3].length - 1], M3: TH.M3, P3: TH.P3,
});

// ---------- 预览控制 ----------
const seek = document.getElementById('seek'), toggle = document.getElementById('toggle'), clock = document.getElementById('clock'), audio = document.getElementById('audio');
let playing = false, startWall = 0, startT = 0;
const now = () => playing ? (audio && audio.readyState >= 2 && !audio.paused ? audio.currentTime : startT + (performance.now() - startWall) / 1000) : +seek.value;
function setT(t) { seek.value = clamp(t, 0, DUR).toFixed(2); clock.textContent = `${(+seek.value).toFixed(2)} / ${DUR.toFixed(2)} s`; if (ready) render(+seek.value); }
function play() { if (+seek.value >= DUR - .05) setT(0); playing = true; startT = +seek.value; startWall = performance.now(); toggle.textContent = '暂停'; if (audio) { audio.currentTime = startT; audio.play().catch(() => {}); } loop(); }
function pause() { const t = now(); playing = false; toggle.textContent = '播放'; audio?.pause(); setT(t); }
function loop() { if (!playing) return; const t = now(); if (t >= DUR) { pause(); setT(DUR); return; } seek.value = t.toFixed(2); clock.textContent = `${t.toFixed(2)} / ${DUR.toFixed(2)} s`; if (ready) render(t); requestAnimationFrame(loop); }
toggle.onclick = () => playing ? pause() : play();
seek.oninput = () => { if (playing) { startT = +seek.value; startWall = performance.now(); if (audio) audio.currentTime = startT; } setT(+seek.value); };
addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { const t = now() + (e.code === 'ArrowRight' ? 1 : -1); if (playing) { startT = clamp(t, 0, DUR); startWall = performance.now(); if (audio) audio.currentTime = startT; } setT(t); }
});
if (new URLSearchParams(location.search).has('export')) document.getElementById('controls').style.display = 'none';
fontsReady.then(() => { ready = true; render(+seek.value); });

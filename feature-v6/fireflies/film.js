// v6 第三方向《你撞见的黑暗》：检查悖论（长度偏倚抽样）。
// 萤火平均每 1 秒亮一次；随手一瞥落进的那段黑暗，平均却约 2 秒。
// 画面只由 t 与 data.js（model.py 以固定种子生成）决定；预览、跳转、导出都调用 render(t)。
import D from './data.js';

const W = 1920, H = 1080, DUR = 24;
const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
const C = {
  bg0: '#05060c', bg1: '#0a0c18', ink: '#ece8dc', dim: '#8a8ea3', faint: '#3a4060',
  fly: '#e4f26a', flyRGB: '228,242,106', eye: '#8be4ff', eyeRGB: '139,228,255', gapRGB: '126,138,190',
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eout = x => 1 - Math.pow(1 - clamp(x), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const win = (t, a, b, c, d) => sm(seg(t, a, b)) * (1 - sm(seg(t, c, d)));

// ---------- 固定数据 ----------
const { G, M, gaps, flashes: F, glances, hitGap, hits, order, rows, rowOf, sortedPos, demoGap, demoT } = D;
const TOTAL = D.total;

// ---------- 时间轴（100 BPM，一小节 2.4 秒，共 10 小节） ----------
const BAR = 2.4;
const T = {
  ffA: 7.5, ffB: 8.7,           // 快进：萤火时间从 act1End 冲到终点
  foldA: 8.7,                    // 长卷折成四行
  rainA: 10.1, rainSpan: 3.3,    // 480 次抬头落下
  flyA: 14.4,                    // 每段黑暗立起成柱
  mean1: 16.0, wA: 17.0, wB: 18.6,
  endA: 19.2,
};
const TEND = TOTAL + .4;
const FF_POW = 2.6;
// 萤火时间 τ(t)
function tauAt(t) {
  if (t <= T.ffA) return t - D.act1Shift;
  const u = seg(t, T.ffA, T.ffB);
  return lerp(D.act1End, TEND, Math.pow(u, FF_POW));
}
// 第 i 次闪光在片中的时刻（tauAt 的反函数）
const flashFilm = F.map(f => f <= D.act1End ? f + D.act1Shift : T.ffA + (T.ffB - T.ffA) * Math.pow((f - D.act1End) / (TEND - D.act1End), 1 / FF_POW));
const demoFilm = demoT + D.act1Shift, demoClose = flashFilm[demoGap + 1];

// ---------- 几何 ----------
const U = 67, X0 = 122, ROW_Y = [330, 480, 630, 780];
const NOW_X = 1460, RIB_Y = 905;
const rowStart = rows.map(js => F[js[0]]);
const ribX = (f, tau) => NOW_X - (tau - f) * U;
const rowX = (f, r) => X0 + (f - rowStart[r]) * U;
const foldU = (t, r) => eio(seg(t, T.foldA + .16 * (3 - r), T.foldA + 1.15 + .16 * (3 - r)));
function pagePos(f, r, t) {                       // 长卷 → 行，带弧线
  const u = foldU(t, r);
  const xr = ribX(f, Math.min(tauAt(t), TEND));
  return [lerp(xr, rowX(f, r), u), lerp(RIB_Y, ROW_Y[r], u) - Math.sin(Math.PI * u) * 70];
}

// 抬头：释放、落地、入栈
const glanceInfo = glances.map((g, k) => {
  const rel = T.rainA + T.rainSpan * Math.pow(order[k] / M, .9);
  const j = hitGap[k], r = rowOf[j];
  return { g, j, r, rel, land: rel + .3, settle: rel + .58, n: 0 };
});
{ const cnt = Array(G).fill(0); [...glanceInfo].sort((a, b) => a.land - b.land).forEach(q => { q.n = cnt[q.j]++; }); }
const lands = glanceInfo.map(q => q.land).sort((a, b) => a - b);
const landedBy = t => { let lo = 0, hi = M; while (lo < hi) { const m = (lo + hi) >> 1; if (lands[m] <= t) lo = m + 1; else hi = m; } return lo; };
const STACK = 3.2;

// 柱状图
const CX0 = 130, CW = 1400, BY = 900, HS = 118, BW0 = CW / G;
const flyU = (t, j) => eio(seg(t, T.flyA + .6 * sortedPos[j] / G, T.flyA + 1.1 + .6 * sortedPos[j] / G));
const bySorted = Array.from({ length: G }, (_, j) => j).sort((a, b) => sortedPos[a] - sortedPos[b]);
function barLayout(v) {                          // v：0 = 一段算一次，1 = 一瞥算一次
  const w = Array(G), x = Array(G); let acc = CX0, sw = 0, swl = 0;
  for (const j of bySorted) { w[j] = lerp(BW0, CW * hits[j] / M, v); x[j] = acc + w[j] / 2; acc += w[j]; sw += w[j]; swl += w[j] * gaps[j]; }
  return { w, x, mean: swl / sw };
}
const layout0 = barLayout(0);

// ---------- 绘制工具 ----------
function text(s, x, y, o = {}) {
  if ((o.a ?? 1) <= .003) return;
  ctx.save();
  ctx.globalAlpha *= o.a ?? 1;
  ctx.font = `${o.w ?? 400} ${o.size ?? 32}px ${o.serif ? 'FilmSerif' : 'FilmSans'}`;
  ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = (o.ls ?? 0) + 'px';
  ctx.fillStyle = o.color ?? C.ink; ctx.fillText(s, x + (o.dx ?? 0), y);
  ctx.restore();
}
// 逐字显现：字从下方 14px 处浮起，带极短的字距收拢
function reveal(s, x, y, t0, t, o = {}) {
  const chars = [...s], per = o.per ?? .035; let cx = x;
  ctx.save(); ctx.font = `${o.w ?? 400} ${o.size ?? 32}px ${o.serif ? 'FilmSerif' : 'FilmSans'}`; ctx.letterSpacing = (o.ls ?? 0) + 'px';
  const total = ctx.measureText(s).width; ctx.restore();
  if (o.align === 'right') cx = x - total; else if (o.align === 'center') cx = x - total / 2;
  chars.forEach((ch, i) => {
    const u = eout(seg(t, t0 + i * per, t0 + i * per + .45));
    ctx.save(); ctx.font = `${o.w ?? 400} ${o.size ?? 32}px ${o.serif ? 'FilmSerif' : 'FilmSans'}`; ctx.letterSpacing = (o.ls ?? 0) + 'px';
    const cw = ctx.measureText(ch).width; ctx.restore();
    if (u > 0) text(ch, cx, y + (1 - u) * 14, { ...o, align: 'left', a: (o.a ?? 1) * u });
    cx += cw;
  });
}
function glow(x, y, r, rgb, a) {
  if (a <= .002) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.25, `rgba(${rgb},${a * .35})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}
const dot = (x, y, r, col, a = 1) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; };

// 固定颗粒（种子 PRNG，与帧号挂钩，确定性）
const grain = document.createElement('canvas'); grain.width = grain.height = 256;
{ const g = grain.getContext('2d'), im = g.createImageData(256, 256); let s = 1234567;
  for (let i = 0; i < im.data.length; i += 4) { s = (s * 1103515245 + 12345) >>> 0; const v = s >>> 24; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); }

function background(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.bg0); g.addColorStop(1, C.bg1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function finish(t) {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const f = Math.floor(t * 30); ctx.save(); ctx.globalAlpha = .035; ctx.globalCompositeOperation = 'overlay';
  ctx.translate(-((f * 97) % 256), -((f * 57) % 256));
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
}

// ---------- 第一幕：萤火场 ----------
function fireflies(t) {
  const fieldA = 1 - sm(seg(t, 8.5, 9.6));
  if (fieldA <= 0) return;
  const tau = tauAt(t);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i <= G; i++) {
    const ft = flashFilm[i]; if (t < ft) break;
    const dt = t - ft, fast = ft > T.ffA;
    const x = D.fireflyX[i] + 16 * Math.sin(.37 * t + i * 2.1), y = D.fireflyY[i] + 11 * Math.cos(.31 * t + i * 1.3);
    const flash = Math.min(1, dt / .05) * Math.exp(-dt / (fast ? .35 : .6));
    const ember = .22 * Math.exp(-dt / (fast ? 1.2 : 3.2));
    const a = fieldA * (fast ? .75 : 1);
    glow(x, y, fast ? 60 : 92, C.flyRGB, a * flash * .85);
    glow(x, y, 16, C.flyRGB, a * (flash + ember));
    // 闪光与长卷刻度之间的一根光丝：每次闪光都被记录
    const th = Math.exp(-dt / .45) * (t < T.foldA ? 1 : 0) * a;
    if (th > .01) {
      const rx = ribX(F[i], tau);
      ctx.strokeStyle = `rgba(${C.flyRGB},${th * .28})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x, lerp(y, RIB_Y, .6), rx, lerp(y, RIB_Y, .4), rx, RIB_Y); ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- 长卷 / 页面上的黑暗段 ----------
function timeline(t) {
  const tau = Math.min(tauAt(t), TEND), folding = t >= T.foldA;
  const pageA = 1 - sm(seg(t, T.flyA - .1, T.flyA + .5));
  const ribA = sm(seg(t, .2, 1.2));
  if (!folding) {
    // 长卷基线：过去实线，未来极淡
    ctx.globalAlpha = ribA;
    ctx.strokeStyle = `rgba(${C.gapRGB},.28)`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, RIB_Y); ctx.lineTo(NOW_X, RIB_Y); ctx.stroke();
    ctx.setLineDash([2, 9]); ctx.strokeStyle = `rgba(${C.gapRGB},.18)`; ctx.beginPath(); ctx.moveTo(NOW_X, RIB_Y); ctx.lineTo(W, RIB_Y); ctx.stroke(); ctx.setLineDash([]);
    // “此刻”游标
    const curA = ribA * (1 - sm(seg(t, T.ffB - .4, T.ffB)));
    ctx.globalAlpha = curA; ctx.fillStyle = C.ink; ctx.fillRect(NOW_X - .75, RIB_Y - 16, 1.5, 32);
    ctx.globalAlpha = 1;
    text('此刻', NOW_X, RIB_Y + 46, { size: 20, color: C.dim, align: 'center', a: curA * .9, ls: 4 });
    text('萤火时间 →', NOW_X - 46, RIB_Y + 46, { size: 18, color: C.faint, align: 'right', a: curA * .9 });
  }
  if (pageA <= 0) return;
  // 黑暗段
  for (let j = 0; j < G; j++) {
    if (F[j + 1] > tau) break;
    const r = rowOf[j];
    if (folding && flyU(t, j) > 0) continue;                      // 已离开页面，交给柱状图绘制
    const [ax, ay] = folding ? pagePos(F[j], r, t) : [ribX(F[j], tau), RIB_Y];
    const [bx, by] = folding ? pagePos(F[j + 1], r, t) : [ribX(F[j + 1], tau), RIB_Y];
    if (Math.max(ax, bx) < -20 || Math.min(ax, bx) > W + 20) continue;
    const got = glanceInfo.length && t > T.rainA ? hitsLanded(j, t) : 0;
    const heat = clamp(got / 12);
    ctx.strokeStyle = `rgba(${lerp(126, 139, heat) | 0},${lerp(138, 228, heat) | 0},${lerp(190, 255, heat) | 0},${pageA * lerp(.5, .9, heat)})`;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }
  // 闪光点
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i <= G; i++) {
    if (F[i] > tau) break;
    const dt = t - flashFilm[i];
    for (const j of [i - 1, i]) {                                  // 行首行尾各画一次
      if (j < 0 || j >= G) continue;
      if (j === i && i > 0 && rowOf[i - 1] === rowOf[i] && !(i === 0)) continue;
      if (folding && flyU(t, j) > 0) continue;
      const r = rowOf[j];
      const [x, y] = folding ? pagePos(F[i], r, t) : [ribX(F[i], tau), RIB_Y];
      if (x < -30 || x > W + 30) continue;
      glow(x, y, 26, C.flyRGB, pageA * (.35 + 1.4 * Math.exp(-Math.max(0, dt) / .4)));
      dot(x, y, 3.2, C.fly, pageA);
    }
  }
  ctx.restore();
}
// 段 j 到时刻 t 为止已入栈的抬头数
const gapGlances = Array.from({ length: G }, () => []);
glanceInfo.forEach(q => gapGlances[q.j].push(q.settle)); gapGlances.forEach(a => a.sort((x, y) => x - y));
const hitsLanded = (j, t) => { const a = gapGlances[j]; let n = 0; while (n < a.length && a[n] <= t) n++; return n; };

// ---------- 第一幕示范：一瞥与它所在的黑暗 ----------
function demo(t) {
  const a = win(t, demoFilm - .5, demoFilm - .3, T.ffA + .1, T.ffA + .6);
  if (a <= 0) return;
  const tau = tauAt(t), xg = ribX(demoT, tau);
  const fall = seg(t, demoFilm - .34, demoFilm);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (fall < 1) {
    const y = lerp(RIB_Y - 420, RIB_Y, eio(fall) * 0 + fall * fall);
    const grd = ctx.createLinearGradient(0, y - 120, 0, y);
    grd.addColorStop(0, `rgba(${C.eyeRGB},0)`); grd.addColorStop(1, `rgba(${C.eyeRGB},${a})`);
    ctx.strokeStyle = grd; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(NOW_X, y - 120); ctx.lineTo(NOW_X, y); ctx.stroke();
  } else {
    const dt = t - demoFilm;
    ctx.strokeStyle = `rgba(${C.eyeRGB},${a})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xg, RIB_Y - 18); ctx.lineTo(xg, RIB_Y + 18); ctx.stroke();
    glow(xg, RIB_Y, 70, C.eyeRGB, a * .9 * Math.exp(-dt / .35));
    // 括号：左端回溯到上一次闪光，右端随“此刻”伸长，直到下一次闪光
    const L = ribX(F[demoGap], tau), R = Math.min(ribX(tau, tau), ribX(F[demoGap + 1], tau));
    const grow = eout(seg(t, demoFilm, demoFilm + .3)), lx = lerp(xg, L, grow);
    const by = RIB_Y - 40;
    ctx.strokeStyle = `rgba(${C.eyeRGB},${a * .85})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lx, by + 10); ctx.lineTo(lx, by); ctx.lineTo(R, by); if (t >= demoClose) ctx.lineTo(R, by + 10); ctx.stroke();
    ctx.fillStyle = `rgba(${C.eyeRGB},${a * .10})`; ctx.fillRect(lx, by, R - lx, RIB_Y - by);
    ctx.restore();
    if (t >= demoClose) {
      const u = eout(seg(t, demoClose, demoClose + .4));
      text(`这段黑暗 ${gaps[demoGap].toFixed(1)} 秒`, (L + R) / 2, by - 16 - (1 - u) * 8, { size: 24, color: C.eye, align: 'center', a: a * u, w: 500 });
    }
    return;
  }
  ctx.restore();
}

// ---------- 第二幕：480 次抬头 ----------
function rain(t) {
  if (t < T.rainA - .1 || t > T.flyA + .6) return;
  const fade = 1 - sm(seg(t, T.flyA - .1, T.flyA + .45));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const q of glanceInfo) {
    if (t < q.rel) continue;
    const r = q.r, y0 = ROW_Y[r], xg = rowX(q.g, r);
    if (t < q.land) {                                    // 下落
      const u = seg(t, q.rel, q.land), y = lerp(y0 - 170, y0, u * u);
      ctx.strokeStyle = `rgba(${C.eyeRGB},${.75 * sm(u * 4)})`; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(xg, y - 34); ctx.lineTo(xg, y); ctx.stroke();
      continue;
    }
    const sx = X0 + ((F[q.j] + F[q.j + 1]) / 2 - rowStart[r]) * U;
    const ty = y0 - 10 - q.n * STACK;
    const gw = clamp(gaps[q.j] * U * .7, 3, 14);
    const u = eio(seg(t, q.land, q.settle));
    const x = lerp(xg, sx, u), y = lerp(y0 - 3, ty, u) - Math.sin(Math.PI * u) * 12;
    if (t < q.land + .3) glow(xg, y0, 22, C.eyeRGB, .55 * (1 - seg(t, q.land, q.land + .3)));
    ctx.globalAlpha = fade * lerp(1, .82, u); ctx.fillStyle = C.eye;
    ctx.fillRect(x - lerp(1, gw / 2, u), y - 1, lerp(2, gw, u), 2);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------- 第三幕：黑暗立起成柱 ----------
function bars(t) {
  if (t < T.flyA) return;
  const v = eio(seg(t, T.wA, T.wB)), L = barLayout(v);
  const endDim = lerp(1, .42, sm(seg(t, T.endA, T.endA + 1)));
  const gridA = sm(seg(t, 15.4, 16.0)) * endDim;
  // 网格与刻度
  for (let k = 1; k <= 5; k++) {
    const y = BY - k * HS;
    ctx.strokeStyle = `rgba(${C.gapRGB},${.16 * gridA})`; ctx.lineWidth = 1; ctx.setLineDash([3, 7]);
    ctx.beginPath(); ctx.moveTo(CX0, y); ctx.lineTo(CX0 + CW, y); ctx.stroke(); ctx.setLineDash([]);
    text(`${k} 秒`, CX0 - 14, y + 7, { size: 20, color: C.dim, align: 'right', a: gridA });
  }
  ctx.strokeStyle = `rgba(${C.gapRGB},${.5 * gridA})`; ctx.beginPath(); ctx.moveTo(CX0, BY + .5); ctx.lineTo(CX0 + CW, BY + .5); ctx.stroke();
  // 柱
  const thick = sm(seg(t, 15.55, 16.2));
  for (let j = 0; j < G; j++) {
    const u = flyU(t, j); if (u <= 0) continue;
    const r = rowOf[j];
    const ax = rowX(F[j], r), bx = rowX(F[j + 1], r), y0 = ROW_Y[r];
    const mx = lerp((ax + bx) / 2, layout0.x[j], u), my = lerp(y0, BY - gaps[j] * HS / 2, u) - Math.sin(Math.PI * u) * 90;
    const th = lerp(0, -Math.PI / 2, u), half = lerp(gaps[j] * U, gaps[j] * HS, u) / 2;
    const c = Math.cos(th) * half, s = Math.sin(th) * half;
    if (u < 1 || thick <= 0) {
      ctx.strokeStyle = `rgba(${C.gapRGB},.85)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mx - c, my - s); ctx.lineTo(mx + c, my + s); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; dot(mx + c, my + s, 2.6, C.fly, .9); ctx.restore();
      continue;
    }
    const w = Math.max(0, lerp(2, Math.max(0, L.w[j] - (L.w[j] > 4 ? 1.5 : 0)), thick));
    if (w < .2) continue;
    const x = lerp(layout0.x[j], L.x[j], 1), top = BY - gaps[j] * HS;
    const hv = v * (hits[j] > 0 ? 1 : 0);
    const cr = lerp(126, 139, hv) | 0, cg = lerp(138, 228, hv) | 0, cb = lerp(190, 255, hv) | 0;
    ctx.globalAlpha = endDim;
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${lerp(.26, .34, hv)})`; ctx.fillRect(x - w / 2, top, w, BY - top);
    ctx.fillStyle = hv > .5 ? C.eye : C.fly; ctx.fillRect(x - w / 2, top, w, 2);
    ctx.globalAlpha = 1;
  }
  // 均值线
  const m1A = sm(seg(t, T.mean1, T.mean1 + .5));
  if (m1A > 0) {
    const y = BY - D.mean * HS, draw = eio(seg(t, T.mean1, T.mean1 + .7));
    const a = m1A * lerp(1, .55, sm(seg(t, T.wA, T.wA + .6)));
    ctx.strokeStyle = `rgba(${C.flyRGB},${a})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(CX0, y); ctx.lineTo(CX0 + CW * draw, y); ctx.stroke();
    text('一段算一次', CX0 + CW + 24, y - 34, { size: 20, color: C.dim, a: a * draw });
    text(`${D.mean.toFixed(2)}`, CX0 + CW + 24, y + 16, { size: 46, w: 600, color: C.fly, a: a * draw });
    text('秒', CX0 + CW + 132, y + 16, { size: 22, color: C.fly, a: a * draw });
  }
  const m2A = sm(seg(t, T.wA - .1, T.wA + .4));
  if (m2A > 0) {
    const y = BY - L.mean * HS;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(${C.eyeRGB},${m2A})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(CX0, y); ctx.lineTo(CX0 + CW, y); ctx.stroke();
    glow(CX0 + CW, y, 40, C.eyeRGB, m2A * .5);
    ctx.restore();
    text('一瞥算一次', CX0 + CW + 24, y - 34, { size: 20, color: C.dim, a: m2A });
    text(`${L.mean.toFixed(2)}`, CX0 + CW + 24, y + 16, { size: 46, w: 600, color: C.eye, a: m2A });
    text('秒', CX0 + CW + 132, y + 16, { size: 22, color: C.eye, a: m2A });
  }
}

// ---------- 文字层 ----------
function words(t) {
  const X = 122;
  // 第一幕
  reveal('萤火此起彼伏。', X, 770, .9, t, { serif: true, size: 50, w: 600, a: 1 - sm(seg(t, 4.0, 4.5)), per: .06 });
  reveal('这一片里，平均每 1 秒亮起一次。', X, 822, 1.7, t, { size: 26, color: C.dim, a: 1 - sm(seg(t, 4.0, 4.5)), per: .025 });
  const qa = 1 - sm(seg(t, T.ffA + .3, T.ffB));
  reveal('随手一瞥，你落进的那段黑暗，', X, 742, 4.9, t, { serif: true, size: 50, w: 600, a: qa, per: .045 });
  reveal('平均有多长？', X, 806, 5.75, t, { serif: true, size: 50, w: 600, a: qa, per: .07 });
  reveal('直觉会说：1 秒。', X + 330, 806, 6.6, t, { size: 26, color: C.dim, a: qa, per: .03 });
  // 第二、三幕：页眉问题
  const hA = win(t, 9.4, 10.0, T.endA - .2, T.endA + .3);
  text('随手一瞥，落进的那段黑暗平均有多长？', X, 92, { serif: true, size: 30, w: 600, a: hA });
  text(`固定种子模拟 · ${G} 段黑暗`, W - 122, 92, { size: 20, color: C.dim, align: 'right', a: hA });
  const n = landedBy(t), cA = win(t, T.rainA, T.rainA + .3, T.flyA, T.flyA + .4);
  text(`抬头 ${n}`, W - 182, 160, { size: 40, w: 600, color: C.eye, align: 'right', a: cA });
  text(`/ ${M}`, W - 122, 160, { size: 22, color: C.dim, align: 'right', a: cA });
  reveal('每一瞥，记在它落进的那段黑暗上。', X, 160, 11.6, t, { size: 26, color: C.ink, a: 1 - sm(seg(t, 13.2, 13.6)), per: .02 });
  reveal('长的黑暗，接住了更多目光。', X, 160, 13.5, t, { size: 26, color: C.eye, a: 1 - sm(seg(t, T.flyA + .1, T.flyA + .5)), per: .03 });
  // 第三幕说明
  reveal('把 96 段黑暗按长短立起来：一段算一次。', X, 160, 15.7, t, { size: 26, a: 1 - sm(seg(t, T.wA - .2, T.wA + .2)), per: .02 });
  reveal('改成一瞥算一次：长的黑暗被数了更多次。', X, 160, T.wA + .1, t, { size: 26, color: C.eye, a: 1 - sm(seg(t, T.endA - .2, T.endA + .3)), per: .02 });
  // 结尾
  reveal('长的黑暗，更容易被撞见。', X, 205, T.endA + .5, t, { serif: true, size: 64, w: 700, per: .07 });
  reveal(`你随手一瞥遇到的间隔，平均约是典型间隔的 2 倍。`, X, 268, T.endA + 1.6, t, { size: 28, color: C.ink, a: .9, per: .022 });
  const fa = sm(seg(t, 21.2, 21.9)) * .9;
  text('理论：间隔服从均值 1 秒的指数分布时，一瞥落入的那段间隔，期望长度为 2 秒。', X, 1000, { size: 19, color: C.dim, a: fa });
  text(`画面数字：固定种子模拟（种子 ${D.seed}，${G} 段间隔，${M} 次均匀随机抬头），非理论值。`, X, 1030, { size: 19, color: C.dim, a: fa });
}

// 结尾的一只萤火（装饰，不携带数据）
function coda(t) {
  const ft = 22.55; if (t < ft) return;
  const dt = t - ft;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(1690 + 6 * Math.sin(t), 214, 110, C.flyRGB, .8 * Math.min(1, dt / .06) * Math.exp(-dt / .7));
  glow(1690 + 6 * Math.sin(t), 214, 16, C.flyRGB, .7 * Math.exp(-dt / 2));
  ctx.restore();
}

export function render(t) {
  t = clamp(t, 0, DUR - 1e-6);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  background(t);
  // 第一幕镜头缓慢推近，快进时回拉
  const zoom = 1 + .035 * sm(seg(t, 0, T.ffA)) - .035 * eio(seg(t, T.ffA, T.ffB + .3));
  ctx.setTransform(zoom, 0, 0, zoom, (1 - zoom) * W * .55, (1 - zoom) * H * .62);
  fireflies(t); timeline(t); demo(t); rain(t); bars(t); coda(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  words(t);
  const fin = sm(seg(t, 23.5, 24)); if (fin > 0) { ctx.fillStyle = `rgba(0,0,0,${fin * .55})`; ctx.fillRect(0, 0, W, H); }
  finish(t);
}

// ---------- 声音提示点（供 music.py 读取，保证音画同源） ----------
function events() {
  const ev = [];
  F.forEach((f, i) => ev.push({ t: flashFilm[i], type: 'flash', i, pan: D.fireflyX[i] / W * 2 - 1, fast: flashFilm[i] > T.ffA }));
  ev.push({ t: demoFilm - .34, type: 'demoFall' }, { t: demoFilm, type: 'demoLand' }, { t: demoClose, type: 'demoClose', len: gaps[demoGap] });
  for (let r = 0; r < 4; r++) ev.push({ t: T.foldA + 1.15 + .16 * (3 - r), type: 'rowSettle', r });
  glanceInfo.forEach(q => ev.push({ t: q.land, type: 'glance', len: gaps[q.j], pan: rowX(q.g, q.r) / W * 2 - 1 }));
  for (let j = 0; j < G; j++) ev.push({ t: T.flyA + 1.1 + .6 * sortedPos[j] / G, type: 'barLand', len: gaps[j], rank: sortedPos[j] });
  ev.push({ t: T.mean1, type: 'mean1', value: D.mean });
  const curve = []; for (let k = 0; k <= 40; k++) { const tt = T.wA + (T.wB - T.wA) * k / 40; curve.push([tt, barLayout(eio(seg(tt, T.wA, T.wB))).mean]); }
  ev.push({ t: T.wA, type: 'weight', curve, value: D.weightedMean });
  ev.push({ t: T.endA, type: 'resolve' }, { t: 22.55, type: 'coda' });
  return { bpm: 100, bar: BAR, duration: DUR, events: ev.sort((a, b) => a.t - b.t) };
}

// ---------- 页面接口 ----------
let fontsOK = [false, false];
const fontsReady = (async () => {
  try {
    await Promise.all([document.fonts.load('600 40px FilmSerif', '萤火黑暗'), document.fonts.load('400 40px FilmSans', '抬头秒0123')]);
    fontsOK = [document.fonts.check('600 40px FilmSerif', '萤'), document.fonts.check('400 40px FilmSans', '秒')];
  } catch {}
  await document.fonts.ready;
})();
let ready = false; fontsReady.then(() => { ready = true; render(+seek.value); });
window.__ready = () => ready;
window.__duration = DUR;
window.__frame = t => { render(t); return cv.toDataURL('image/jpeg', .93); };
window.__events = events;
window.__diagnostics = () => ({
  fonts: fontsOK, seed: D.seed, gaps: G, glances: M, hitsTotal: hits.reduce((a, b) => a + b, 0),
  landedAtEnd: landedBy(T.flyA), mean: D.mean, weightedMean: D.weightedMean, layoutMeanAtEnd: barLayout(1).mean,
  demoGapLen: gaps[demoGap], demoFilm, demoClose, flashFilmLast: flashFilm[G],
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

// v6 第二风格《十六次抛掷》· 几何包豪斯：红黄蓝黑，纯几何色块，粗黑字。
// 数据、时间轴与首轮样片一致（16 枚硬币 -> 路径 -> X -> 1536 组 -> 理论刻度），只换绘制皮肤。
// 画面只由 t 与固定数据决定；预览、跳转、导出都调用 render(t)。
import { particles, observed } from '../../feature-v5/model.js';

const W = 1920, H = 1080, DUR = 24;
const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
const P = { paper: '#eee7d3', paper2: '#f8f4e8', ink: '#141414', mute: '#6f6a58', red: '#d9261c', yel: '#f3b61f', blue: '#1d3f9a' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const win = (t, a, b, c, d) => sm(seg(t, a, b)) * (1 - sm(seg(t, c, d)));

// ---------- 固定数据 ----------
const N = particles.length;                       // 1536
const obsCum = [0]; observed.forEach((v, i) => obsCum.push(obsCum[i] + v));
const binCount = Array(17).fill(0); particles.forEach(p => binCount[p.heads]++);
const choose = (n, k) => { let v = 1; for (let i = 1; i <= k; i++) v = v * (n + 1 - i) / i; return Math.round(v); };
const pmf = Array.from({ length: 17 }, (_, k) => choose(16, k) / 65536);

// ---------- 几何：x 轴即正面次数 X ----------
const WB = 72, PITCH = WB / 8, SC = PITCH / 8;    // 每格 8 个点；高度 = 组数 × SC，面积与组数成正比
const CX = k => 1080 + (k - 8) * WB;
const Y0 = 200, YB = 560, BASE = 930;
const px = (j, c) => 1080 + (c - j / 2) * WB, py = j => Y0 + (YB - Y0) * j / 16;
const obsPos = obsCum.map((c, j) => [px(j, c), py(j)]);
const slot = p => [CX(p.heads) - WB / 2 + PITCH / 2 + (p.rank % 8) * PITCH, BASE - PITCH / 2 - Math.floor(p.rank / 8) * PITCH];

// 1536 组的释放时刻（固定函数，不抽随机数）
const REL0 = 9.7, RELSPAN = 3.6, FALL = .5;
const parts = particles.map(p => {
  const rel = REL0 + RELSPAN * Math.pow(p.i / N, .85), T = 1.3 + .4 * p.v;
  return { p, rel, T, land: rel + T + FALL, s: slot(p) };
});
const lands = parts.map(q => q.land).sort((a, b) => a - b);
const landedBy = t => { let lo = 0, hi = N; while (lo < hi) { const m = (lo + hi) >> 1; if (lands[m] <= t) lo = m + 1; else hi = m; } return lo; };

// ---------- 文字 ----------
function text(s, x, y, o = {}) {
  ctx.save();
  ctx.globalAlpha *= o.a ?? 1;
  ctx.font = `${o.w ?? 500} ${o.size ?? 32}px FilmSans`;
  ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = (o.ls ?? 0) + 'px';
  if (o.halo) { ctx.lineWidth = o.halo; ctx.lineJoin = 'round'; ctx.strokeStyle = o.haloColor ?? P.paper; ctx.strokeText(s, x, y); }
  ctx.fillStyle = o.color ?? P.ink; ctx.fillText(s, x, y);
  ctx.restore();
}
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------- 背景与装饰几何（第一幕，随后退场） ----------
function background(t) {
  ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
  const din = sm(seg(t, 0, .9)), dout = eio(seg(t, 7.2, 8.8));    // 装饰：开场滑入，路径出现时整体滑出（不淡化，避免发灰）
  if (dout < 1) {
    const drift = (1 - din) * 90 + dout * 520;
    ctx.save(); ctx.globalAlpha = din;
    ctx.fillStyle = P.yel; ctx.beginPath(); ctx.arc(1700 + drift, 800, 170, 0, 7); ctx.fill();
    ctx.fillStyle = P.blue; ctx.fillRect(96 - drift, 720, 150, 150);
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.moveTo(1530 + drift, 1010); ctx.lineTo(1870 + drift, 1010); ctx.lineTo(1870 + drift, 1010 - 56); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = P.ink; ctx.fillRect(96, 52, W - 192, 5);   // 页眉粗线
}

// ---------- 硬币：平涂圆，无阴影 ----------
function coin(x, y, r, kind, o = {}) {
  const sx = o.sx ?? 1, a = o.a ?? 1, g = o.g ?? 1;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x, y); ctx.scale(Math.max(sx, .02), 1);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7);
  if (kind === 'h') {
    ctx.fillStyle = P.red; ctx.fill();
    if (r > 14 && g > .02) { ctx.globalAlpha *= g; ctx.font = `900 ${r * 1.05}px FilmSans`; ctx.textAlign = 'center'; ctx.fillStyle = P.paper2; ctx.fillText('正', 0, r * .37); }
  } else if (kind === 't') {
    ctx.fillStyle = P.paper2; ctx.fill(); ctx.lineWidth = Math.max(2, r * .16); ctx.strokeStyle = P.ink; ctx.stroke();
    if (r > 14 && g > .02) { ctx.globalAlpha *= g; ctx.font = `900 ${r * 1.05}px FilmSans`; ctx.textAlign = 'center'; ctx.fillStyle = P.ink; ctx.fillText('反', 0, r * .37); }
  } else {
    ctx.fillStyle = P.yel; ctx.fill();                      // 尚未翻开的一面
  }
  ctx.restore();
}

// ---------- 镜头 ----------
function cam(t) {
  let s = 1;
  if (t < 9.2) s = 1 + (t < 7.4 ? sm(t / 7.4) * .04 : .04 * (1 - sm(seg(t, 7.4, 9.2))));
  const e = eio(seg(t, 18.3, 21.6));
  return { s: lerp(s, 1.3, e), x: lerp(960, 1080, e), y: lerp(540, 800, e) };
}

// ---------- 第 j 枚硬币的状态：翻面 -> 排成 12:4 -> 化为路径节点 -> 并入观察标记 ----------
let curT = 0;
const nodeBase = i => {
  const rr = eio(seg(curT, 15.9 + .03 * i, 16.7 + .03 * i));
  return [lerp(obsPos[i][0], obsPos[16][0], rr), lerp(obsPos[i][1], obsPos[16][1], rr), rr];
};
function disc(j, t) {
  const h = observed[j], kind = h ? 'h' : 't';
  const x0 = 1080 + (j - 7.5) * 76, y0 = 520;
  const fs = .7 + .22 * j, u = seg(t, fs, fs + .55);
  const flip = Math.abs(Math.cos(Math.PI * u)), face = u < .5 ? 'b' : kind;
  const lift = eio(seg(t, 4.3, 5.1));
  let x = x0, y = y0 - Math.sin(Math.PI * u) * 34 + (h ? -16 : 8) * lift;
  let r = 32, a = 1 - (h ? 0 : .5) * lift, g = 1, sx = flip;
  const gT = seg(t, 7.5 + .03 * j, 9.0 + .03 * j), e = eio(gT);
  if (gT > 0) {
    const [tx, ty] = obsPos[j + 1], ys = y0 + (h ? -16 : 8);
    x = lerp(x0, tx, e); y = lerp(ys, ty, e) - Math.sin(Math.PI * e) * 46;
    r = lerp(32, 6.5, e); a = lerp(a, 1, e); g = 1 - sm(seg(gT, 0, .4)); sx = 1;
    if (gT >= 1) { const nb = nodeBase(j + 1); x = nb[0]; y = nb[1]; }
  }
  return { x, y, r, a, g, sx, face };
}

// ---------- 世界层 ----------
function world(t) {
  curT = t;
  const axisA = sm(seg(t, 9.2, 10.0));
  const pegA = 1 - sm(seg(t, 15.3, 16.3));

  const nodes = []; for (let j = 0; j < 16; j++) nodes.push(disc(j, t));

  // 钉点：每层 m 个位置对应该步累计的正面数
  if (t > 7.7 && pegA > 0) {
    ctx.fillStyle = P.ink;
    for (let j = 0; j < 16; j++) {
      const ra = sm(seg(t, 7.8 + .05 * j, 8.4 + .05 * j)) * pegA; if (ra <= 0) continue;
      ctx.globalAlpha = .3 * ra;
      for (let m = 0; m <= j; m++) ctx.fillRect(px(j, m) - 2.5, py(j) - 2.5, 5, 5);
    }
    ctx.globalAlpha = 1;
  }

  // X=12 列的黄色底（高亮观察值所在的档）
  const hl = sm(seg(t, 17.4, 18.2));
  if (hl > 0) {
    ctx.fillStyle = P.yel; ctx.globalAlpha = hl;
    const top = 600, hgt = BASE - top; ctx.fillRect(CX(12) - WB / 2, BASE - hgt * hl, WB, hgt * hl); ctx.globalAlpha = 1;
  }

  // 坐标：基线、刻度、组数参考线
  if (axisA > 0) {
    ctx.save(); ctx.globalAlpha = axisA;
    ctx.strokeStyle = 'rgba(20,20,20,.22)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 8]);
    for (let c = 50; c <= 300; c += 50) {
      const y = BASE - c * SC; ctx.beginPath(); ctx.moveTo(CX(0) - WB / 2, y); ctx.lineTo(CX(16) + WB / 2, y); ctx.stroke();
      text(String(c), CX(0) - WB / 2 - 14, y + 7, { size: 20, w: 700, color: P.mute, align: 'right' });
    }
    ctx.setLineDash([]);
    text('组数', CX(0) - WB / 2 - 14, BASE - 300 * SC - 30, { size: 22, w: 700, color: P.mute, align: 'right' });
    ctx.fillStyle = P.ink; ctx.fillRect(CX(0) - WB / 2, BASE, 17 * WB, 7);
    for (let k = 0; k <= 16; k++) {
      const red = k === 12 && hl > 0;
      text(String(k), CX(k), BASE + 52, { size: 30, w: red ? 900 : 700, color: red ? P.red : P.ink, align: 'center' });
    }
    text('正面次数 X', 1080, BASE + 102, { size: 24, w: 700, ls: 8, color: P.mute, align: 'center' });
    ctx.restore();
  }

  // 模拟点：1536 组，每点一组；方块
  ctx.fillStyle = P.blue;
  for (const q of parts) {
    if (t < q.rel) continue;
    const tp = (t - q.rel) / q.T, p = q.p; let x, y, r, a;
    if (tp < 1) {
      const u = tp * 16, j = Math.min(15, Math.floor(u)), f = u - j, e = f < .5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f);
      x = lerp(px(j, p.cum[j]), px(j + 1, p.cum[j + 1]), e); y = lerp(py(j), py(j + 1), f); r = 2.6; a = .55;
    } else {
      const gf = clamp((t - q.rel - q.T) / FALL), x1 = px(16, p.heads);
      x = lerp(x1, q.s[0], sm(gf)); y = lerp(YB, q.s[1], gf * gf); r = lerp(2.8, 3.3, gf); a = lerp(.6, 1, gf);
    }
    ctx.globalAlpha = a; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  ctx.globalAlpha = 1;

  // 理论期望频次：只画轮廓，与模拟点共用同一组数刻度
  for (let k = 0; k <= 16; k++) {
    const g = eio(seg(t, 16.3 + Math.abs(k - 8) * .07, 17.2 + Math.abs(k - 8) * .07)); if (g <= 0) continue;
    const h = pmf[k] * N * SC * g, x = CX(k) - WB / 2 + 1.5;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3.2; ctx.strokeRect(x, BASE - h, WB - 3, h);
  }

  // 观察路径：一根红线穿过这 16 枚硬币，硬币排成的行就是路径
  const lineA = 1 - sm(seg(t, 16.5, 17.0));
  const ns = []; for (let i = 0; i <= 16; i++) ns.push(nodeBase(i));
  if (t > 7.2 && lineA > 0) {
    ctx.save(); ctx.strokeStyle = P.red; ctx.lineWidth = 6; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    ctx.globalAlpha = lineA * sm(seg(t, 7.2, 7.8));
    ctx.beginPath(); ctx.moveTo(nodes[0].x, nodes[0].y); for (let j = 1; j < 16; j++) ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
    const sg = sm(seg(t, 8.3, 9.0));
    if (sg > 0) { ctx.globalAlpha = lineA * sg; ctx.beginPath(); ctx.moveTo(ns[0][0], ns[0][1]); ctx.lineTo(nodes[0].x, nodes[0].y); ctx.stroke(); }
    ctx.restore();
    const sa = sm(seg(t, 7.4, 8.0)) * (1 - ns[0][2]);
    if (sa > 0) { ctx.save(); ctx.globalAlpha = sa; ctx.fillStyle = P.paper2; ctx.fillRect(ns[0][0] - 9, ns[0][1] - 9, 18, 18); ctx.lineWidth = 4; ctx.strokeStyle = P.ink; ctx.strokeRect(ns[0][0] - 9, ns[0][1] - 9, 18, 18); ctx.restore(); }
  }
  for (let j = 0; j < 16; j++) {
    const d = nodes[j], gone = d.r < 8 ? 1 - sm(seg(ns[j + 1][2], .82, 1)) : 1;
    if (gone <= 0) continue;
    coin(d.x, d.y, d.r, d.face, { sx: d.sx, a: d.a * gone, g: d.g });
  }

  // 终点提示 X=12，随后落入分布并留下标记
  const pe = sm(seg(t, 9.5, 10.2)) * (1 - sm(seg(t, 16.2, 16.8)));
  if (pe > 0) {
    const [ex, ey] = obsPos[16], ring = seg(t, 9.55, 10.3);
    ctx.save(); ctx.globalAlpha = pe * (1 - ring * .7); ctx.strokeStyle = P.red; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ex, ey, 10 + ring * 24, 0, 7); ctx.stroke(); ctx.restore();
    text('这一组  X = 12', ex + 30, ey + 10, { size: 28, w: 900, color: P.red, halo: 8, a: pe });
  }
  const md = seg(t, 16.9, 17.9);
  if (md > 0) {
    const tipY = 858, g = md * md, bounce = md >= 1 ? -9 * Math.exp(-(t - 17.9) * 8) * Math.abs(Math.sin((t - 17.9) * 14)) : 0;
    const my = lerp(YB, tipY, g) + bounce, mx = CX(12), mA = sm(seg(t, 16.9, 17.2));
    ctx.save(); ctx.globalAlpha = mA;
    const pulse = t > 19.0 ? (t - 19.0) % 1.6 / 1.6 : -1;
    if (pulse >= 0 && md >= 1) { ctx.strokeStyle = P.red; ctx.globalAlpha = mA * (1 - pulse) * .85; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(mx, my - 32, 17 + pulse * 30, 0, 7); ctx.stroke(); ctx.globalAlpha = mA; }
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.moveTo(mx - 10, my - 20); ctx.lineTo(mx + 10, my - 20); ctx.lineTo(mx, my); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.red; ctx.beginPath(); ctx.arc(mx, my - 34, 17, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.restore();
    text('观察 X = 12', mx, my - 72, { size: 30, w: 900, color: P.red, align: 'center', halo: 9, haloColor: P.yel, a: mA });
  }
}

// ---------- 屏幕层文字 ----------
function head(kick, line, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = '700 22px FilmSans'; ctx.letterSpacing = '8px';
  const w = ctx.measureText(kick).width;
  ctx.fillStyle = P.red; ctx.fillRect(96, 78, w + 28, 40);
  ctx.restore();
  text(kick, 110, 107, { size: 22, w: 700, ls: 8, color: P.paper2, a });
  text(line, 96, 182, { size: 54, w: 900, a });
}
function band(t, xa, xb, y, h, label, size, a) {   // 黑色横幅，从左擦入、向右擦出
  if (xb <= xa) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.beginPath(); ctx.rect(xa, y, xb - xa, h); ctx.clip();
  ctx.fillStyle = P.ink; ctx.fillRect(xa, y, xb - xa, h);
  text(label, 960, y + h / 2 + size * .36, { size, w: 900, color: P.paper2, align: 'center' });
  ctx.restore();
}
function hud(t) {
  text('概念动画实验室 · v6 包豪斯样片 · 无配乐', 96, 1046, { size: 18, w: 500, color: P.mute, ls: 1 });

  head('一次观察', '抛 16 次硬币，记下每一次', win(t, .3, 1.0, 4.7, 5.4));
  head('换一个设想', '假设硬币公平，且各次独立', win(t, 7.9, 8.6, 15.2, 15.8));
  head('两种不同的东西', '模拟频次与理论期望，共用一条刻度', win(t, 16.2, 16.9, 19.8, 20.4));

  // 12 : 4 读数
  const done = (() => { let n = 0, h = 0; for (let j = 0; j < 16; j++) { if (t >= .7 + .22 * j + .28) { n++; h += observed[j]; } } return { n, h, tl: n - h }; })();
  const ta = sm(seg(t, .9, 1.4)) * (1 - sm(seg(t, 7.3, 7.9)));
  if (ta > 0) {
    const big = eio(seg(t, 4.3, 5.2)), sz = lerp(120, 180, big);
    text(String(done.h), 800, 790, { size: sz, w: 900, color: P.red, align: 'right', a: ta });
    text('次正面', 824, 790, { size: 36, w: 800, color: P.red, a: ta });
    text(String(done.tl), 1290, 790, { size: sz, w: 900, color: P.ink, align: 'right', a: ta });
    text('次反面', 1314, 790, { size: 36, w: 800, color: P.ink, a: ta });
    text(`已翻 ${done.n} / 16`, 1080, 880, { size: 24, w: 700, ls: 4, color: P.mute, align: 'center', a: ta * (1 - big) });
  }
  // 大问题：黑色横幅
  const qin = sm(seg(t, 5.5, 6.1)), qout = sm(seg(t, 7.0, 7.6));
  band(t, W * qout, W * qin, 150, 190, '硬币偏了吗？', 130, 1);

  // 模型说明与计数器
  const la = win(t, 10.0, 10.8, 15.2, 15.8);
  if (la > 0) {
    ctx.save(); ctx.globalAlpha = la; ctx.fillStyle = P.blue; ctx.fillRect(96, 346, 10, 168); ctx.restore();
    text('每组 16 次抛掷', 128, 380, { size: 30, w: 700, a: la });
    text('只记正面次数 X', 128, 428, { size: 30, w: 700, a: la });
    text('X ∼ Binomial(16, ½)', 128, 494, { size: 38, w: 900, color: P.blue, a: la });
  }
  const ca = win(t, 9.9, 10.6, 16.0, 16.6), n = landedBy(t);
  if (ca > 0) {
    text(fmt(n), 1824, 262, { size: 84, w: 900, color: P.blue, align: 'right', a: ca });
    text('/ 1,536 组模拟已落入分布', 1824, 306, { size: 24, w: 700, color: P.blue, align: 'right', a: ca });
    text('固定种子 · 与观察无关', 1824, 344, { size: 20, w: 500, color: P.mute, align: 'right', a: ca });
  }

  // 图例
  const ga = sm(seg(t, 16.8, 17.6));
  if (ga > 0) {
    const dy = eio(seg(t, 18.6, 21.2)) * 650;
    ctx.save(); ctx.translate(0, dy); ctx.globalAlpha = ga;
    ctx.fillStyle = P.blue; ctx.fillRect(98, 238, 18, 18);
    text('模拟频次 · 固定种子 1,536 组，每点一组', 134, 255, { size: 24, w: 700 });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.strokeRect(99.5, 285.5, 21, 21);
    text('理论期望频次 · 1,536 × P(X = k)', 134, 304, { size: 24, w: 700 });
    ctx.fillStyle = P.red; ctx.beginPath(); ctx.arc(108, 346, 10, 0, 7); ctx.fill();
    text('观察 · 一次 16 抛，12 正', 134, 355, { size: 24, w: 700, color: P.red });
    ctx.restore();
  }

  // 收束问题：黑色横幅从右侧让出图例，停在图上方
  const ein = sm(seg(t, 20.4, 21.4));
  band(t, 480, 480 + (W - 480) * ein, 70, 130, '这样的结果，有多罕见？', 80, 1);
}

export function render(time) {
  const t = clamp(time, 0, DUR - 1e-6);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  background(t);
  const c = cam(t);
  ctx.save(); ctx.translate(960, 540); ctx.scale(c.s, c.s); ctx.translate(-c.x, -c.y);
  world(t);
  ctx.restore();
  hud(t);
}

// ---------- 接口 ----------
const FONT_TEXT = '正反硬币偏了吗？一次观察抛次记下每换个设想假设公平且各独立两种不同的东西模拟频次与理论期望共用条刻度只组数X这样的结果有多罕见固定种子无关已落入分布概念动画实验室包豪斯样片配乐翻面读数';
let ready = false, fontOk = [];
Promise.all([
  document.fonts.load('900 40px FilmSans', FONT_TEXT), document.fonts.load('700 40px FilmSans', FONT_TEXT),
  document.fonts.load('500 24px FilmSans', FONT_TEXT), document.fonts.load('900 40px FilmSans', '0123456789'),
]).then(() => { fontOk = [document.fonts.check('900 24px FilmSans', FONT_TEXT)]; ready = true; render(0); });

window.__ready = () => ready;
window.__duration = DUR;
window.__frame = t => { render(t); return cv.toDataURL('image/jpeg', .94); };
window.__diagnostics = () => ({ fonts: fontOk, particles: N, binCount, landedAtEnd: landedBy(DUR), observedHeads: obsCum[16] });

// ---------- 预览 ----------
if (!location.search.includes('export=1')) {
  const seek = document.getElementById('seek'), clock = document.getElementById('clock'), btn = document.getElementById('toggle');
  let playing = false, t0 = 0, base = 0, now = 0;
  const show = t => { now = t; seek.value = t; clock.textContent = `${t.toFixed(2)} / ${DUR.toFixed(2)} s`; render(t); };
  const tick = ts => { if (!playing) return; const t = base + (ts - t0) / 1000; if (t >= DUR) { playing = false; btn.textContent = '播放'; show(DUR - 1e-3); return; } show(t); requestAnimationFrame(tick); };
  const play = () => { if (now >= DUR - .01) now = 0; playing = true; btn.textContent = '暂停'; base = now; t0 = performance.now(); requestAnimationFrame(tick); };
  const pause = () => { playing = false; btn.textContent = '播放'; };
  btn.onclick = () => playing ? pause() : play();
  seek.oninput = () => { const was = playing; pause(); show(+seek.value); if (was) play(); };
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.code === 'ArrowRight') { const was = playing; pause(); show(Math.min(DUR - 1e-3, now + 1)); if (was) play(); }
    if (e.code === 'ArrowLeft') { const was = playing; pause(); show(Math.max(0, now - 1)); if (was) play(); }
  });
  const wait = setInterval(() => { if (ready) { clearInterval(wait); show(0); } }, 50);
}

// v6《你撞见的黑暗》导出器：无头 Chrome 按精确时间取帧 -> FFmpeg，混入 out/score.wav。输出限制在 feature-v6/fireflies/ 内。
// 默认输出 feature-v6/fireflies/out/prototype.mp4，不触碰旧版成片。
//   node feature-v6/fireflies/export.mjs --verify
//   node feature-v6/fireflies/export.mjs --shots 0.5,2,4.8,...
//   node feature-v6/fireflies/export.mjs [--from 0 --to 24] [--out out/prototype.mp4]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const FPS = 30, DURATION = 24;
const args = process.argv.slice(2);
const value = (key, def) => { const i = args.indexOf(key); return i < 0 ? def : args[i + 1]; };
const shots = value('--shots', null);
const from = Number(value('--from', '0')), to = Number(value('--to', String(DURATION)));
const out = resolve(root, value('--out', 'out/prototype.mp4'));
if (!out.startsWith(root)) throw new Error('输出必须位于 feature-v6/fireflies/ 内');
const chrome = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(x => x && existsSync(x));
if (!chrome) throw new Error('Chrome/Edge not found; set CHROME to its executable path');
if (!shots && (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to > DURATION || to <= from)) throw new Error('Invalid --from/--to');
const profile = mkdtempSync(join(tmpdir(), 'concept-motion-'));
let browser, encoder, ws;
const cleanup = () => { try { ws?.close(); } catch {} try { browser?.kill(); } catch {} try { encoder?.kill(); } catch {} try { if (dirname(resolve(profile)) !== resolve(tmpdir()) || !basename(profile).startsWith('concept-motion-')) throw Error('Unexpected browser profile path'); rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch {} };
process.on('exit', cleanup); process.on('SIGINT', () => process.exit(130));
const sleep = ms => new Promise(r => setTimeout(r, ms));
browser = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${profile}`, '--window-size=1920,1080', '--hide-scrollbars', '--mute-audio', '--allow-file-access-from-files', '--no-first-run', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
browser.stderr.on('data', () => {}); browser.on('error', e => console.error('Browser launch error', e));
let port;
for (let i = 0; i < 300 && !port; i++) { try { port = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch {} if (!port) await sleep(100); }
if (!port) throw new Error('Browser did not start');
let target;
for (let i = 0; i < 100 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x => x.type === 'page'); } catch {} if (!target) await sleep(100); }
if (!target) throw new Error('Browser page not found');
ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') console.error('page:', m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text); const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); } };
ws.onclose = () => { for (const p of pending.values()) p.reject(Error('Browser closed')); };
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id, method, params })); });
const evalJs = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
await send('Page.enable'); await send('Runtime.enable');
const pageUrl = value('--url', pathToFileURL(join(root, 'index.html')).href);
await send('Page.navigate', { url: pageUrl + (pageUrl.includes('?') ? '&' : '?') + 'export=1' });
let ready = false; for (let i = 0; i < 200 && !ready; i++) { await sleep(100); try { ready = await evalJs("typeof window.__frame==='function' && window.__ready()"); } catch {} }
if (!ready) throw new Error('Page did not become ready');
const getFrame = async t => { const data = await evalJs(`window.__frame(${t})`); return Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'); };
mkdirSync(join(root, 'out'), { recursive: true });

if (args.includes('--verify')) {
  const hash = b => createHash('sha256').update(b).digest('hex');
  const a = hash(await getFrame(12.8)); await getFrame(3.1); await getFrame(21.7); const b = hash(await getFrame(12.8));
  if (a !== b) throw new Error('Frame depends on playback history');
  const d = await evalJs('window.__diagnostics()');
  if (d.fonts.some(x => !x)) throw Error('Bundled fonts did not load');
  const md = JSON.parse(readFileSync(join(root, 'out', 'model.json'), 'utf8'));
  if (d.seed !== md.seed || d.gaps !== md.G || d.glances !== md.M || d.hitsTotal !== md.M) throw Error('Page data differs from out/model.json');
  if (d.landedAtEnd !== md.M) throw Error('Not all glances land before the bars form');
  if (Math.abs(d.layoutMeanAtEnd - md.weightedMean) > 1e-5) throw Error('Weighted bar layout mean differs from model weighted mean');
  const sw = md.hits.reduce((a, h, j) => a + h * md.gaps[j], 0) / md.M, m = md.gaps.reduce((a, b) => a + b, 0) / md.G;
  if (Math.abs(sw - md.weightedMean) > 1e-6 || Math.abs(m - md.mean) > 1e-6) throw Error('Model statistics recomputation failed');
  const result = { deterministic: true, hash12_8: a, ...d, duration: await evalJs('window.__duration') };
  writeFileSync(join(root, 'out', 'verify-browser.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); process.exit(0);
}
if (args.includes('--events')) {
  writeFileSync(join(root, 'out', 'events.json'), JSON.stringify(await evalJs('window.__events()')));
  console.log('wrote out/events.json'); process.exit(0);
}
if (shots) {
  const dir = join(root, 'out', 'shots'); mkdirSync(dir, { recursive: true });
  for (const t of shots.split(',').map(Number)) {
    if (!Number.isFinite(t) || t < 0 || t >= DURATION) throw new Error(`Invalid shot time ${t}`);
    writeFileSync(join(dir, `t${t.toFixed(2).padStart(5, '0')}.jpg`), await getFrame(t)); console.log(`shot ${t}s`);
  }
  process.exit(0);
}
mkdirSync(dirname(out), { recursive: true });
const score = join(root, 'out', 'score.wav'); if (!existsSync(score)) throw new Error('先运行 python -X utf8 feature-v6/fireflies/music.py');
const count = Math.round((to - from) * FPS);
encoder = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-ss', String(from), '-t', String(to - from), '-i', score, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_trc', 'bt709', '-color_primaries', 'bt709', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
let ffError = null; encoder.on('error', e => ffError = e); encoder.stdin.on('error', e => ffError = e);
const ended = new Promise((res, rej) => { encoder.on('close', c => c === 0 ? res() : rej(Error(`ffmpeg exited ${c}`))); });
const began = Date.now();
for (let i = 0; i < count; i++) {
  if (ffError) throw ffError;
  const data = await getFrame(from + i / FPS);
  if (!encoder.stdin.write(data)) await new Promise(r => encoder.stdin.once('drain', r));
  if (i % 120 === 0 || i === count - 1) console.log(`${i + 1}/${count} ${((i + 1) / count * 100).toFixed(1)}% ${((i + 1) / ((Date.now() - began) / 1000)).toFixed(1)} fps`);
}
encoder.stdin.end(); await ended; console.log(`wrote ${out}`); process.exit(0);

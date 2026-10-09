import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)));
const config=JSON.parse(readFileSync(join(root,'timeline.json'),'utf8'));
const args=process.argv.slice(2);
const value=(key,def)=>{const i=args.indexOf(key);return i<0?def:args[i+1]};
const shots=value('--shots',null);
const from=Number(value('--from','0')),to=Number(value('--to',String(config.duration)));
const out=resolve(root,value('--out','out/film-v5.mp4'));
const chrome=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(x=>x&&existsSync(x));
if(!chrome)throw new Error('Chrome/Edge not found; set CHROME to its executable path');
if(!shots && (!Number.isFinite(from)||!Number.isFinite(to)||from<0||to>config.duration||to<=from))throw new Error('Invalid --from/--to');
const profile=mkdtempSync(join(tmpdir(),'concept-motion-'));
let browser,encoder,ws;
const cleanup=()=>{try{ws?.close()}catch{}try{browser?.kill()}catch{}try{encoder?.kill()}catch{}try{if(dirname(resolve(profile))!==resolve(tmpdir())||!basename(profile).startsWith('concept-motion-'))throw Error('Unexpected browser profile path');rmSync(profile,{recursive:true,force:true,maxRetries:5})}catch{}};
process.on('exit',cleanup);process.on('SIGINT',()=>process.exit(130));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
browser=spawn(chrome,['--headless=new','--remote-debugging-port=0','--remote-allow-origins=*',`--user-data-dir=${profile}`,'--window-size=1920,1080','--hide-scrollbars','--mute-audio','--allow-file-access-from-files','--no-first-run','about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
browser.stderr.on('data',d=>{if(d.toString().includes('DevTools listening'))process.stderr.write(d)}); browser.on('error',e=>console.error('Browser launch error',e)); let port;
for(let i=0;i<300&&!port;i++){try{port=Number(readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0])}catch{}if(!port)await sleep(100)}
if(!port)throw new Error('Browser did not start');
let target;
for(let i=0;i<100&&!target;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x=>x.type==='page')}catch{}if(!target)await sleep(100)}
if(!target)throw new Error('Browser page not found');
ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
let seq=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')console.error('page:',m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}};
ws.onclose=()=>{for(const p of pending.values())p.reject(Error('Browser closed'))};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evalJs=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Page.enable');await send('Runtime.enable');const pageUrl=value('--url',pathToFileURL(join(root,'index.html')).href);await send('Page.navigate',{url:pageUrl+(pageUrl.includes('?')?'&':'?')+'export=1'});
let ready=false;for(let i=0;i<160&&!ready;i++){await sleep(100);try{ready=await evalJs("typeof window.__frame==='function' && window.__ready()") }catch{}}
if(!ready)throw new Error('Page did not become ready');
const getFrame=async t=>{const data=await evalJs(`window.__frame(${t})`);return Buffer.from(data.slice(data.indexOf(',')+1),'base64')};
mkdirSync(join(root,'out'),{recursive:true});
if(args.includes('--verify')){
  const hash=b=>createHash('sha256').update(b).digest('hex');
  const a=hash(await getFrame(12.8));await getFrame(41.7);const b=hash(await getFrame(12.8));
  if(a!==b)throw new Error('Frame depends on playback history');
  const diagnostics=await evalJs('window.__diagnostics()');
  if(diagnostics.fonts?.some(loaded=>!loaded))throw Error('Bundled fonts did not load');
  const textFit=await evalJs('window.__textFit()');
  if(textFit.some(x=>x.big>1700||x.small>1700))throw Error('Text exceeds safe width: '+JSON.stringify(textFit.filter(x=>x.big>1700||x.small>1700)));
  const transitions=await evalJs("typeof window.__transitionCheck==='function'?window.__transitionCheck():[]");
  if(transitions.some(x=>x.maxDisplacement>1))throw Error('Particle position jumps at a scene boundary: '+JSON.stringify(transitions.filter(x=>x.maxDisplacement>1)));
  await evalJs("new Promise((resolve,reject)=>{const a=document.getElementById('audio');if(a.readyState>=1)return resolve();a.addEventListener('loadedmetadata',resolve,{once:true});a.addEventListener('error',()=>reject(Error('Audio failed')),{once:true});a.load()})");
  const duration=await evalJs("document.getElementById('audio').duration");
  if(Math.abs(duration-config.duration)>.03)throw Error('Audio duration differs from timeline');
  const layoutAudit=await evalJs('window.__layoutAudit()'); writeFileSync(join(root,'out','browser-verification.json'),JSON.stringify({deterministic:true,audioDuration:duration,...diagnostics,textFit,layoutAudit},null,2)); console.log(JSON.stringify({deterministic:true,audioDuration:duration,...diagnostics,maxCaptionWidth:Math.max(...textFit.flatMap(x=>[x.big,x.small])),layoutIssues:layoutAudit.length}));process.exit(0);
}
if(shots){const dir=join(root,'shots');mkdirSync(dir,{recursive:true});for(const t of shots.split(',').map(Number)){if(!Number.isFinite(t)||t<0||t>=config.duration)throw new Error(`Invalid shot time ${t}`);writeFileSync(join(dir,`t${t.toFixed(2).padStart(5,'0')}.jpg`),await getFrame(t));console.log(`shot ${t}s`)}process.exit(0)}
const soundtrack=join(root,'out','soundtrack.wav');if(!existsSync(soundtrack))throw new Error('Run python scripts/music.py first');
mkdirSync(dirname(out),{recursive:true});
const count=Math.round((to-from)*config.fps);
encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(config.fps),'-c:v','mjpeg','-i','-','-ss',String(from),'-t',String(to-from),'-i',soundtrack,'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','18','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709','-pix_fmt','yuv420p','-r',String(config.fps),'-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit'],windowsHide:true});
let ffError=null;encoder.on('error',e=>ffError=e);encoder.stdin.on('error',e=>ffError=e);
const ended=new Promise((resolve,reject)=>{encoder.on('close',c=>c===0?resolve():reject(Error(`ffmpeg exited ${c}`)))});
const began=Date.now();for(let i=0;i<count;i++){if(ffError)throw ffError;const data=await getFrame(from+i/config.fps);if(!encoder.stdin.write(data))await new Promise(r=>encoder.stdin.once('drain',r));if(i%150===0||i===count-1){const rate=(i+1)/((Date.now()-began)/1000);console.log(`${i+1}/${count} ${((i+1)/count*100).toFixed(1)}% ${rate.toFixed(1)} fps`)}}
encoder.stdin.end();await ended;console.log(`wrote ${out}`);process.exit(0);

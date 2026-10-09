// Exercise the encoded MP4 through a clean headless Chromium video element.
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const profile=mkdtempSync(join(tmpdir(),'concept-playback-'));
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--mute-audio','about:blank'],{stdio:'ignore',windowsHide:true});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cleanup(){try{ws?.close();browser.kill()}catch{}try{if(dirname(resolve(profile))!==resolve(tmpdir())||!basename(profile).startsWith('concept-playback-'))throw Error('Unsafe temporary directory');rmSync(profile,{recursive:true,force:true,maxRetries:5})}catch{}}
process.on('exit',cleanup);
let port;for(let i=0;i<160&&!port;i++){try{port=+readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]}catch{}if(!port)await sleep(100)}
if(!port)throw Error('Chromium did not start');
const target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');
ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
let id=0;const pending=new Map();ws.onmessage=e=>{const x=JSON.parse(e.data),p=pending.get(x.id);if(p){pending.delete(x.id);x.error?p.reject(Error(x.error.message)):p.resolve(x.result)}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
await send('Page.navigate',{url:'http://127.0.0.1:8780/feature-v5/watch.html'});
await sleep(800);
const result=await evaluate(`(async()=>{
  const v=document.querySelector('video');if(!v)throw Error('Video player missing');v.muted=true;
  await new Promise((r,j)=>{if(v.readyState>=1)return r();v.addEventListener('loadedmetadata',r,{once:true});v.addEventListener('error',()=>j(Error('Metadata failed')),{once:true});setTimeout(()=>j(Error('Metadata timeout')),10000)});
  await v.play();await new Promise(r=>setTimeout(r,1400));const start=v.currentTime;if(start<.3)throw Error('Playback clock did not advance');v.pause();
  await new Promise((r,j)=>{v.addEventListener('seeked',r,{once:true});v.currentTime=184;setTimeout(()=>j(Error('Seek timeout')),10000)});
  await v.play();await new Promise(r=>setTimeout(r,700));v.pause();
  return{duration:v.duration,width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,initialPlaybackTime:start,afterSeekTime:v.currentTime,decodedFrames:v.getVideoPlaybackQuality().totalVideoFrames,error:v.error?.message??null,chapterButtons:document.querySelectorAll('#chapters button').length};
})()`);
if(result.duration!==224||result.width!==1920||result.height!==1080||result.error||result.decodedFrames<20||result.chapterButtons!==14)throw Error(JSON.stringify(result));
writeFileSync(join(root,'out','browser-playback.json'),JSON.stringify({passed:true,...result},null,2));console.log(JSON.stringify({passed:true,...result}));process.exit(0);

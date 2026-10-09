import timeline from './timeline.json' with {type:'json'};
import {drawScene,drawCaption,prepareTitle} from './scenes.js';
import {W,H,P,clamp,prog,rect,line,text,setAudit,audit,textCapture,replayText} from './draw.js';
import {diagnostics} from './model.js';
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d',{alpha:false}),D=timeline.duration;
const layer=document.createElement('canvas');layer.width=W;layer.height=H;const lc=layer.getContext('2d',{alpha:false});
const isExport=new URLSearchParams(location.search).has('export');if(isExport)document.body.classList.add('export');
const sceneAt=t=>timeline.scenes.find(s=>t>=s.start&&t<s.end)||timeline.scenes.at(-1);
function world(c,t){const s=sceneAt(t);drawScene(c,t,s);
 // A short mechanical shutter, different from an opaque cross-fade. Graphic only;
 // the caption-safe band is composited afterwards. It closes on the musical bar.
 const left=s.end-t,cut=clamp((.30-left)/.30);if(s.id!=='finale'&&cut>0){const e=cut*cut;for(let j=0;j<9;j++){const y=j*103.4;rect(c,j%2?W-W*e:0,y,W*e,104,j%3===0?P.mint2:P.deep,.92);line(c,[j%2?W-W*e:W*e,y],[j%2?W-W*e:W*e,y+104],P.orange,2,.65)}text(c,'·',960,470,36,P.orange,'sans','center',e)}
}
function frame(t,capture=false){t=clamp(t,0,D-.0001);if(capture)textCapture('queue');world(ctx,t);if(capture){const commands=textCapture('hide');world(lc,Math.min(t+1/120,sceneAt(t).end-.00001));ctx.save();ctx.globalAlpha=.5;ctx.drawImage(layer,0,0);ctx.restore();replayText(ctx,commands)}
 drawCaption(ctx,t,timeline);return capture?canvas.toDataURL('image/jpeg',.97):undefined}
let ready=false;Promise.all([document.fonts.load('750 60px FilmSans','概率论与数理统计'),document.fonts.load('750 60px FilmSerif','偶然的秩序')]).then(()=>document.fonts.ready).then(()=>{prepareTitle();ready=true;frame(Number(new URLSearchParams(location.search).get('t'))||0)});
window.__frame=t=>frame(t,true);window.__ready=()=>ready;window.__duration=D;
window.__diagnostics=()=>({duration:D,scenes:timeline.scenes.length,captions:timeline.captions.length,fonts:[document.fonts.check('750 60px FilmSans','概率论与数理统计'),document.fonts.check('750 60px FilmSerif','偶然的秩序')],...diagnostics()});
window.__textFit=()=>{const c=document.createElement('canvas').getContext('2d');return timeline.captions.map(x=>{c.font='650 38px FilmSans';const big=c.measureText(x.big).width;c.font='450 29px FilmSans';return{t:x.t,big,small:c.measureText(x.small).width}})};
window.__layoutAudit=()=>{const findings=[];for(let t=.5;t<D;t+=.5){setAudit(true);frame(t);for(const a of audit){if(a.alpha<.8||a.h<20)continue;if(a.x<70||a.x+a.w>1850||a.y-a.h*.52<30||a.y+a.h*.6>1060)findings.push({t,...a})}}setAudit(false);return findings};
const audio=document.querySelector('#audio'),button=document.querySelector('#toggle'),seek=document.querySelector('#seek'),clock=document.querySelector('#clock');let raf=0;
const stamp=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function paint(){const t=audio.currentTime;frame(t);seek.value=t;clock.textContent=stamp(t)+' / '+stamp(D);if(!audio.paused)raf=requestAnimationFrame(paint)}
button.onclick=async()=>{if(audio.paused){if(audio.ended)audio.currentTime=0;await audio.play();button.textContent='暂停';paint()}else{audio.pause();button.textContent='播放';cancelAnimationFrame(raf)}};
seek.oninput=()=>{audio.currentTime=Number(seek.value);frame(Number(seek.value));clock.textContent=stamp(Number(seek.value))+' / '+stamp(D)};audio.onended=()=>button.textContent='重播';
document.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();button.click()}if(e.code==='ArrowRight'||e.code==='ArrowLeft'){audio.currentTime=clamp(audio.currentTime+(e.code==='ArrowRight'?1:-1),0,D);frame(audio.currentTime)}};

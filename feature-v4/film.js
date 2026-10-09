import timeline from './timeline.json' with {type:'json'};
import {W,H,P,drawScene,drawCaption,clamp,smooth} from './scenes.js';
import {particles,counts,binom,exactP,coverage} from './model.js';
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d',{alpha:false}),D=timeline.duration;
function scene(t){return timeline.scenes.find(s=>t>=s.start&&t<s.end)||timeline.scenes.at(-1)}
function frame(t,capture=false){t=clamp(t,0,D-.001);const s=scene(t);ctx.save();drawScene(ctx,t,s);ctx.restore();drawCaption(ctx,t,timeline);
 const lt=t-s.start,flash=(1-smooth(lt/.14))*.18;if(flash>0){ctx.fillStyle=`rgba(244,236,224,${flash})`;ctx.fillRect(0,0,W,H)}
 if(t>D-1.2){ctx.fillStyle=`rgba(11,16,25,${1-smooth((D-t)/1.2)})`;ctx.fillRect(0,0,W,H)}
 return capture?canvas.toDataURL('image/jpeg',.94):undefined}
let ready=false;Promise.all([document.fonts.load('700 60px NotoSansFilm','概率论与数理统计'),document.fonts.load('700 60px NotoSerifFilm','概率论与数理统计')]).then(()=>document.fonts.ready).then(()=>{ready=true;frame(0)});
window.__frame=t=>frame(t,true);window.__ready=()=>ready;window.__duration=D;
window.__diagnostics=()=>({duration:D,scenes:timeline.scenes.length,captions:timeline.captions.length,particles:particles.length,fonts:[document.fonts.check('700 60px NotoSansFilm','概率论与数理统计'),document.fonts.check('700 60px NotoSerifFilm','概率论与数理统计')],binSum:counts.reduce((a,b)=>a+b,0),probSum:binom.reduce((a,b)=>a+b,0),exactP,coverage,intervalCount:40});
window.__textFit=()=>{const c=document.createElement('canvas').getContext('2d');return timeline.captions.map(x=>{c.font='750 46px NotoSansFilm';const big=c.measureText(x.big).width;c.font='500 27px NotoSansFilm';const small=c.measureText(x.small).width;return{t:x.t,big,small}})};
const audio=document.querySelector('#audio'),toggle=document.querySelector('#toggle'),seek=document.querySelector('#seek'),clock=document.querySelector('#clock');let playing=false,raf=0,base=0,started=0,available=false;audio.addEventListener('canplay',()=>available=true);const current=()=>playing?(available?audio.currentTime:base+(performance.now()-started)/1000):Number(seek.value);const stamp=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function paint(){const t=clamp(current(),0,D);frame(t);seek.value=String(t);clock.textContent=`${stamp(t)} / ${stamp(D)}`;if(playing&&t<D)raf=requestAnimationFrame(paint);else if(t>=D){playing=false;audio.pause();toggle.textContent='重播'}}
toggle.onclick=async()=>{if(playing){seek.value=String(current());playing=false;audio.pause();cancelAnimationFrame(raf);toggle.textContent='播放';return}if(Number(seek.value)>=D-.01)seek.value='0';base=Number(seek.value);started=performance.now();playing=true;if(available){audio.currentTime=base;try{await audio.play()}catch{available=false;started=performance.now()}}toggle.textContent='暂停';paint()};seek.oninput=()=>{base=Number(seek.value);started=performance.now();if(available)audio.currentTime=base;cancelAnimationFrame(raf);paint()};if(location.search.includes('export'))document.body.classList.add('export');

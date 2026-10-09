import timeline from '../timeline.json' with {type:'json'};
import {particles,bins,maxBin,frequencies,sampleSizes,theoreticalSD} from './model.js';
import {TAU,COUNT,clamp,mix,smooth,mod,hash,shape,composition,particleAt,samplingStage,project} from './choreography.js';

const canvas=document.getElementById('stage'),ctx=canvas.getContext('2d',{alpha:false}),W=canvas.width,H=canvas.height,D=timeline.duration,BEAT=60/timeline.bpm;
const world=document.createElement('canvas');world.width=W;world.height=H;const g=world.getContext('2d',{alpha:false});
const palette=['#ffb269','#64efcb','#7599ff','#f6e8d3'];let layerAlpha=1,letters=[],ready=false;
const sprites=palette.map(color=>{const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d'),r=x.createRadialGradient(24,24,0,24,24,24);r.addColorStop(0,'#fff');r.addColorStop(.08,color);r.addColorStop(.25,color+'bb');r.addColorStop(.55,color+'25');r.addColorStop(1,color+'00');x.fillStyle=r;x.fillRect(0,0,48,48);return c});
function speck(p){
  if(p.x < -80||p.x>W+80||p.y < -80||p.y>H+80||p.size<=0||p.alpha<.002)return;
  const size=p.size*6,left=p.x-size/2,top=p.y-size/2,q=p.colorMix||0;
  g.globalAlpha=clamp(p.alpha*(1-q));g.drawImage(sprites[p.color],left,top,size,size);
  if(q>0){g.globalAlpha=clamp(p.alpha*q);g.drawImage(sprites[p.color2],left,top,size,size)}
}
function stroke(ps,color=0,width=1,alpha=.4){if(!ps.length)return;g.globalAlpha=clamp(alpha*layerAlpha);g.strokeStyle=palette[color];g.lineWidth=width;g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke()}
function type(text,x,y,size=60,alpha=1,color=3,align='center',weight=700,target=g){target.save();target.globalAlpha=clamp(alpha*(target===g?layerAlpha:1));target.textAlign=align;target.textBaseline='middle';target.font=`${weight} ${size}px "Microsoft YaHei",sans-serif`;target.fillStyle=palette[color];target.fillText(text,x,y);target.restore()}
function ring(cx,cy,r,tilt=.4,color=0,alpha=.4){const ps=[];for(let i=0;i<=120;i++){const a=i/120*TAU;ps.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*tilt})}stroke(ps,color,1.4,alpha)}
function background(t){
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#050913';g.fillRect(0,0,W,H);g.globalAlpha=.04;g.drawImage(sprites[1],-20,-480,2050,2050);
  for(let i=0;i<210;i++){const a=hash(i+41)*TAU,dep=mod(hash(i+9)*1.1-t*.036,1),r=18+dep*dep*1100;stroke([{x:960+Math.cos(a)*r*1.65,y:520+Math.sin(a)*r},{x:960+Math.cos(a)*(r+dep*7)*1.65,y:520+Math.sin(a)*(r+dep*7)}],i%3,1,.22*dep)}
}
function geometry(s,t,alpha){
  if(alpha<.002)return;layerAlpha=alpha;const lt=clamp(t-s.start,0,s.end-s.start),d=s.end-s.start;
  if(s.id==='coin'){ring(960,520,465,.4,2,.35);ring(960,520,530,.6,0,.3)}
  if(s.id==='branches'){
    const growth=lt/d*16;
    for(let depth=0;depth<9;depth++){const n=2**depth,q=clamp(growth-depth);if(q<=0)continue;
      for(let j=0;j<n;j++)for(let side=0;side<2;side++){const a={x:155+depth*99,y:520+(j-(n-1)/2)*630/n},b={x:155+(depth+1)*99,y:520+(j*2+side-(n*2-1)/2)*630/(n*2)};stroke([a,{x:mix(a.x,b.x,q),y:mix(a.y,b.y,q)}],side,Math.max(.6,2-depth*.18),.18)}
    }
  }
  if(s.id==='galton')for(let row=0;row<16;row++)for(let col=0;col<=row;col++)speck({x:960+(col*2-row)*43,y:155+row*30,size:1.9,color:2,alpha:.55*alpha});
  if(s.id==='pile'){
    const height=mix(150,445,smooth(lt/2.1)),ps=[];
    for(let k=0;k<17;k++){const x=960+(k-8)*86;ps.push({x,y:805-bins[k]/maxBin*height});stroke([{x,y:811},{x,y:821}],3,1,.5);type(String(k),x,846,19,.7)}stroke(ps,3,1,.3);
  }
  if(s.id==='concentration'){
    const stage=samplingStage(lt),sd=mix(theoreticalSD[stage.from],theoreticalSD[stage.to],stage.q),w=sd*2450;
    stroke([{x:340,y:814},{x:1580,y:814}],3,1,.3);
    for(const value of [.25,.5,.75]){const x=960+(value-.5)*2450;stroke([{x,y:805},{x,y:825}],3,1,.65);type(value.toFixed(2),x,850,22,.85)}
    stroke([{x:960-w,y:800},{x:960-w,y:318}],1,1,.2);stroke([{x:960+w,y:800},{x:960+w,y:318}],0,1,.2);
    stroke([{x:960-w,y:345},{x:960+w,y:345}],3,2,.7);type('± 1 个标准差',960,318,24,.8);
    // Silk-like ribbons turn with the sample cloud while its x coordinates retain their meaning.
    for(let j=0;j<12;j++){
      const ps=[];for(let k=0;k<=90;k++){const z=(k/90-.5)*5.8,a=z*sd*18+lt*2.1+(j%2)*Math.PI;ps.push({x:960+z*w,y:548+Math.sin(a)*(141+Math.floor(j/2)*9.6)})}stroke(ps,j%2,1.1,.22);
    }
  }
  if(s.id==='ribbons'){
    const n=Math.floor(mix(12,1000,smooth(lt/(d-.3))));stroke([{x:170,y:565},{x:1760,y:565}],3,1,.35);
    frequencies.forEach((series,k)=>{const ps=[];for(let i=0;i<n;i+=2)ps.push({x:170+i/999*1590,y:565-(series[i]-.5)*480});stroke(ps,k%3,k===0?2:1,k===0?.8:.4)});
  }
  if(s.id==='wave')for(let row=0;row<60;row+=5){const ps=[];for(let i=row*80;i<(row+1)*80;i++)ps.push(shape(s,t,i,letters));stroke(ps,1,.8,.12)}
  layerAlpha=1;
}
function annotations(s,t,alpha){
  if(alpha<.002)return;layerAlpha=alpha;const lt=clamp(t-s.start,0,s.end-s.start),d=s.end-s.start;
  switch(s.id){
    case'ignition':{const phase=lt/BEAT,index=Math.min(3,Math.floor(phase/2)),q=mod(phase,2),e=1-(1-clamp(q/.28))**4;type(['如果','世界','掷出','一枚硬币'][index],960,505+45*(1-e),(index===3?144:210)*(1+.35*(1-e)),smooth(q/.13));type('ONE CHANCE. INFINITE PATHS.',960,710,24,.7,0);break}
    case'coin':type('0',440,510,180,.9,1);type('1',1480,510,180,.9,0);type('反面 · 1/2',440,660,28,.9,1);type('正面 · 1/2',1480,660,28,.9,0);type('一切，始于两种可能。',960,205,55,1);break;
    case'branches':type('路径，成倍生长。',120,170,70,1,3,'left');type('2¹⁶ = 65,536',120,260,40,.9,0,'left');break;
    case'galton':type('路径不同',115,340,63,1,3,'left');type('终点可同。',115,425,72,1,0,'left');type('16 次独立选择',1490,255,27,.9,3,'left');type('左右各 1/2',1490,305,26,.7,1,'left');break;
    case'pile':{
      type('中间，为何更高？',960,165,74,1);const reveal=smooth((lt-1.1)/.8);
      type('8 次向右',960,272,28,reveal,1);type('12,870 条路径',960,321,38,reveal,0);
      type('全向右',1550,430,27,reveal);type('只有 1 条',1550,477,32,reveal,0);
      stroke([{x:1510,y:520},{x:1640,y:790}],0,1,.4*reveal);break;
    }
    case'concentration':{
      const st=samplingStage(lt),moving=st.from!==st.to,label=moving?`${sampleSizes[st.from]} → ${sampleSizes[st.to]}`:String(sampleSizes[st.from]);
      type('重复更多，波动更小。',120,165,66,1,3,'left');type(`每组试验  n = ${label}`,120,259,31,1,0,'left');
      type('σ = 1 / (2√n)',1770,170,34,.9,1,'right');
      type(moving?'次数 ×4  ·  标准差 ÷2':`σ = ${theoreticalSD[st.from].toFixed(4)}`,1770,245,29,.85,3,'right');
      type('每个光点 = 一组试验的正面频率',120,850,24,.7,3,'left');break;
    }
    case'ribbons':{
      const n=Math.floor(mix(12,1000,smooth(lt/(d-.3))));type('靠近，不等于直达。',120,180,73,1,3,'left');type('每条路径仍会起伏。',120,274,39,.9,1,'left');type('0.50',1780,565,25,.85);type(`独立试验  ${String(n).padStart(4,'0')} 次`,1740,795,29,.8,3,'right');type('12 组真实采样轨迹',120,795,25,.65,3,'left');break;
    }
    case'wave':type('局部，依然起伏。',140,178,72,1,3,'left');type('整体，逐渐清晰。',140,275,51,1,0,'left');break;
    case'orbit':{
      type('下一次，仍各占一半。',960,185,60,1);for(let i=0;i<5;i++)type('正',720+i*120,282,29,.22+.1*i,0);type('1/2',960,500,132,1);type('独立，不记得过去。',960,684,35,.9,1);break;
    }
    case'vortex':if(lt<1.5)type('汇聚',960,505,165,1-smooth((lt-.6)/.8));break;
    case'finale':type('随机汇聚成规律',960,505,168,.9*smooth((lt-.4)/.8)*(1-smooth((lt-2.8)/1)*.6),3,'center',900);type('让不确定，显露形状。',960,685,40,smooth((lt-.3)/.7));type('CONCEPT MOTION LAB / PROBABILITY STUDIES',960,795,21,.6*smooth((lt-.7)/.6),1,'center',400);break;
  }layerAlpha=1;
}
function drawWorld(t){
  background(t);const c=composition(t,timeline);g.globalCompositeOperation='lighter';
  geometry(c.a,t,1-c.q);if(c.b)geometry(c.b,t,c.q);
  const trail=c.b||['ignition','concentration','vortex'].includes(c.a.id);
  for(let i=0;i<COUNT;i++){
    const p=particleAt(t,i,timeline,letters);if(trail&&i%9===0){const old=particleAt(Math.max(0,t-.045),i,timeline,letters);if(Math.hypot(p.x-old.x,p.y-old.y)<220)stroke([old,p],p.color,1,.28*p.alpha)}speck(p);
  }
  g.globalCompositeOperation='source-over';
  annotations(c.a,t,c.b?1-smooth(c.q/.5):1);if(c.b)annotations(c.b,t,smooth((c.q-.5)/.5));
  g.globalAlpha=1;layerAlpha=1;
}
function overlay(t){
  const s=timeline.scenes.find(x=>t>=x.start&&t<x.end)||timeline.scenes.at(-1),lt=t-s.start;
  const shade=ctx.createLinearGradient(0,875,0,H);shade.addColorStop(0,'#05091300');shade.addColorStop(.3,'#050913e8');shade.addColorStop(1,'#050913ff');ctx.fillStyle=shade;ctx.fillRect(0,875,W,205);
  const a=smooth(lt/.3)*smooth((s.end-t)/.3);type(s.label,95,927,22,.8*a,0,'left',500,ctx);type(s.caption,95,986,31,a,3,'left',500,ctx);type('C / M',1815,72,21,.5,3,'right',700,ctx);
  ctx.globalAlpha=.55;ctx.fillStyle=palette[0];ctx.fillRect(95,1040,(W-190)*t/D,2);ctx.globalAlpha=1;
  const fade=smooth((D-t)/.65);if(fade<1){ctx.fillStyle=`rgba(5,9,19,${1-fade})`;ctx.fillRect(0,0,W,H)}
}
function frame(t,capture=false){
  t=clamp(t,0,D-.0001);const samples=capture?2:1;
  for(let k=0;k<samples;k++){const tk=clamp(t+((k+.5)/samples-.5)*.32/timeline.fps,0,D-.0001);drawWorld(tk);ctx.globalAlpha=1/(k+1);ctx.drawImage(world,0,0)}ctx.globalAlpha=1;overlay(t);return capture?canvas.toDataURL('image/jpeg',.95):undefined;
}
function makeLetters(){const c=document.createElement('canvas');c.width=W;c.height=H;const m=c.getContext('2d');m.fillStyle='white';m.textAlign='center';m.textBaseline='middle';m.font='900 168px "Microsoft YaHei",sans-serif';m.fillText('随机汇聚成规律',960,505);const data=m.getImageData(0,0,W,H).data;for(let y=360;y<650;y+=5)for(let x=270;x<1650;x+=5)if(data[(y*W+x)*4+3]>120)letters.push({x,y})}
document.fonts.load('900 168px "Microsoft YaHei"','随机汇聚成规律').then(()=>document.fonts.ready).then(()=>{makeLetters();ready=true;frame(0)});
window.__frame=t=>frame(t,true);window.__ready=()=>ready;window.__duration=D;window.__cues=()=>timeline.cues;
window.__diagnostics=()=>({version:3,particles:COUNT,titleParticles:letters.length,scenes:timeline.scenes.length,bpm:timeline.bpm,duration:D,transitionSeconds:timeline.transition_half_duration*2});
window.__transitionCheck=()=>timeline.scenes.slice(1).flatMap(s=>[-timeline.transition_half_duration,0,timeline.transition_half_duration].map(offset=>{const t=s.start+offset;let max=0;for(let i=0;i<COUNT;i++){const a=particleAt(t-.00001,i,timeline,letters),b=particleAt(t+.00001,i,timeline,letters);max=Math.max(max,Math.hypot(a.x-b.x,a.y-b.y))}return{at:t,maxDisplacement:max}}));

const audio=document.getElementById('audio'),toggle=document.getElementById('toggle'),seek=document.getElementById('seek'),clock=document.getElementById('clock');seek.max=String(D);
let playing=false,raf=0,silentBase=0,silentStart=0,audioAvailable=false;audio.addEventListener('canplay',()=>audioAvailable=true);
const current=()=>playing?(audioAvailable?audio.currentTime:silentBase+(performance.now()-silentStart)/1000):Number(seek.value);
const stamp=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
clock.textContent=`00:00 / ${stamp(D)}`;
function paint(){const t=clamp(current(),0,D);frame(t);seek.value=String(t);clock.textContent=`${stamp(t)} / ${stamp(D)}`;if(playing&&t<D)raf=requestAnimationFrame(paint);else if(t>=D){playing=false;audio.pause();toggle.textContent='重播'}}
toggle.onclick=async()=>{if(playing){seek.value=String(clamp(current(),0,D));playing=false;audio.pause();cancelAnimationFrame(raf);toggle.textContent='播放';return}if(Number(seek.value)>=D-.01)seek.value='0';silentBase=Number(seek.value);silentStart=performance.now();playing=true;if(audioAvailable){audio.currentTime=silentBase;try{await audio.play()}catch{audioAvailable=false;silentStart=performance.now()}}toggle.textContent='暂停';cancelAnimationFrame(raf);paint()};
seek.oninput=()=>{silentBase=Number(seek.value);silentStart=performance.now();if(audioAvailable)audio.currentTime=silentBase;cancelAnimationFrame(raf);paint()};
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();toggle.click()}if(e.code==='ArrowRight'||e.code==='ArrowLeft'){seek.value=String(clamp(Number(seek.value)+(e.code==='ArrowRight'?1:-1),0,D));seek.oninput()}});
if(new URLSearchParams(location.search).has('export'))document.body.classList.add('export');

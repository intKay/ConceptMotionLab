import timeline from '../timeline.json' with { type: 'json' };
import { particles, bins, maxBin, frequencies, expected, levels } from './model.js';

const canvas = document.getElementById('stage'), ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height, TAU = Math.PI * 2, BEAT = 60 / timeline.bpm;
const world = document.createElement('canvas'); world.width = W; world.height = H;
const g = world.getContext('2d', { alpha: false });
const palette = ['#ffb269', '#64efcb', '#7599ff', '#f6e8d3'];
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const mix = (a,b,t) => a+(b-a)*t;
const smooth = v => { v=clamp(v); return v*v*(3-2*v); };
const expo = v => 1-Math.pow(1-clamp(v),4);
const mod = (v,n) => (v%n+n)%n;
const pulse = t => Math.exp(-mod(t,BEAT)/.09);
const hash = n => { const x=Math.sin(n*127.1+78.233)*43758.5453; return x-Math.floor(x); };

// Pre-baked glows avoid thousands of expensive shadowBlur operations per frame.
const sprites = palette.map(color => {
  const c=document.createElement('canvas'); c.width=c.height=48;
  const x=c.getContext('2d'),r=x.createRadialGradient(24,24,0,24,24,24);
  r.addColorStop(0,'#ffffff');r.addColorStop(.08,color);r.addColorStop(.25,color+'bb');r.addColorStop(.55,color+'25');r.addColorStop(1,color+'00');
  x.fillStyle=r;x.fillRect(0,0,48,48);return c;
});
function speck(x,y,size=3,color=0,alpha=1){
  if(x < -80 || x > W+80 || y < -80 || y > H+80 || size<=0)return;
  g.globalAlpha=clamp(alpha);g.drawImage(sprites[color%4],x-size*3,y-size*3,size*6,size*6);
}
function stroke(points,color=0,width=1,alpha=.4){
  if(!points.length)return;g.globalAlpha=clamp(alpha);g.strokeStyle=palette[color%4];g.lineWidth=width;g.beginPath();
  points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();
}
function type(text,x,y,size=60,alpha=1,color=3,align='center',weight=700,target=g){
  target.save();target.globalAlpha=clamp(alpha);target.textAlign=align;target.textBaseline='middle';
  target.font=`${weight} ${size}px "Microsoft YaHei",sans-serif`;target.fillStyle=palette[color%4];target.fillText(text,x,y);target.restore();
}
function project(x,y,z,ry=0,rx=0,zoom=1,cx=960,cy=520){
  const xx=x*Math.cos(ry)+z*Math.sin(ry),zz=z*Math.cos(ry)-x*Math.sin(ry);
  const yy=y*Math.cos(rx)-zz*Math.sin(rx),zzz=y*Math.sin(rx)+zz*Math.cos(rx);
  const s=1100/Math.max(180,1450+zzz)*zoom;
  return {x:cx+xx*s,y:cy+yy*s,s,z:zzz};
}
function glow(x,y,r,color=0,alpha=.15){g.globalAlpha=alpha;g.drawImage(sprites[color],x-r,y-r,r*2,r*2)}
function ring(cx,cy,r,t,color=0,alpha=.4,tilt=.45){
  const ps=[];for(let i=0;i<=130;i++){const a=i/130*TAU;ps.push({x:cx+Math.cos(a+t)*r,y:cy+Math.sin(a+t)*r*tilt})}stroke(ps,color,1.6,alpha);
}
function stars(t,speed=.3,alpha=.4){
  for(let i=0;i<280;i++){
    const a=hash(i+41)*TAU,depth=mod(hash(i+9)*1.1-t*speed*.13,1),r=18+depth*depth*1150;
    const x=960+Math.cos(a)*r*1.65,y=520+Math.sin(a)*r;
    const tail=(.5+speed*3)*depth;
    stroke([{x,y},{x:x+Math.cos(a)*tail*5,y:y+Math.sin(a)*tail*5}],i%3,1,alpha*depth);
  }
}
function background(t,id){
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#050913';g.fillRect(0,0,W,H);
  const c=id==='city'?2:id==='wave'?1:0;glow(1050+Math.sin(t*.3)*220,520,950,c,.045);
  stars(t,id==='ignition'||id==='vortex'?2.4:.23,.3);
}
function sceneAt(t){return timeline.scenes.find(s=>t>=s.start&&t<s.end)||timeline.scenes.at(-1)}

function ignition(t,lt,d){
  const phase=lt/BEAT,zoom=1+.06*pulse(t),exp=expo((lt-.25)/1.4);
  glow(960,510,450,0,.28);g.globalCompositeOperation='lighter';
  for(let i=0;i<particles.length;i++){
    const p=particles[i],radius=(80+p.u*980)*exp,angle=p.a+lt*.18*(p.v-.5);
    const x=960+Math.cos(angle)*radius*zoom,y=510+Math.sin(angle)*radius*.63*zoom;
    if(i%8===0)stroke([{x:mix(960,x,.84),y:mix(510,y,.84)},{x,y}],i%3,1.2,.22);
    speck(x,y,(.8+p.w*2.4)*(1+.4*pulse(t)),i%7===0?1:0,.55);
  }
  g.globalCompositeOperation='source-over';
  const words=['如果','世界','掷出','一枚硬币']; const index=Math.min(3,Math.floor(phase/2));
  const q=mod(phase,2),e=expo(q/.28),size=(index===3?144:210)*(1+.35*(1-e));
  type(words[index],960,505+45*(1-e),size,smooth(q/.13),3);
  type('ONE CHANCE. INFINITE PATHS.',960,710,24,.7,0);
}
function coin(t,lt,d){
  const rot=lt*3.6+Math.sin(lt*2)*.3;g.globalCompositeOperation='lighter';
  ring(960,520,465,t*.25,2,.5,.4);ring(960,520,530,-t*.2,0,.4,.6);
  for(let i=0;i<particles.length;i++){
    const p=particles[i],r=Math.sqrt(p.u)*280,a=p.a,side=i%2?1:-1;
    const point=project(Math.cos(a)*r,Math.sin(a)*r,side*13,rot,-.2,1.35);
    speck(point.x,point.y,1.7*point.s,side===1?0:1,.5+.35*p.w);
  }
  g.globalCompositeOperation='source-over';
  type('0',440,510,190,.9,1);type('1',1480,510,190,.9,0);
  type('反面',440,660,32,.9,1);type('正面',1480,660,32,.9,0);
  type('一切，始于两种可能。',960,200,55,expo(lt*4),3);
}
function branches(t,lt,d){
  const grow=lt/d*10,levels=9;g.save();g.translate(960,510);g.rotate(-.18+.12*smooth(lt/d));g.translate(-960,-510);
  g.globalCompositeOperation='lighter';
  for(let depth=0;depth<levels;depth++){
    const a=clamp(grow-depth);if(!a)continue;const n=2**depth;
    for(let j=0;j<n;j++){
      const x1=180+depth*170,y1=520+(j-(n-1)/2)*650/n;
      for(let side=0;side<2;side++){
        const x2=x1+170,y2=520+(j*2+side-(n*2-1)/2)*650/(n*2);
        stroke([{x:x1,y:y1},{x:mix(x1,x2,a),y:mix(y1,y2,a)}],side,Math.max(.6,3-depth*.3),.25+.25*a);
        speck(mix(x1,x2,a),mix(y1,y2,a),2.5-depth*.17,side,.8);
      }
    }
  }
  for(let k=0;k<420;k++){
    const depth=mod(lt*3+hash(k)*9,9),level=Math.floor(depth),n=2**level,j=Math.floor(hash(k+100)*n),side=hash(k+900)>.5?1:0;
    const f=depth-level,x=180+depth*170,y1=520+(j-(n-1)/2)*650/n,y2=520+(j*2+side-(n*2-1)/2)*650/(n*2);
    speck(x,mix(y1,y2,f),2,k%2,.7);
  }
  g.restore();type('可能性，成倍生长。',120,200,68,expo(lt*4),3,'left');
  type('2 × 2 × 2 × 2 × …',120,290,34,.75,0,'left');
}
const pinPoint=(step,balance)=>({x:960+balance*43,y:155+step*30});
function galton(t,lt,d){
  g.globalCompositeOperation='lighter';
  for(let row=0;row<16;row++)for(let col=0;col<=row;col++){
    const p=pinPoint(row,col*2-row);speck(p.x,p.y,2.1,2,.65);
  }
  for(let i=0;i<particles.length;i++){
    const p=particles[i],age=lt-p.u*4.8;if(age<0)continue;
    const step=age*8.5,j=Math.min(15,Math.floor(step)),f=clamp(step-j);
    let point;
    if(step<16){const a=pinPoint(j,p.path[j]),b=pinPoint(j+1,p.path[j+1]);point={x:mix(a.x,b.x,f),y:mix(a.y,b.y,f)-Math.sin(f*Math.PI)*10};
      if(i%4===0)stroke([{x:point.x-(b.x-a.x)*.3,y:point.y-9},point],p.successes<8?1:0,1,.28);
    }else{point={x:960+(p.successes-8)*86+(p.v-.5)*67,y:798-p.rank/maxBin*115};}
    speck(point.x,point.y,1.7,p.successes<8?1:0,.8);
  }
  g.globalCompositeOperation='source-over';
  type('把偶然',115,340,66,1,3,'left');type('重复。',115,425,100,1,0,'left');
  type('16 次左右选择',1500,265,28,.85,3,'left');type('每一步：P = ½',1500,315,23,.6,3,'left');
}
function pile(t,lt,d){
  const rise=expo(lt/2.4),camera=1+.08*smooth(lt/d);g.save();g.translate(960,500);g.scale(camera,camera);g.translate(-960,-500);
  g.globalCompositeOperation='lighter';
  for(const p of particles){
    const x=960+(p.successes-8)*86+(p.v-.5)*68;
    const y=805-p.rank/maxBin*445*rise+(1-rise)*Math.sin(p.a+lt*6)*110;
    speck(x,y,1.8+p.w*.6,p.successes<8?1:0,.7);
  }
  const top=[];for(let k=0;k<17;k++){const x=960+(k-8)*86;top.push({x,y:805-bins[k]/maxBin*445*rise});
    stroke([{x,y:810},{x,y:821}],3,1,.4);type(String(k),x,847,18,.65,3);
  }stroke(top,3,1.4,.48);
  g.restore();type('无数次偶然',960,190,88,expo(lt*3),3);type('堆出一个形状。',960,288,48,expo((lt-.35)*3),0);
  type('向右的次数  →',1660,875,19,.65,3,'right');
}
function city(t,lt,d){
  const ry=-.62+lt*.18,rx=.5;g.globalCompositeOperation='lighter';
  for(let row=0;row<28;row++){
    const depth=(row-14)*38,points=[];
    for(let k=0;k<17;k++){
      const x=(k-8)*90,h=expected[k]/expected[8]*430,shape=Math.exp(-(((row-14)/11)**2));
      const p=project(x,260-h*shape,depth,ry,rx,1.55,960,535);points.push(p);
      const base=project(x,260,depth,ry,rx,1.55,960,535);if(row%3===0)stroke([base,p],k<8?1:0,.8,.15);
      speck(p.x,p.y,2.1*p.s,k<8?1:0,.8);
    }stroke(points,row%3===0?0:1,1.1,.42);
  }
  for(let k=0;k<17;k++){
    const ps=[];for(let row=0;row<28;row++){const h=expected[k]/expected[8]*430*Math.exp(-(((row-14)/11)**2));ps.push(project((k-8)*90,260-h,(row-14)*38,ry,rx,1.55,960,535))}stroke(ps,2,1,.3);
  }
  g.globalCompositeOperation='source-over';type('概率，也有地形。',120,190,76,1,3,'left');type('X ~ Binomial(16, ½)',125,280,30,.9,1,'left');
}
function ribbons(t,lt,d){
  const draw=Math.floor(mix(6,1000,smooth(lt/(d-.4)))),x0=170,x1=1760,y0=565;
  stroke([{x:x0,y:y0},{x:x1,y:y0}],3,1,.5);type('0.50',1780,y0,25,.85,3);
  g.globalCompositeOperation='lighter';
  frequencies.forEach((series,k)=>{
    const ps=[];for(let i=0;i<draw;i+=2){const x=mix(x0,x1,i/999),y=y0-(series[i]-.5)*480;ps.push({x,y})}
    stroke(ps,k%3,k===0?3:1.2,k===0?.9:.42);
    const last=ps.at(-1);if(last)speck(last.x,last.y,k===0?4:2.2,k%3,.9);
    for(let i=0;i<60;i++){const j=Math.floor(mod(i*17+lt*130+k*51,draw)),x=mix(x0,x1,j/999),y=y0-(series[j]-.5)*480;speck(x,y,1.5,k%3,.6)}
  });g.globalCompositeOperation='source-over';
  type('各自波动。',120,175,78,1,3,'left');type('趋向同一处。',120,275,60,1,1,'left');
  type(`独立试验  ${String(draw).padStart(4,'0')} 次`,1740,780,30,.8,3,'right');
  type('12 组独立试验的正面频率',120,780,25,.6,3,'left');
}
function orbit(t,lt,d){
  const ry=lt*.7,rx=.35+lt*.14;g.globalCompositeOperation='lighter';
  for(const p of particles){
    const a=p.a+t*.7,r=285+50*Math.sin(p.u*TAU*4+t),h=(p.v-.5)*150;
    const pt=project(Math.cos(a)*r,h,Math.sin(a)*r,ry,rx,1.9);
    speck(pt.x,pt.y,(1+p.w*1.6)*pt.s,p.i%3,.72);
    if(p.i%25===0){const q=project(Math.cos(a-.13)*r,h,Math.sin(a-.13)*r,ry,rx,1.9);stroke([q,pt],p.i%3,1,.25)}
  }
  g.globalCompositeOperation='source-over';
  type('下一次？',960,515,116,1,3);type('依然未知。',960,680,38,.8,0);
}
function wave(t,lt,d){
  const ry=-.25+lt*.11,rx=.54;g.globalCompositeOperation='lighter';
  for(let row=0;row<55;row++){
    const ps=[];for(let col=0;col<85;col++){
      const x=(col-42)*23,z=(row-27)*23,phase=x*.008+z*.004-lt*2.7;
      const envelope=Math.exp(-x*x/440000-z*z/280000);
      const y=-190*envelope-75*Math.sin(phase)*Math.sin(lt*.7+row*.09);
      const pt=project(x,y,z,ry,rx,1.25,960,600);ps.push(pt);
      speck(pt.x,pt.y,(1.2+envelope*1.6)*pt.s,(col+row)%8===0?0:row<27?1:2,.6);
    }if(row%4===0)stroke(ps,1,.8,.15);
  }
  g.globalCompositeOperation='source-over';type('不确定',140,180,91,1,3,'left');type('也能被理解。',140,285,64,1,0,'left');
}
let letterPoints=[];
function makeLetters(){
  const mask=document.createElement('canvas');mask.width=W;mask.height=H;const m=mask.getContext('2d');
  m.fillStyle='white';m.textAlign='center';m.textBaseline='middle';m.font='900 168px "Microsoft YaHei",sans-serif';m.fillText('随机汇聚成规律',960,505);
  const data=m.getImageData(0,0,W,H).data,all=[];
  for(let y=360;y<650;y+=5)for(let x=270;x<1650;x+=5)if(data[(y*W+x)*4+3]>120)all.push({x,y});
  letterPoints=all;
}
function vortex(t,lt,d){
  const collapse=smooth(lt/d),turn=lt*2.4;
  g.globalCompositeOperation='lighter';
  for(let i=0;i<letterPoints.length;i++){
    const a=hash(i+24)*TAU+turn*(1+hash(i+42)*.4),r=120+hash(i+6)*1300;
    const depth=hash(i+18),x=960+Math.cos(a)*r,y=510+Math.sin(a)*r*.65;
    const target=letterPoints[i],q=collapse*collapse;
    const xx=mix(x,target.x,q),yy=mix(y,target.y,q);
    speck(xx,yy,.9+depth*1.5,i%6===0?1:0,.7);
    if(i%17===0)stroke([{x:xx-Math.sin(a)*(1-q)*32,y:yy+Math.cos(a)*(1-q)*22},{x:xx,y:yy}],0,1,.35);
  }
  g.globalCompositeOperation='source-over';
  if(lt<1.7)type('汇聚',960,510,190,1-smooth((lt-.8)/.7),3);
}
function finale(t,lt,d){
  const explode=smooth((lt-3.55)/1.0)*.23,calm=1-smooth(lt/.4);
  g.globalCompositeOperation='lighter';
  for(let i=0;i<letterPoints.length;i++){
    const p=letterPoints[i],a=hash(i+24)*TAU,r=(100+hash(i+6)*1000)*explode;
    const x=p.x+Math.cos(a)*r+Math.sin(t*3+i)*calm*5,y=p.y+Math.sin(a)*r*.7;
    speck(x,y,1.2+hash(i)*.8,i%5===0?1:0,.8*(1-explode));
  }
  for(let i=0;i<500;i++){
    const a=hash(i+8)*TAU+t*.15,r=480+hash(i+3)*580;
    speck(960+Math.cos(a)*r,510+Math.sin(a)*r*.5,1+hash(i)*1.7,i%3,.25);
  }
  g.globalCompositeOperation='source-over';
  type('随机汇聚成规律',960,505,168,.9*smooth((lt-.4)/.9)*(1-explode*3),3,undefined,900);
  type('让不确定，显露形状。',960,685,40,smooth((lt-.5)/.6),3);
  type('CONCEPT MOTION LAB  /  PROBABILITY STUDIES',960,795,21,.6*smooth((lt-.9)/.8),1,undefined,400);
}
const painters={ignition,coin,branches,galton,pile,city,ribbons,orbit,wave,vortex,finale};

function drawWorld(t){
  const scene=sceneAt(t),lt=t-scene.start,d=scene.end-scene.start;
  background(t,scene.id);g.save();
  const accent=(scene.id==='ignition'||scene.id==='orbit'||scene.id==='vortex')?.012:0;
  const z=1+accent*pulse(t);g.translate(W/2,H/2);g.scale(z,z);g.translate(-W/2,-H/2);
  painters[scene.id](t,lt,d);g.restore();g.globalAlpha=1;g.globalCompositeOperation='source-over';
  // A travelling luminous shutter motivates the cut without blank frames.
  if(lt<.16&&scene.start>0){const x=mix(-300,2200,lt/.16);const grad=g.createLinearGradient(x-280,0,x+120,0);grad.addColorStop(0,'#ffb26900');grad.addColorStop(.75,'#ffb26925');grad.addColorStop(1,'#ffb26900');g.fillStyle=grad;g.fillRect(x-280,0,400,H)}
}
function overlays(t){
  const s=sceneAt(t),lt=t-s.start;
  const shade=ctx.createLinearGradient(0,840,0,H);shade.addColorStop(0,'#05091300');shade.addColorStop(.4,'#050913e8');shade.addColorStop(1,'#050913ff');ctx.fillStyle=shade;ctx.fillRect(0,840,W,240);
  type(s.label,95,927,22,.8,0,'left',500,ctx);
  type(s.caption,95,986,34,smooth(lt/.18),3,'left',500,ctx);
  type('C / M',1815,72,21,.5,3,'right',700,ctx);
  ctx.globalAlpha=.55;ctx.fillStyle=palette[0];ctx.fillRect(95,1040,(W-190)*t/45,2);ctx.globalAlpha=1;
  const fade=smooth((45-t)/.65);if(fade<1){ctx.fillStyle=`rgba(5,9,19,${1-fade})`;ctx.fillRect(0,0,W,H)}
}
function frame(t,capture=false){
  t=clamp(t,0,timeline.duration-.0001);const samples=capture?2:1,scene=sceneAt(t);
  for(let k=0;k<samples;k++){
    let tk=t+((k+.5)/samples-.5)*.32/timeline.fps;tk=clamp(tk,0,44.9999);if(sceneAt(tk)!==scene)tk=t;
    drawWorld(tk);ctx.globalAlpha=1/(k+1);ctx.drawImage(world,0,0);
  }ctx.globalAlpha=1;overlays(t);return capture?canvas.toDataURL('image/jpeg',.95):undefined;
}
let ready=false;
document.fonts.load('900 168px "Microsoft YaHei"','随机汇聚成规律').then(()=>document.fonts.ready).then(()=>{makeLetters();ready=true;frame(0)});
window.__frame=t=>frame(t,true);window.__ready=()=>ready;window.__duration=timeline.duration;window.__cues=()=>timeline.cues;
window.__diagnostics=()=>({version:2,particles:particles.length,titleParticles:letterPoints.length,bins,levels,scenes:timeline.scenes.length,bpm:timeline.bpm});

const audio=document.getElementById('audio'),toggle=document.getElementById('toggle'),seek=document.getElementById('seek'),clock=document.getElementById('clock');
let playing=false,raf=0,silentBase=0,silentStart=0,audioAvailable=false;
audio.addEventListener('canplay',()=>audioAvailable=true);
const currentTime=()=>playing?(audioAvailable?audio.currentTime:silentBase+(performance.now()-silentStart)/1000):Number(seek.value);
function paint(){const t=clamp(currentTime(),0,45);frame(t);seek.value=String(t);clock.textContent=`00:${String(Math.floor(t)).padStart(2,'0')} / 00:45`;if(playing&&t<45)raf=requestAnimationFrame(paint);else if(t>=45){playing=false;audio.pause();toggle.textContent='重播'}}
toggle.onclick=async()=>{
  if(playing){seek.value=String(clamp(currentTime(),0,45));playing=false;audio.pause();cancelAnimationFrame(raf);toggle.textContent='播放';return}
  if(Number(seek.value)>=44.99)seek.value='0';silentBase=Number(seek.value);silentStart=performance.now();playing=true;
  if(audioAvailable){audio.currentTime=silentBase;try{await audio.play()}catch{audioAvailable=false;silentStart=performance.now()}}
  toggle.textContent='暂停';cancelAnimationFrame(raf);paint();
};
seek.oninput=()=>{silentBase=Number(seek.value);silentStart=performance.now();if(audioAvailable)audio.currentTime=silentBase;cancelAnimationFrame(raf);paint()};
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();toggle.click()}if(e.code==='ArrowRight'||e.code==='ArrowLeft'){seek.value=String(clamp(Number(seek.value)+(e.code==='ArrowRight'?1:-1),0,45));seek.oninput()}});
if(new URLSearchParams(location.search).has('export'))document.body.classList.add('export');

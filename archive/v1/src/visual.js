import timeline from '../timeline.json' with { type: 'json' };

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = timeline.width, H = timeline.height, TAU = Math.PI * 2;
const C = { bg:'#07101c', panel:'#0d1c2b', bone:'#f2eee5', muted:'#9ab0ba', signal:'#ffae79', mint:'#7be2c6', grid:'#274052' };
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth = x=>{x=clamp(x);return x*x*(3-2*x)};
const ease = x=>1-Math.pow(1-clamp(x),3);
const hash = n=>{let x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x)};
const fade = (t,a,b,fi=.35,fo=.35)=>smooth((t-a)/fi)*smooth((b-t)/fo);
const lerp=(a,b,p)=>a+(b-a)*p;
const fmt=x=>String(Math.floor(x)).padStart(2,'0');

const trials=Array.from({length:500},(_,i)=>hash(i*13+3)<.5?1:0);
const prefix=[0]; for(const x of trials) prefix.push(prefix.at(-1)+x);
const normal=Array.from({length:1800},(_,i)=>Math.sqrt(-2*Math.log(Math.max(1e-8,hash(i*7+30))))*Math.cos(TAU*hash(i*11+59)));
const bins=Array(33).fill(0); for(const x of normal){const j=Math.floor((x+3.3)/6.6*bins.length);if(j>=0&&j<bins.length)bins[j]++}
const maxBin=Math.max(...bins);

const bgCanvas=document.createElement('canvas');bgCanvas.width=W;bgCanvas.height=H;
const gl=bgCanvas.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false});
let bgRender=null;
if(gl){
  const vs=`#version 300 es\n in vec2 pos; out vec2 uv; void main(){uv=(pos+1.)*.5;gl_Position=vec4(pos,0.,1.);}`;
  const fs=`#version 300 es\n precision highp float; in vec2 uv; out vec4 color; uniform float time; uniform float phase;
    float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec2 p=uv*2.-1.;p.x*=1.77778;float r=length(p);float line=sin((r*11.-time*.18)*6.28318);float ring=pow(max(0.,line),22.)*.045;
      float grid=(1.-smoothstep(.0,.015,abs(fract(p.x*12.)-.5)))*.008+(1.-smoothstep(.0,.015,abs(fract(p.y*12.)-.5)))*.008;
      vec2 cell=floor(uv*vec2(180.,100.));float star=step(.997,hash2(cell))*pow(max(0.,sin(time*.4+hash2(cell)*6.28)),6.)*.24;
      float vign=1.-smoothstep(.1,1.65,r);vec3 base=mix(vec3(.01,.035,.07),vec3(.025,.08,.12),vign);
      vec3 tint=mix(vec3(.25,.5,.7),vec3(.3,.68,.56),phase);color=vec4(base+tint*(ring+grid+star),1.);}`;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(program);const loc=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const ut=gl.getUniformLocation(program,'time'),up=gl.getUniformLocation(program,'phase');
  bgRender=(t)=>{gl.viewport(0,0,W,H);gl.uniform1f(ut,t);gl.uniform1f(up,t/45);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);ctx.drawImage(bgCanvas,0,0)};
}
function background(t){
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
  if(bgRender)bgRender(t);
  else {const g=ctx.createRadialGradient(950,480,100,950,480,1300);g.addColorStop(0,'#123047');g.addColorStop(1,C.bg);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  ctx.strokeStyle='rgba(120,180,195,.055)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=120){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
  for(let y=0;y<H;y+=120){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
}
function text(str,x,y,size=40,color=C.bone,align='left',weight=400,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.font=`${weight} ${size}px "Microsoft YaHei",sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.restore()}
function line(x1,y1,x2,y2,color=C.grid,width=2,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore()}
function dot(x,y,r,color=C.signal,glow=12,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}
function panel(x,y,w,h,alpha=.7){ctx.fillStyle=`rgba(9,22,36,${alpha})`;ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(122,208,204,.22)';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h)}
function title(s,sub,t,p){text(s,120,205,86,C.bone,'left',700,fade(p,0,1,.12,.13));text(sub,124,275,26,C.mint,'left',400,fade(p,0,1,.16,.14));line(120,315,650,315,C.signal,4,fade(p,0,1,.2,.1))}
function marker(t){const x=95+(W-190)*t/45;line(95,1015,W-95,1015,C.grid,2);line(95,1015,x,1015,C.signal,3);dot(x,1015,5,C.signal,14);text('CONCEPT MOTION LAB',95,63,20,C.muted,'left',700);text('PROBABILITY / 001',W-95,63,19,C.muted,'right',400)}
function caption(scene,t){const a=fade(t,scene.start+.25,scene.end-.15,.45,.4);text(scene.label,120,830,23,C.signal,'left',700,a);text(scene.caption,120,890,43,C.bone,'left',600,a)}
function sceneChaos(t,s){const p=(t-s.start)/(s.end-s.start);title('随机，从一个点开始','ONE EVENT / MANY POSSIBILITIES',t,p);
  const reveal=ease((t-.6)/2);for(let i=0;i<210;i++){const a=hash(i*3+8)*TAU,rad=70+hash(i*5+13)*750*reveal;const x=960+Math.cos(a)*rad+Math.sin(t*.7+i)*9,y=550+Math.sin(a)*rad*.52+Math.cos(t*.8+i)*9;dot(x,y,1.2+hash(i+50)*2,i%7===0?C.signal:C.mint,8,.18+.55*reveal)}
  const r=80+480*ease((t-1)/4);ctx.save();ctx.strokeStyle='rgba(255,174,121,.36)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(960,550,r,0,TAU);ctx.stroke();ctx.restore();dot(960,550,9,C.signal,30);
  text('?',960,555,190,C.bone,'center',700,fade(t,0,6.9,.8,.8));}
function sceneTrials(t,s){const p=(t-s.start)/(s.end-s.start);title('重复，让偶然留下痕迹','REPEAT THE EXPERIMENT',t,p);panel(790,345,990,435,.55);
  const n=Math.min(90,Math.floor(ease(p)*90));const cols=15;for(let i=0;i<n;i++){const x=845+(i%cols)*62,y=395+Math.floor(i/cols)*50;const v=trials[i];dot(x,y,14,v?C.signal:C.mint,15,.8);text(v?'正':'反',x,y,18,C.bg,'center',700,.95)}
  const ratio=n?prefix[n]/n:0;text('N = '+String(n).padStart(2,'0'),845,735,29,C.bone,'left',700);text('正面比例  '+(ratio*100).toFixed(1)+'%',1390,735,29,C.signal,'left',700);
  for(let i=0;i<25;i++){const a=hash(i*19+4)*TAU,x=190+Math.cos(a)*260,y=480+Math.sin(a)*175;dot(x,y,3,C.mint,12,.3+.2*Math.sin(t+i))}}
function axes(x,y,w,h){line(x,y,x,y+h,C.muted,3);line(x,y+h,x+w,y+h,C.muted,3);for(let i=0;i<=4;i++){const yy=y+h-i*h/4;line(x,yy,x+w,yy,C.grid,1);text((i*.25).toFixed(2),x-25,yy,20,C.muted,'right')}}
function sceneConverge(t,s){const p=(t-s.start)/(s.end-s.start);title('波动，逐渐收敛','FREQUENCY → STABILITY',t,p);const x=800,y=365,w=950,h=355;panel(760,345,1050,435,.5);axes(x,y,w,h);
  const yy=y+h*.5;line(x,yy,x+w,yy,C.mint,3,.7);text('理论值  0.50',x+w-15,yy-25,26,C.mint,'right',600);
  const n=Math.max(2,Math.floor(lerp(2,500,ease(p))));ctx.save();ctx.strokeStyle=C.signal;ctx.lineWidth=5;ctx.shadowColor=C.signal;ctx.shadowBlur=14;ctx.beginPath();for(let i=1;i<=n;i++){const xx=x+(i-1)/499*w,ry=prefix[i]/i,py=y+h-ry*h;if(i===1)ctx.moveTo(xx,py);else ctx.lineTo(xx,py)}ctx.stroke();ctx.restore();const rx=x+(n-1)/499*w,ry=y+h-(prefix[n]/n)*h;dot(rx,ry,9,C.signal,30);
  text('试验次数  '+n,x+20,y+h+36,26,C.bone);text('样本频率  '+(prefix[n]/n).toFixed(3),x+w,y+h+36,27,C.signal,'right',700)}
function sceneDistribution(t,s){const p=(t-s.start)/(s.end-s.start);title('数量，显露形状','FROM SAMPLES TO DISTRIBUTION',t,p);const x=800,y=380,w=950,h=340;panel(760,345,1050,435,.5);line(x,y+h,x+w,y+h,C.muted,3);
  const k=ease(p);for(let i=0;i<bins.length;i++){const bh=bins[i]/maxBin*h*.82*k;const xx=x+i*w/bins.length;ctx.fillStyle=i%3===0?C.signal:C.mint;ctx.globalAlpha=.6+.28*Math.sin(i*.4+t);ctx.fillRect(xx+3,y+h-bh,w/bins.length-6,bh);ctx.globalAlpha=1}
  for(let i=0;i<100;i++){const sample=normal[i],sx=clamp((sample+3.3)/6.6)*w+x,sy=y+50+hash(i*3+6)*h*.6;dot(sx,lerp(sy,y+h-(bins[Math.floor(clamp((sample+3.3)/6.6,0,.999)*bins.length)]/maxBin*h*.82),k),2,C.signal,8,.5*(1-k))}
  text('单次结果  →  整体形状',x+15,y+h+36,27,C.bone)}
function sceneReveal(t,s){const p=(t-s.start)/(s.end-s.start);const a=ease((p-.05)/.45);const x=960,y=790,w=970,h=350;for(let i=0;i<bins.length;i++){const bx=x-w/2+i*w/bins.length;const bh=bins[i]/maxBin*h*.85*(1-a);ctx.fillStyle=C.mint;ctx.globalAlpha=.6;ctx.fillRect(bx+4,y-bh,w/bins.length-8,bh)}ctx.globalAlpha=1;
  ctx.save();ctx.strokeStyle=C.signal;ctx.shadowColor=C.signal;ctx.shadowBlur=22;ctx.lineWidth=7;ctx.beginPath();for(let i=0;i<=220;i++){const z=(i/220-.5)*6.3;const xx=x-w/2+i*w/220,yy=y-Math.exp(-z*z/2)*h*.9*a;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.stroke();ctx.restore();
  const center=fade(p,.02,1,.3,.2);text('随机汇聚成规律',960,220,100,C.bone,'center',700,center);text('从单次的不确定，看到整体的可理解。',960,330,36,C.mint,'center',400,center);dot(960,790-h*.9*a,9,C.signal,34,a)}
const painters={chaos:sceneChaos,trials:sceneTrials,converge:sceneConverge,distribution:sceneDistribution,reveal:sceneReveal};
function frame(t,capture=false){t=clamp(t,0,44.999);background(t);const s=timeline.scenes.find(x=>t>=x.start&&t<x.end)||timeline.scenes.at(-1);painters[s.id](t,s);marker(t);caption(s,t);const opening=smooth(t/.35),ending=smooth((45-t)/.55),opacity=1-opening*ending;if(opacity>0){ctx.fillStyle=`rgba(3,8,16,${opacity})`;ctx.fillRect(0,0,W,H)}return capture?canvas.toDataURL('image/jpeg',.9):undefined}
window.__frame=t=>frame(t,true);window.__duration=timeline.duration;window.__cues=()=>timeline.cues;window.__ready=()=>document.fonts.status==='loaded';
const audio=document.getElementById('audio'),toggle=document.getElementById('toggle'),seek=document.getElementById('seek'),clock=document.getElementById('clock');
let silentClock=0,silentStart=0,playing=false,hasAudio=false;
audio.addEventListener('canplay',()=>hasAudio=true);
function now(){return hasAudio?audio.currentTime:silentClock+(performance.now()-silentStart)/1000}
function paint(){const t=playing?now():Number(seek.value);frame(t);seek.value=String(clamp(t,0,45));clock.textContent=`${fmt(t/60)}:${fmt(t%60)} / 00:45`;if(playing&&t<45)requestAnimationFrame(paint);else if(playing){playing=false;toggle.textContent='播放'}}
toggle.onclick=()=>{if(playing){playing=false;audio.pause();silentClock=now();toggle.textContent='播放'}else{playing=true;silentClock=Number(seek.value);silentStart=performance.now();if(hasAudio){audio.currentTime=silentClock;audio.play().catch(()=>{hasAudio=false;silentStart=performance.now()})}toggle.textContent='暂停';requestAnimationFrame(paint)}};
seek.oninput=()=>{audio.currentTime=Number(seek.value);silentClock=Number(seek.value);silentStart=performance.now();paint()};
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();toggle.click()}if(e.code==='ArrowRight'||e.code==='ArrowLeft'){seek.value=String(clamp(Number(seek.value)+(e.code==='ArrowRight'?1:-1),0,45));seek.oninput()}});
if(new URLSearchParams(location.search).has('export'))document.body.classList.add('export');
frame(0);

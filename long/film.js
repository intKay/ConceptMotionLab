import timeline from './timeline.json' with {type:'json'};
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d',{alpha:false});
const W=1280,H=720,D=timeline.duration,T=Math.PI*2,N=1800;
const C={bg:'#070b17',white:'#f8f1e5',gold:'#ffb669',mint:'#67e2cb',blue:'#7ea6fa',muted:'#b9c7da'};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,q)=>a+(b-a)*q,smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
const random=rng(20260929),bins=Array(17).fill(0);
const dots=Array.from({length:N},(_,i)=>{let heads=0;for(let j=0;j<16;j++)heads+=+(random()<.5);const rank=bins[heads]++;return{i,heads,rank,u:random(),v:random(),a:random()*T,b:random(),freq:[]}});
const br=rng(81923);let paths=Array.from({length:12},()=>{let h=0;return Array.from({length:1000},(_,i)=>(h+=+(br()<.5))/(i+1))});
const norm=(x,mu=0,sd=1)=>Math.exp(-.5*((x-mu)/sd)**2)/(sd*Math.sqrt(2*Math.PI));
const tone=(text,x,y,size,font='sans',color=C.white,alpha=1,align='left')=>{ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${font==='serif'?600:500} ${size}px ${font==='serif'?'NotoSerifFilm':'NotoSansFilm'}`;ctx.fillText(text,x,y);ctx.restore()};
const line=(pts,color=C.mint,w=2,alpha=.5)=>{ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.restore()};
const glow=(x,y,r,color,alpha)=>{ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,T);ctx.fill();ctx.restore()};
function scatter(mode,t,p){const lt=t%10,k=p.i,x=100+p.u*1080,y=235+p.v*345,a=p.a+lt*.25,r=40+p.u*490;
 switch(mode){
 case'burst':return[640+Math.cos(a)*r*smooth(lt/2),370+Math.sin(a)*r*.7*smooth(lt/2)];
 case'coin':return[640+Math.cos(a)*Math.sqrt(p.u)*220*Math.cos(lt*1.7),385+Math.sin(a)*Math.sqrt(p.u)*220];
 case'tree':{let depth=Math.min(15,Math.floor(lt*1.55));return[150+depth*63,390+(p.heads-8)*18*Math.min(1,depth/12)+(p.v-.5)*150]}
 case'galton':return[640+(p.heads-8)*57+(p.u-.5)*52,550-p.rank/Math.max(...bins)*245];
 case'condition':return[640+Math.cos(a)*r*.8,380+Math.sin(a)*r*.5];
 case'independence':return[640+(p.u-.5)*850,380+(p.v-.5)*340];
 case'numberline':return[170+p.heads/16*940+(p.u-.5)*15,470+(p.v-.5)*120];
 case'distribution':return[170+p.heads/16*940+(p.u-.5)*45,565-p.rank/Math.max(...bins)*270];
 case'expectation':return[640+(p.heads-8)*53+(p.u-.5)*30,450+(p.v-.5)*130];
 case'variance':return[640+(p.heads-8)*(25+18*Math.sin(lt*.65)**2)+(p.u-.5)*40,430+(p.v-.5)*220];
 case'law':{const path=paths[k%12],j=Math.floor(mix(4,999,smooth(lt/9)));return[155+j/999*980,425-(path[j]-.5)*650+(p.v-.5)*10]}
 case'wave':{const col=k%60,row=Math.floor(k/60),xx=(col-29.5)*17,yy=(row-14.5)*13;return[640+xx,390+yy*.6+55*Math.sin(xx*.012+row*.12-lt*2)*Math.exp(-xx*xx/300000)]}
 case'means':return[640+(p.heads-8)*65+(p.u-.5)*60,510-p.rank/Math.max(...bins)*260];
 case'clt':{const sd=mix(155,75,smooth(lt/8));return[640+(p.heads-8)*sd/2+(p.u-.5)*sd,390+(p.v-.5)*330]}
 case'sample':return[x,y];
 case'estimate':return[640+(p.heads-8)*50+(p.u-.5)*90,420+(p.v-.5)*200];
 case'interval':return[150+p.u*980,290+(k%14)*20];
 case'ptest':return[640+(p.heads-8)*57+(p.u-.5)*25,525-p.rank/Math.max(...bins)*250];
 case'decision':return[640+(p.heads-8)*47+(p.u-.5)*70,425+(p.v-.5)*160];
 case'synthesis':return[100+p.u*1080,360+100*Math.sin(p.u*17-lt*.6)+(p.v-.5)*110];
 case'finale':return[640+Math.cos(a)*r*.55*(1-smooth(lt/7)),380+Math.sin(a)*r*.35*(1-smooth(lt/7))];
 default:return[x,y]
 }}
function scene(t){return timeline.scenes[Math.min(20,Math.floor(t/10))]}
function position(t,p){const s=scene(t),local=t-s.start;let [x,y]=scatter(s.id,t,p);if(local<.75&&s.chapter>0){const other=timeline.scenes[s.chapter-1],q=1-smooth(local/.75),[ox,oy]=scatter(other.id,other.end-.001,p);x=mix(x,ox,q);y=mix(y,oy,q)}return[x,y]}
function points(t,s){
 for(const p of dots){let [x,y]=position(t,p);
 const col=p.i%9===0?C.gold:p.i%3===0?C.blue:C.mint;glow(x,y,p.i%17===0?2.2:1.2,col,.32+.4*p.b);
 }}
function geometry(t,s){const lt=t-s.start,id=s.id;ctx.save();ctx.globalAlpha=smooth(lt/.8)*smooth((10-lt)/.45);const gold=C.gold,mint=C.mint;
 if(id==='burst'){for(let i=0;i<8;i++){const a=i*T/8+lt*.1;line([[640,370],[640+Math.cos(a)*440,370+Math.sin(a)*250]],gold,1,.14)}tone('?',640,400,260,'serif',C.white,.33,'center')}
 if(id==='coin'){line([[640,205],[640,565]],C.muted,1,.35);tone('0',350,380,108,'serif',mint,.85,'center');tone('1',930,380,108,'serif',gold,.85,'center')}
 if(id==='tree')for(let level=0;level<12;level++){const x=150+level*76;line([[x,390-(level+1)*15],[x+70,390-(level+2)*15]],mint,1,.3);line([[x,390+(level+1)*15],[x+70,390+(level+2)*15]],gold,1,.3)}
 if(['galton','distribution','means','ptest'].includes(id)){const ps=[];for(let k=0;k<=16;k++){const x=170+k/16*940,h=norm(k,8,2)*850;ps.push([x,550-h]);line([[x,555],[x,555-h]],k===8?gold:mint,2,.38)}line(ps,gold,3,.65);tone('0',160,580,18);tone('8',640,580,18);tone('16',1110,580,18)}
 if(id==='condition'){ctx.fillStyle='#0c1724da';ctx.fillRect(90,290,540,245);ctx.strokeStyle=gold;ctx.strokeRect(90,290,540,245);tone('A',370,405,120,'serif',gold,.7,'center');tone('A ∩ B',900,405,65,'serif',mint,.85,'center')}
 if(id==='independence'){line([[640,235],[640,555]],gold,2,.6);line([[210,390],[1070,390]],mint,2,.6);tone('P(A∩B)=P(A)P(B)',640,535,32,'sans',C.white,.9,'center')}
 if(id==='numberline'){line([[160,500],[1120,500]],C.white,2,.7);for(let k=0;k<=16;k++){let x=170+k/16*940;line([[x,492],[x,508]],gold,1,.6)}tone('X = 正面次数',640,545,28,'sans',gold,.9,'center')}
 if(id==='expectation'){line([[200,495],[1080,495]],C.white,2,.7);glow(640,495,12,gold,.9);tone('E[X] = 8',640,550,43,'serif',gold,1,'center')}
 if(id==='variance'){line([[640,250],[640,560]],gold,2,.55);line([[340,555],[940,555]],mint,3,.35);tone('中心',640,590,20,'sans',gold,.8,'center')}
 if(id==='law'){line([[150,425],[1130,425]],gold,2,.6);for(const path of paths){let ps=[];for(let j=8;j<1000;j+=6)ps.push([155+j/999*980,425-(path[j]-.5)*650]);line(ps,mint,1,.35)}tone('1/2',1150,425,26,'serif',gold,.9)}
 if(id==='wave')for(let row=0;row<30;row+=4){let ps=[];for(let col=0;col<60;col++){let k=row*60+col,p=dots[k];ps.push(scatter('wave',t,p))}line(ps,mint,1,.2)}
 if(id==='clt'){for(const sd of [170,110,70]){let ps=[];for(let x=260;x<=1020;x+=6)ps.push([x,555-norm(x,640,sd)*28000]);line(ps,sd===70?gold:mint,sd===70?3:1,sd===70?.9:.3)}tone('n ↑    标准误差 ↓',640,580,28,'sans',gold,.9,'center')}
 if(id==='sample'){for(let i=0;i<N;i+=13){const p=dots[i];let [x,y]=scatter(id,t,p);glow(x,y,3.5,gold,.75)}tone('抽取的样本',980,540,25,'sans',gold,.85,'center')}
 if(id==='estimate'){line([[170,540],[1110,540]],C.white,2,.6);const x=640+Math.sin(lt*1.1)*85;glow(x,540,11,gold,1);tone('样本均值',x,575,25,'sans',gold,.9,'center')}
 if(id==='interval'){const fixed=640;line([[fixed,235],[fixed,570]],gold,3,.8);for(let i=0;i<20;i++){const y=275+i*15,center=i===16?fixed+163:fixed+110*Math.sin(i*2.4+1),half=145;line([[center-half,y],[center+half,y]],Math.abs(center-fixed)<half?mint:C.blue,3,.55)}tone('固定参数 · 20 条区间示意',fixed,590,23,'sans',gold,.85,'center')}
 if(id==='ptest'){const obs=860;line([[obs,260],[obs,565]],gold,3,.9);ctx.fillStyle='#ffb66935';ctx.fillRect(obs,285,240,270);ctx.fillRect(180,285,240,270);tone('观测值',obs,590,25,'sans',gold,.9,'center')}
 if(id==='decision'){for(const [center,color] of [[590,mint],[710,gold]]){let ps=[];for(let x=260;x<=1020;x+=5)ps.push([x,550-norm(x,center,110)*30000]);line(ps,color,3,.65)}tone('统计显著 ≠ 实际重要',640,580,30,'sans',gold,.9,'center')}
 if(id==='synthesis'){for(let i=0;i<3;i++){let x=280+i*360;glow(x,405,80,[gold,mint,C.blue][i],.1);tone(['模型','样本','推断'][i],x,405,54,'serif',C.white,.9,'center');if(i<2)line([[x+90,405],[x+270,405]],C.white,2,.5)}}
 if(id==='finale'){tone('概率论与数理统计',640,390,80,'serif',C.white,smooth(lt/2),'center');line([[370,475],[910,475]],gold,2,.6)}
 ctx.restore()}
function background(t){ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);const gr=ctx.createRadialGradient(640,385,30,640,385,680);gr.addColorStop(0,'#193447');gr.addColorStop(1,C.bg);ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);for(let i=0;i<75;i++){let x=((i*173.31+t*9)%1320)-20,y=(i*397.31)%720;glow(x,y,.6,C.white,.15)}}
function textLayer(t,s){const lt=t-s.start;ctx.save();let top=ctx.createLinearGradient(0,0,0,215);top.addColorStop(0,'#070b17ff');top.addColorStop(.78,'#070b17f4');top.addColorStop(1,'#070b1700');ctx.fillStyle=top;ctx.fillRect(0,0,W,215);let bottom=ctx.createLinearGradient(0,565,0,720);bottom.addColorStop(0,'#070b1700');bottom.addColorStop(.35,'#070b17ee');bottom.addColorStop(1,'#070b17ff');ctx.fillStyle=bottom;ctx.fillRect(0,565,W,155);
 const a=smooth(lt/.5)*smooth((10-lt)/.4);tone(s.label,72,48,18,'sans',C.gold,a);tone(s.title,72,116,s.id==='finale'?60:53,s.chapter%3===0?'serif':'sans',C.white,a);tone(s.caption,72,647,25,'sans',C.white,a);tone(`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')} / 03:30`,1185,45,17,'sans',C.muted,.75,'right');ctx.fillStyle=C.gold;ctx.globalAlpha=.6;ctx.fillRect(72,695,1136*t/D,2);ctx.restore()}
function frame(t,capture=false){t=clamp(t,0,D-.001);const s=scene(t);background(t);points(t,s);geometry(t,s);textLayer(t,s);if(t>D-1.4){ctx.fillStyle=`rgba(7,11,23,${1-smooth((D-t)/1.4)})`;ctx.fillRect(0,0,W,H)}return capture?canvas.toDataURL('image/jpeg',.92):undefined}
let ready=false;Promise.all([document.fonts.load('600 48px NotoSansFilm','概率论与数理统计'),document.fonts.load('600 48px NotoSerifFilm','概率论与数理统计')]).then(()=>document.fonts.ready).then(()=>{ready=true;frame(0)});
window.__frame=t=>frame(t,true);window.__ready=()=>ready;window.__duration=D;window.__diagnostics=()=>({duration:D,scenes:timeline.scenes.length,particles:N,fonts:[document.fonts.check('600 48px NotoSansFilm','概率论与数理统计'),document.fonts.check('600 48px NotoSerifFilm','概率论与数理统计')],binSum:bins.reduce((a,b)=>a+b,0),maxBin:Math.max(...bins)});
window.__textBoxes=t=>{const s=scene(t);return{scene:s.id,title:[72,75,1135,100],caption:[72,615,1135,64],particleLayerBelowText:true}};
window.__transitionCheck=()=>timeline.scenes.slice(1).map(s=>{let max=0;for(const p of dots){const a=position(s.start-.00001,p),b=position(s.start+.00001,p);max=Math.max(max,Math.hypot(a[0]-b[0],a[1]-b[1]))}return{at:s.start,maxDisplacement:max}});
const audio=document.querySelector('#audio'),toggle=document.querySelector('#toggle'),seek=document.querySelector('#seek'),clock=document.querySelector('#clock');let playing=false,raf=0,base=0,started=0,available=false;audio.addEventListener('canplay',()=>available=true);
const current=()=>playing?(available?audio.currentTime:base+(performance.now()-started)/1000):Number(seek.value);const stamp=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function paint(){const t=clamp(current(),0,D);frame(t);seek.value=String(t);clock.textContent=`${stamp(t)} / ${stamp(D)}`;if(playing&&t<D)raf=requestAnimationFrame(paint);else if(t>=D){playing=false;audio.pause();toggle.textContent='重播'}}
toggle.onclick=async()=>{if(playing){seek.value=String(current());playing=false;audio.pause();cancelAnimationFrame(raf);toggle.textContent='播放';return}if(Number(seek.value)>=D-.01)seek.value='0';base=Number(seek.value);started=performance.now();playing=true;if(available){audio.currentTime=base;try{await audio.play()}catch{available=false;started=performance.now()}}toggle.textContent='暂停';paint()};seek.oninput=()=>{base=Number(seek.value);started=performance.now();if(available)audio.currentTime=base;cancelAnimationFrame(raf);paint()};if(location.search.includes('export'))document.body.classList.add('export');

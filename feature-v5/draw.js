export const W=1920,H=1080,TAU=Math.PI*2;
export const P={ink:'#07161e',deep:'#0d2631',paper:'#efe9dc',paper2:'#ddd4c2',white:'#f6f1e7',mint:'#85d8bc',mint2:'#367e78',orange:'#ff7045',gold:'#e9bb76',blue:'#789bbd',muted:'#91abae',char:'#203a42'};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,u)=>a+(b-a)*u;
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)},out=x=>1-(1-clamp(x))**4,prog=(t,a,b)=>smooth((t-a)/(b-a));
export const hash=i=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
export const pulse=(t,k,decay=10)=>t<k?0:Math.exp(-(t-k)*decay);
export let audit=[],auditOn=false;
let textMode='normal',queuedText=[];
export function textCapture(mode){textMode=mode;if(mode==='queue')queuedText=[];return queuedText}
export function replayText(c,commands){textMode='normal';for(const v of commands){c.save();c.setTransform(v.transform);c.globalAlpha=v.opacity;text(c,...v.args);c.restore()}}
export function setAudit(v){auditOn=v;audit=[]}
export function text(c,s,x,y,z=32,col=P.white,f='sans',align='left',alpha=1,weight=600){if(alpha<.005)return;if(textMode==='hide')return;if(textMode==='queue'){queuedText.push({args:[s,x,y,z,col,f,align,alpha,weight],transform:c.getTransform(),opacity:c.globalAlpha});return}c.save();c.globalAlpha*=clamp(alpha);c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.font=`${weight} ${z}px ${f==='serif'?'FilmSerif':'FilmSans'}`;c.fillText(String(s),x,y);if(auditOn){const m=c.measureText(String(s)),w=m.width,left=x-(align==='center'?w/2:align==='right'?w:0),mat=c.getTransform();const x0=mat.a*left+mat.c*y+mat.e,y0=mat.b*left+mat.d*y+mat.f;audit.push({s:String(s),x:x0,y:y0,w:w*mat.a,h:z*mat.d,alpha:c.globalAlpha})}c.restore()}
export function line(c,a,b,col=P.mint,w=2,alpha=1){c.save();c.globalAlpha*=clamp(alpha);c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.restore()}
export function poly(c,pts,col=P.mint,w=2,alpha=1,fill=false){if(pts.length<2)return;c.save();c.globalAlpha*=clamp(alpha);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);if(fill){c.closePath();c.fill()}else c.stroke();c.restore()}
export function rect(c,x,y,w,h,col,alpha=1,stroke=null){c.save();c.globalAlpha*=clamp(alpha);c.fillStyle=col;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=1.2;c.strokeRect(x,y,w,h)}c.restore()}
export function dot(c,x,y,r,col=P.mint,alpha=1){if(r<=0||alpha<=0)return;c.save();c.globalAlpha*=clamp(alpha);c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore()}
export function ring(c,x,y,r,col=P.mint,w=1,alpha=1,a0=0,a1=TAU){c.save();c.globalAlpha*=clamp(alpha);c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(x,y,r,a0,a1);c.stroke();c.restore()}
export function glow(c,x,y,r=6,col=P.orange,alpha=1){dot(c,x,y,r*4,col,alpha*.06);dot(c,x,y,r*2.1,col,alpha*.17);dot(c,x,y,r,col,alpha);dot(c,x,y,r*.36,P.white,alpha)}
export function arrow(c,a,b,col=P.orange,w=3,alpha=1){line(c,a,b,col,w,alpha);const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);poly(c,[[b[0]-14*Math.cos(ang-.48),b[1]-14*Math.sin(ang-.48)],b,[b[0]-14*Math.cos(ang+.48),b[1]-14*Math.sin(ang+.48)]],col,w,alpha)}
export function bezier(a,b,u,bend=0){return[mix(a[0],b[0],u)+Math.sin(Math.PI*u)*bend,mix(a[1],b[1],u)-Math.sin(Math.PI*u)*Math.abs(bend)*.65]}
export function background(c,t,light=false,grid=false){rect(c,0,0,W,H,light?P.paper:P.ink);if(!light){let g=c.createRadialGradient(1150,390,60,1150,390,1100);g.addColorStop(0,'#21424a50');g.addColorStop(1,'#07161e00');c.fillStyle=g;c.fillRect(0,0,W,H)}
 if(grid){for(let x=72;x<W;x+=72)line(c,[x,215],[x,892],light?P.char:P.muted,1,.095);for(let y=244;y<900;y+=72)line(c,[80,y],[1840,y],light?P.char:P.muted,1,.095)}
 // Fixed, sparse etched grain: no temporal speckle over small text.
 for(let i=0;i<150;i++){const x=hash(i*3)*W,y=hash(i*3+1)*H;rect(c,x,y,1+hash(i)*2,1,light?P.char:P.white,.035)}
}
export function heading(c,num,title,kicker='',light=false,side='left'){const x=side==='right'?1810:110,a=side==='right'?'right':'left',fg=light?P.char:P.white;text(c,num.padStart(2,'0')+'  /  '+kicker,x,88,23,light?P.mint2:P.mint,'sans',a,1,500);text(c,title,x,158,60,fg,'serif',a,1,700)}
export function tag(c,s,x,y,col=P.orange,light=false){c.save();c.font='600 25px FilmSans';const w=c.measureText(s).width+34;rect(c,x,y-24,w,48,light?P.paper:P.ink,1,col);text(c,s,x+17,y,25,col);c.restore()}
export function prism(c,x,y,w,h,d=22,col=P.mint,alpha=1){rect(c,x,y-h,w,h,col,alpha);poly(c,[[x,y-h],[x+d,y-h-d*.55],[x+w+d,y-h-d*.55],[x+w,y-h]],P.white,1,alpha*.55,true);poly(c,[[x+w,y],[x+w+d,y-d*.55],[x+w+d,y-h-d*.55],[x+w,y-h]],col,1,alpha*.45,true);line(c,[x,y-h],[x+w,y-h],P.white,1,alpha*.7)}
export function hatch(c,x,y,w,h,col=P.char,alpha=.15,step=12){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();for(let k=-h;k<w;k+=step)line(c,[x+k,y+h],[x+k+h,y],col,1,alpha);c.restore()}
export function project(x,y,z,yaw=.4,pitch=.3,zoom=1,cx=960,cy=490){const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw),yy=y*Math.cos(pitch)-zz*Math.sin(pitch),zz2=y*Math.sin(pitch)+zz*Math.cos(pitch),f=1400/(1400+zz2);return[cx+xx*f*zoom,cy+yy*f*zoom,f]}
export function coin(c,x,y,r,angle=0,head=true,alpha=1){c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(.12*Math.sin(angle));const k=Math.max(.065,Math.abs(Math.cos(angle)));c.scale(k,1);const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,head?'#f5d6a2':'#c8d9df');g.addColorStop(.5,head?'#b77c42':'#6c95a1');g.addColorStop(1,head?'#e5b471':'#b6cfd5');dot(c,5,6,r,head?'#704c32':'#3a555f');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();ring(c,0,0,r*.88,P.ink,2,.7);ring(c,0,0,r*.80,P.white,1,.6);for(let j=0;j<64;j++){const a=j/64*TAU;line(c,[Math.cos(a)*r*.91,Math.sin(a)*r*.91],[Math.cos(a)*r*.96,Math.sin(a)*r*.96],P.ink,1,.55)}text(c,head?'正':'反',0,-r*.03,r*.8,P.ink,'serif','center',1,700);c.restore()}
export function axis(c,x,y,w,ticks,min,max,light=false,labels=true){const fg=light?P.char:P.muted;line(c,[x,y],[x+w,y],fg,2,.7);for(let i=0;i<=ticks;i++){const xx=x+w*i/ticks;line(c,[xx,y-5],[xx,y+8],fg,1,.7);if(labels)text(c,(min+(max-min)*i/ticks).toFixed(max-min<3?1:0),xx,y+28,22,fg,'sans','center')}}
export function shade(c,alpha=.1){const g=c.createRadialGradient(960,490,450,960,490,1140);g.addColorStop(0,'#00000000');g.addColorStop(1,`rgba(0,0,0,${alpha})`);c.fillStyle=g;c.fillRect(0,0,W,H)}

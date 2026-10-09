import {particles,maxBin,sampling,frequencies} from './model.js';
export const TAU=Math.PI*2,COUNT=particles.length;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,q)=>a+(b-a)*q;
export const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
export const mod=(x,n)=>(x%n+n)%n;
export const hash=n=>{const x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x)};
export function project(x,y,z,ry=0,rx=0,zoom=1,cx=960,cy=520){
  const xx=x*Math.cos(ry)+z*Math.sin(ry),zz=z*Math.cos(ry)-x*Math.sin(ry);
  const yy=y*Math.cos(rx)-zz*Math.sin(rx),zzz=y*Math.sin(rx)+zz*Math.cos(rx),s=1100/Math.max(180,1450+zzz)*zoom;
  return{x:cx+xx*s,y:cy+yy*s,s};
}
export function samplingStage(lt){
  if(lt<1.4)return{from:0,to:0,q:0};
  if(lt<2.5)return{from:0,to:1,q:smooth((lt-1.4)/1.1)};
  if(lt<3.65)return{from:1,to:1,q:0};
  if(lt<4.75)return{from:1,to:2,q:smooth((lt-3.65)/1.1)};
  return{from:2,to:2,q:0};
}
export function shape(scene,t,i,letters=[]){
  const p=particles[i],lt=clamp(t-scene.start,0,scene.end-scene.start),d=scene.end-scene.start;
  let x=960,y=520,size=1.8+p.w*.6,color=p.successes<8?1:0,alpha=.75;
  switch(scene.id){
    case'ignition':{
      const phase=mod(t,.5),pulse=5.5*Math.sin(Math.PI*phase/.5)**2*Math.exp(-phase/.12);
      const expand=1-Math.pow(1-clamp((lt-.2)/1.4),4),r=(80+p.u*980)*expand,a=p.a+lt*.18*(p.v-.5);
      x=960+Math.cos(a)*r*(1+.04*pulse);y=510+Math.sin(a)*r*.63*(1+.04*pulse);size=(.8+p.w*2.4)*(1+.3*pulse);color=i%7===0?1:0;alpha=.58;break;
    }
    case'coin':{
      const rot=lt*2.7+Math.sin(lt*2)*.3,r=Math.sqrt(p.u)*280,side=i%2?1:-1;
      const q=project(Math.cos(p.a)*r,Math.sin(p.a)*r,side*13,rot,-.2,1.35);x=q.x;y=q.y;size=1.7*q.s;color=side===1?0:1;break;
    }
    case'branches':{
      const depth=clamp((lt/d*1.18)*16*p.u,0,16),j=Math.min(15,Math.floor(depth)),f=depth-j;
      const yy=k=>520+(p.codes[k]-(2**k-1)/2)*630/(2**k);
      x=155+depth*99;y=mix(yy(j),yy(j+1),f);size=1.5+p.w;break;
    }
    case'galton':{
      const step=(lt-p.u*2.7)*9.2;
      if(step<0){x=960+Math.cos(p.a+t)*22*p.v;y=132+Math.sin(p.a+t)*22*p.v;alpha=.14;size=1;}
      else if(step<16){const j=Math.floor(step),f=step-j;x=960+mix(p.path[j],p.path[j+1],f)*43;y=155+step*30-Math.sin(f*Math.PI)*10;size=1.8;}
      else{const settle=smooth((step-16)/3);x=960+(p.successes-8)*86+(p.v-.5)*67*settle;y=mix(635,805-p.rank/maxBin*150,settle);}
      break;
    }
    case'pile':{
      const rise=smooth(lt/2.1);x=960+(p.successes-8)*86+(p.v-.5)*67;y=805-p.rank/maxBin*mix(150,445,rise);alpha=.65+.15*Math.sin(p.a+lt*2);break;
    }
    case'concentration':{
      const stage=samplingStage(lt),value=mix(sampling[i][stage.from],sampling[i][stage.to],stage.q);
      const a=lt*2.1+(value-.5)*18+(i%2)*Math.PI+(p.v-.5)*.22,r=165+(p.w-.5)*48,depth=Math.cos(a);
      x=960+(value-.5)*2450;y=548+Math.sin(a)*r;size=(1.3+p.w*1.7)*(1+depth*.32);alpha=.35+.5*(depth+1)/2;color=i%9===0?2:value<.5?1:0;break;
    }
    case'ribbons':{
      const count=mix(12,1000,smooth(lt/(d-.3))),k=i%12,series=frequencies[k],progress=mod(p.u+lt*.06,1),j=clamp(progress*count,0,999),lo=Math.floor(j),f=j-lo;
      x=170+j/999*1590;y=565-(mix(series[lo],series[Math.min(999,lo+1)],f)-.5)*480;
      size=1.1+p.w*.7;color=k%3;alpha=.27+p.v*.35;break;
    }
    case'wave':{
      const row=Math.floor(i/80),col=i%80,xx=(col-39.5)*23,z=(row-29.5)*23,envelope=Math.exp(-xx*xx/440000-z*z/280000),phase=xx*.008+z*.004-lt*2.7;
      const yy=-190*envelope-75*Math.sin(phase)*Math.sin(lt*.7+row*.09),q=project(xx,yy,z,-.25+lt*.1,.54,1.25,960,600);
      x=q.x;y=q.y;size=(1.2+envelope*1.6)*q.s;color=(col+row)%8===0?0:row<30?1:2;alpha=.65;break;
    }
    case'orbit':{
      const a=p.a+lt*.68,r=285+50*Math.sin(p.u*TAU*4+lt),h=(p.v-.5)*150,q=project(Math.cos(a)*r,h,Math.sin(a)*r,lt*.48,.35+lt*.1,1.8);
      x=q.x;y=q.y;size=(1+p.w*1.6)*q.s;color=i%2;break;
    }
    case'vortex':{
      const target=letters[Math.floor(i/COUNT*letters.length)]||{x:960,y:505};
      const collapse=smooth(lt/d)**2,a=p.a+lt*2.4*(1+p.w*.4),r=120+p.u*1300;
      x=mix(960+Math.cos(a)*r,target.x,collapse);y=mix(510+Math.sin(a)*r*.65,target.y,collapse);size=1+p.w*1.3;color=i%6===0?1:0;break;
    }
    case'finale':{
      const target=letters[Math.floor(i/COUNT*letters.length)]||{x:960,y:505},explode=smooth((lt-2.8)/1)*.2,r=(100+p.u*1000)*explode;
      x=target.x+Math.cos(p.a)*r;y=target.y+Math.sin(p.a)*r*.7;size=1+p.w*1.3;color=i%6===0?1:0;alpha=.75*(1-explode);break;
    }
  }
  return{x,y,size,color,alpha};
}
export function composition(t,timeline){
  const half=timeline.transition_half_duration;
  for(let i=1;i<timeline.scenes.length;i++){
    const b=timeline.scenes[i].start;if(Math.abs(t-b)<half)return{a:timeline.scenes[i-1],b:timeline.scenes[i],q:smooth((t-b+half)/(2*half))};
  }
  return{a:timeline.scenes.find(s=>t>=s.start&&t<s.end)||timeline.scenes.at(-1),b:null,q:0};
}
export function particleAt(t,i,timeline,letters=[]){
  const c=composition(t,timeline),a=shape(c.a,t,i,letters);if(!c.b)return a;
  const b=shape(c.b,t,i,letters),q=c.q,p=particles[i];
  const distance=Math.hypot(b.x-a.x,b.y-a.y),bow=Math.sin(q*Math.PI)*Math.min(160,distance*.19)*(p.v-.5);
  return{x:mix(a.x,b.x,q)+Math.sin(p.a)*bow,y:mix(a.y,b.y,q)+Math.cos(p.a)*bow,size:mix(a.size,b.size,q),alpha:mix(a.alpha,b.alpha,q),color:a.color,color2:b.color,colorMix:q};
}

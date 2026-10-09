export function rng(seed){return()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
const r=rng(20260929),N=2400;
export const particles=Array.from({length:N},(_,i)=>{let heads=0,steps=[];for(let j=0;j<16;j++){const h=r()<.5;heads+=+h;steps.push(h?1:-1)}return{i,heads,steps,u:r(),v:r(),w:r(),a:r()*Math.PI*2}});
export const counts=Array(17).fill(0);for(const p of particles){p.rank=counts[p.heads]++;}
export const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n+1-i)/i;return Math.round(v)};
export const binom=Array.from({length:17},(_,k)=>choose(16,k)/65536);
export const exactP=2*binom.slice(12).reduce((a,b)=>a+b,0);
const r2=rng(33771);const first=Array(12).fill(1).concat(Array(4).fill(0));for(let i=15;i>0;i--){const j=Math.floor(r2()*(i+1));[first[i],first[j]]=[first[j],first[i]]}
let h=0;export const continued=Array.from({length:1200},(_,i)=>{h+=i<16?first[i]:+(r2()<.5);return h/(i+1)});
const r3=rng(99821);export const tracks=Array.from({length:12},()=>{let a=0;return Array.from({length:1200},(_,i)=>(a+=+(r3()<.5))/(i+1))});
const re=rng(44117);export const expHist={};for(const n of [1,4,16]){const hist=Array(64).fill(0);for(let j=0;j<4600;j++){let sum=0;for(let k=0;k<n;k++)sum+=-Math.log(Math.max(re(),1e-10));let x=sum/n,bin=Math.floor(x/3.2*64);if(bin>=0&&bin<64)hist[bin]++}expHist[n]=hist}
const rn=rng(65681);function normal(){return Math.sqrt(-2*Math.log(Math.max(rn(),1e-10)))*Math.cos(2*Math.PI*rn())}
export const intervals=Array.from({length:40},()=>{let sum=0;for(let i=0;i<25;i++)sum+=normal();const center=sum/25,half=1.96/5;return{center,lo:center-half,hi:center+half,covers:Math.abs(center)<=half}});
export const coverage=intervals.filter(x=>x.covers).length;

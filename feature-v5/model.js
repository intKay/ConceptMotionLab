// Numerical objects are fixed before any rendering. No frame mutates this model.
export function rng(seed){return()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
export const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n+1-i)/i;return Math.round(v)};
export const binom=Array.from({length:17},(_,k)=>choose(16,k)/65536);
export const cdf=binom.map((_,k)=>binom.slice(0,k+1).reduce((a,b)=>a+b,0));
export const exactP=2*binom.slice(12).reduce((a,b)=>a+b,0);
export const observed=[1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1];
const r=rng(20260929);export const counts=Array(17).fill(0);
export const particles=Array.from({length:1536},(_,i)=>{let h=0;const steps=[],cum=[0];for(let j=0;j<16;j++){const a=+(r()<.5);h+=a;steps.push(a);cum.push(h)}return {i,steps,cum,heads:h,rank:counts[h]++,u:r(),v:r(),w:r(),a:r()*Math.PI*2}});
const r2=rng(33771);let h=0;export const continued=Array.from({length:1600},(_,i)=>(h+=i<16?observed[i]:+(r2()<.5))/(i+1));
const r3=rng(99821);export const tracks=Array.from({length:12},()=>{let h=0;return Array.from({length:1600},(_,i)=>(h+=+(r3()<.5))/(i+1))});
const re=rng(44117);export const sampleSets={},means={},histograms={},zHistograms={};
export const M=4608,BINS=60,XMAX=4,ZMIN=-4,ZMAX=6;
for(const n of [1,4,16]){const samples=[],ms=[],hs=Array(BINS).fill(0),zs=Array(BINS).fill(0);let overflow=0,zoverflow=0;for(let j=0;j<M;j++){const arr=Array.from({length:n},()=>-Math.log(Math.max(re(),1e-10))),x=arr.reduce((a,b)=>a+b,0)/n,z=(x-1)*Math.sqrt(n);if(j<24)samples.push(arr);ms.push(x);const k=Math.floor(x/XMAX*BINS),kz=Math.floor((z-ZMIN)/(ZMAX-ZMIN)*BINS);if(k>=0&&k<BINS)hs[k]++;else overflow++;if(kz>=0&&kz<BINS)zs[kz]++;else zoverflow++}sampleSets[n]=samples;means[n]=ms;histograms[n]={counts:hs,overflow};zHistograms[n]={counts:zs,overflow:zoverflow}}
const rn=rng(65681);const normal=()=>Math.sqrt(-2*Math.log(Math.max(rn(),1e-10)))*Math.cos(2*Math.PI*rn());
export const intervals=Array.from({length:40},()=>{const sample=Array.from({length:25},normal),center=sample.reduce((a,b)=>a+b,0)/25,half=1.96/5;return{sample,center,lo:center-half,hi:center+half,covers:Math.abs(center)<=half}});
export const coverage=intervals.filter(x=>x.covers).length;
export function diagnostics(){return{particles:particles.length,countsSum:counts.reduce((a,b)=>a+b,0),probSum:binom.reduce((a,b)=>a+b,0),expected:binom.reduce((a,p,k)=>a+k*p,0),variance:binom.reduce((a,p,k)=>a+(k-8)**2*p,0),exactP,cdf12:cdf[12],observedHeads:observed.reduce((a,b)=>a+b),continued16:continued[15],coverage,intervalCount:40,clt:Object.fromEntries([1,4,16].map(n=>[n,{samples:means[n].length,mean:means[n].reduce((a,b)=>a+b,0)/M,histTotal:histograms[n].counts.reduce((a,b)=>a+b,0)+histograms[n].overflow,zHistTotal:zHistograms[n].counts.reduce((a,b)=>a+b,0)+zHistograms[n].overflow}]))}}

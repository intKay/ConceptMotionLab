// Analytic integral keeps seeking and frame ordering deterministic.
// A 24-second phrase breathes between 62% and 138% of the selected speed.
const W=2*Math.PI/24;
export function tempoAt(t,on=true){return on?1+.38*Math.sin(t*W):1;}
export function motionClock(t,speed=1,on=true){return speed*(t+(on?.38*(1-Math.cos(t*W))/W:0));}

// Fixed random seeds make seeking and out-of-order export deterministic.
export function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const levels = 16;
export const bins = Array(levels + 1).fill(0);
const random = rng(20260928);
export const particles = Array.from({ length: 4800 }, (_, i) => {
  const path = [0],codes=[0]; let successes = 0;
  for (let j = 0; j < levels; j++) { const right = random() < .5; successes += Number(right); path.push(path.at(-1) + (right ? 1 : -1));codes.push(codes.at(-1)*2+Number(right)); }
  const rank = bins[successes]++;
  return { i, path, codes, successes, rank, u: random(), v: random(), w: random(), a: random() * Math.PI * 2 };
});
export const maxBin = Math.max(...bins);
export const frequencies = Array.from({ length: 12 }, (_, k) => {
  const r = rng(600 + k * 73); let n = 0;
  return Array.from({ length: 1000 }, (_, i) => { n += Number(r() < .5); return n / (i + 1); });
});
export const expected = Array.from({ length: 17 }, (_, k) => {
  let c = 1; for (let i = 1; i <= k; i++) c *= (17 - i) / i; return c / 65536;
});

// Each particle is one independent experiment, extended from 16 to 256 tosses.
// The three displayed positions come from this same sequence, never a fitted curve.
export const sampling = particles.map(p => {
  const r=rng(8171+p.i*31);let heads=p.successes;
  const values=[heads/16];
  for(let n=17;n<=256;n++){heads+=Number(r()<.5);if(n===64||n===256)values.push(heads/n)}
  return values;
});
export const sampleSizes=[16,64,256];
export const theoreticalSD=sampleSizes.map(n=>1/(2*Math.sqrt(n)));

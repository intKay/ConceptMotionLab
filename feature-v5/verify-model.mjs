import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import * as m from './model.js';
const d=m.diagnostics();
assert.equal(d.probSum,1);assert.equal(d.expected,8);assert.equal(d.variance,4);
assert.equal(d.exactP,0.076812744140625);assert.equal(m.choose(16,12),1820);assert.equal(m.choose(16,8),12870);
assert.equal(d.observedHeads,12);assert.equal(d.continued16,.75);assert.equal(d.countsSum,1536);
for(const p of m.particles){assert.equal(p.steps.reduce((a,b)=>a+b),p.heads);assert.equal(p.cum.at(-1),p.heads);assert.ok(p.rank<m.counts[p.heads]);}
for(const v of m.intervals){assert.ok(Math.abs(v.center-v.sample.reduce((a,b)=>a+b)/25)<1e-12);assert.ok(Math.abs((v.hi-v.lo)-.784)<1e-12);assert.equal(v.covers,v.lo<=0&&v.hi>=0);}
for(const n of [1,4,16]){assert.equal(d.clt[n].histTotal,4608);assert.equal(d.clt[n].zHistTotal,4608);for(let j=0;j<24;j++)assert.equal(m.sampleSets[n][j].reduce((a,b)=>a+b)/n,m.means[n][j]);}
const prefixes=new Set();for(let row=0;row<8;row++)for(let col=0;col<8;col++)prefixes.add((col<4?'1':'0')+(row<4?'1':'0')+((row%4)*4+col%4).toString(2).padStart(4,'0'));assert.equal(prefixes.size,64);
const result={passed:true,...d,conditionalPrefixes:prefixes.size};writeFileSync(join(dirname(fileURLToPath(import.meta.url)),'out','model-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));

import {readFileSync,writeFileSync} from 'node:fs';import {dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),path=join(root,'verify.mjs');let s=readFileSync(path,'utf8');
const extra=`
await send('Emulation.clearDeviceMetricsOverride');
await ev('__iceberg.modules.setPreset("base");__iceberg.seek(6)');
const fast=await ev('__iceberg.state()');await ev('__iceberg.seek(18)');const slow=await ev('__iceberg.state()');
assert(fast.motion.tempo>1.3&&slow.motion.tempo<.7);assert(fast.motion.pathTime>6*1.8);assert.equal(slow.modules.papers.direction,'前方→身后');
checks.push({check:'analytic phrase rhythm has distinct fast and slow phases',passed:true});
for(const id of ['stickerMotion','stickerRefresh','stickerFlicker','rhythm','cameraFast']){
 await ev('document.querySelector("#presets button[data-id=base]").click()');
 const input='[...document.querySelectorAll("#modules label")].find(l=>l.textContent.includes('+JSON.stringify({stickerMotion:'贴纸流动',stickerRefresh:'贴纸局部刷新',stickerFlicker:'贴纸局部闪烁',rhythm:'速度节奏变化',cameraFast:'视角加速'}[id])+')).querySelector("input")';
 await ev(input+'.click();__iceberg.seek(156)');assert.equal((await ev('__iceberg.state()')).config[id],false);
 await ev(input+'.click();__iceberg.seek(156)');assert.equal((await ev('__iceberg.state()')).config[id],true);
 checks.push({check:id+' actual checkbox disable and restore',passed:true});
}
await ev('document.querySelector("#cameraSpeed").value=3;document.querySelector("#cameraSpeed").dispatchEvent(new Event("input"));document.querySelector("#paperSpeed").value=2;document.querySelector("#paperSpeed").dispatchEvent(new Event("input"));__iceberg.seek(248)');
s=await ev('__iceberg.state()');assert.equal(s.config.cameraSpeed,3);assert.equal(s.config.paperSpeed,2);assert(s.motion.pathTime>700);assert(s.modules.stickers.visiblePanels>=12);assert(s.position[2]<-900);
checks.push({check:'speed slider events and accelerated final passage retain surrounding walls',passed:true});await shot('accelerated-end');
await ev('__iceberg.modules.setPreset("base");__iceberg.seek(156);document.body.classList.remove("clean");document.querySelector("#panel").hidden=false');await shot('rhythm-controls');
`;
const marker='assert.deepEqual(errors,[]);';if(!s.includes(marker))throw Error('Check marker missing');s=s.replace(marker,extra+marker);writeFileSync(path,s);

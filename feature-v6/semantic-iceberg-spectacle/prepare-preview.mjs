import {readFileSync,writeFileSync} from 'node:fs';import {dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';const root=dirname(fileURLToPath(import.meta.url));let source=readFileSync(join(root,'verify.mjs'),'utf8');
const movie=`
await send('Emulation.setDeviceMetricsOverride',{width:960,height:600,deviceScaleFactor:1,mobile:false});await ev('document.querySelector("#panel").hidden=true;document.body.classList.add("clean");document.querySelector("#recover").style.visibility="hidden";__iceberg.modules.setPreset("base");__iceberg.mixer.pause()');
const dir=join(out,'preview-frames');mkdirSync(dir,{recursive:true});let frame=0;
for(const start of [72,154,212])for(let i=0;i<72;i++){await ev('__iceberg.seek('+(start+i/24)+')');const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(dir,String(frame++).padStart(4,'0')+'.png'),Buffer.from(r.data,'base64'));}
console.log(JSON.stringify({previewFrames:frame,fps:24,seconds:9,audio:false}));
`;
source=source.replace('assert.deepEqual(errors,[]);',movie+'assert.deepEqual(errors,[]);');writeFileSync(join(root,'preview.mjs'),source);

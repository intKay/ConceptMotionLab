import {cpSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),previous=join(root,'../semantic-iceberg-rhythm');
for(const name of ['foundation','corpus','luna-story','main.js','modules.js','papers.js','stickers.js','tempo.js','index.html','style.css','server.mjs','verify.mjs'])cpSync(join(previous,name),join(root,name),{recursive:true});mkdirSync(join(root,'out'),{recursive:true});
function edit(name,changes){let s=readFileSync(join(root,name),'utf8');for(const[a,b]of changes){if(!s.includes(a))throw Error(name+' missing '+a.slice(0,70));s=s.replace(a,b);}writeFileSync(join(root,name),s);}
edit('server.mjs',[["port=8800","port=8801"],["process.argv[2]||8800","process.argv[2]||8801"]]);
edit('modules.js',[
 ["import {Stickers}","import {Spectacle} from './spectacle.js';import {Stickers}"],
 ["stickers:'连续四面贴纸'","portals:'裂隙光门',storm:'纸片卷流',monoliths:'巨型字片折叠',ribbons:'光带穿流',audioReactive:'音乐能量响应',staged:'疏密场景编排',cinematic:'镜头张力',stickers:'连续四面贴纸'"],
 ["const base={stickers:","const base={portals:true,storm:true,monoliths:true,ribbons:true,audioReactive:true,staged:true,cinematic:true,intensity:1,stickers:"],
 ["cameraSpeed:1.8","cameraSpeed:1.35"],["paperSpeed:1.4","paperSpeed:1.15"],["associations:true","associations:false"],["stickerRefresh:true,stickerFlicker:true","stickerRefresh:false,stickerFlicker:false"],
 ["base:{title:'组合基板'","base:{title:'完整 · 裂隙远航'"],
 ["tower:{title:'A · 信息塔淹没',config:{...base,stickerMotion:true,ocean:true}}","tower:{title:'A · 光门穿越',config:{...base,storm:false,monoliths:false}}"],
 ["vortex:{title:'B · 黑洞与重力',config:{...base,blackHole:true,geometry:true,stickerMotion:true}}","vortex:{title:'B · 文字风暴',config:{...base,portals:false,monoliths:false,staged:false}}"],
 ["fracture:{title:'C · 字形与快纸',config:{...base,glyphs:true,trails:true}}","fracture:{title:'C · 失重折页',config:{...base,storm:false,portals:false,staged:false}}"],
 ["this.audio=new Underwater();","this.audio=new Underwater();this.spectacle=new Spectacle(scene);"],
 ["this.stickers.update(t,a,c,pathTime);","const composition=this.spectacle.update(t,a,position,c);this.stickers.update(t,a,c,pathTime,composition);"],
 ["this.papers.update(t,a,position,c);","this.papers.update(t,a,position,c,composition);"],
 ["this.debug={stickers:","this.debug={spectacle:this.spectacle.debug,stickers:"]
]);
edit('papers.js',[
 ["select:{value:0},trail:","select:{value:0},swirl:{value:0},impact:{value:0},trail:"],
 ["uniform float trail;varying","uniform float trail;uniform float swirl;uniform float impact;varying"],
 ["c.x+=sin(time*.12+phase*18.)*pressure*5.;c.y+=sin(time*.19+phase*11.)*(1.+pressure*4.);","float angle=phase*38.+time*.16+(-c.z)*.035;float radius=5.+phase*15.;vec2 orbit=vec2(cos(angle)*radius,sin(angle)*radius*.66);c.xy=mix(c.xy,orbit,swirl);c.x+=sin(time*.12+phase*18.)*pressure*2.;c.y+=sin(time*.19+phase*11.)*(.6+pressure*2.);"],
 ["gl_Position=projectionMatrix*modelViewMatrix*vec4(c+position,1.);","float rot=swirl*(angle+.6);float sz=mix(.48,1.25,phase);vec2 local=mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*position.xy*sz;alpha*=mix(.55,1.,phase)+impact*.22;gl_Position=projectionMatrix*modelViewMatrix*vec4(c+vec3(local,0.),1.);"],
 ["update(t,a,position,config){const pressure=","update(t,a,position,config,composition={storm:0,pressure:1,energy:0}){const raw="],
 ["active=config.flood?Math.floor(32+pressure*1120*config.density):32","pressure=raw*(config.staged?composition.pressure:1),active=config.flood?Math.floor(32+pressure*1120*config.density):32"],
 ["u.energy.value=a.mid+a.pulse*.25;","u.energy.value=a.mid+a.pulse*.25;u.swirl.value=config.storm?composition.storm:0;u.impact.value=composition.energy;"],
 ["['time','pressure','energy','select']","['time','pressure','energy','select','swirl','impact']"],
 ["pressure,direction:","pressure,swirl:u.swirl.value,direction:"]
]);
edit('stickers.js',[
 ["update(t,a,c,pathTime=t)","update(t,a,c,pathTime=t,composition={storm:0,fold:0,energy:0,pressure:1})"],
 ["p.strip.position.x=0;","p.strip.position.x=0;p.strip.rotation.z=c.cinematic?Math.sin(at*.07+t*.035)*composition.fold*.22:0;"],
 ["u.opacity.value=.2+a.mid*.15;","u.opacity.value=(.065+a.mid*.055)*(c.staged?(.4+composition.pressure*.6):1);u.tint.value.multiplyScalar(1+composition.energy*.2);"]
]);
edit('main.js',[
 ["world.update(t,a);","world.update(t,a);for(const layer of world.layers)layer.group.visible=false;const shot=modules.spectacle.compose(t,a,modules.config);"],
 ["Math.sin(t*.05)*clamp((t-110)/150)*.035","(Math.sin(t*.07)*shot.storm*.13+Math.sin(t*.033)*shot.fold*.18)*(modules.config.cinematic?1:0)"],
 ["composer.render();$('#clock')","atmosphere.halos.forEach(h=>h.visible=false);atmosphere.motes.material.opacity=.12+a.high*.1;camera.fov=modules.config.cinematic?62+shot.storm*14+shot.energy*3:64;camera.updateProjectionMatrix();bloom.strength=.65+shot.energy*.35;scene.background.setHex(0x030710);scene.fog.color.copy(scene.background);composer.render();$('#clock')"],
 ["$('#paperSpeed').value=modules.config.paperSpeed;","$('#paperSpeed').value=modules.config.paperSpeed;$('#intensity').value=modules.config.intensity;"],
 ["['cameraSpeed','paperSpeed']","['cameraSpeed','paperSpeed','intensity']"],
 ["position:camera.position.toArray(),","position:camera.position.toArray(),fov:camera.fov,"],
 ["$('#start').textContent='进入信息塔 ↘'","$('#start').textContent='进入裂隙远航 ↘'"]
]);
edit('index.html',[
 ["信息塔 · 节奏版","裂隙远航 · 画面探索"],["<h1>信息塔</h1>","<h1>裂隙远航</h1>"],
 ["词语从身边经过。<em>然后，水位上升。</em>","门后，还有一扇门。<em>语言开始折叠空间。</em>"],
 ["四面贴纸、流动纸片。<br>跟随音乐，慢慢被信息淹没。","裂隙光门、文字卷流、巨型折页。<br>从安静的入口，穿过失重的信息风暴。"],
 ["<h2>节奏与组件</h2>","<h2>画面与组件</h2>"],
 ["<label>视角速度",'<label>画面强度<input id="intensity" type="range" min=".3" max="1.5" step=".1" value="1"></label><label>视角速度'],
 ["节奏为24秒一轮的平滑加速与缓行，非逐鼓点校准。局部闪烁可独立关闭。","光门、卷流和折页响应本地音乐能量及瞬态分析；场景顺序为艺术编排，非人工逐鼓点校准。"]
]);
edit('verify.mjs',[
 ["fast.motion.pathTime>6*1.8","fast.motion.pathTime>6*1.35"],
 ["assert(s.modules.papers.active>sparse*5)","assert(s.modules.papers.active>sparse*2)"],
 ["assert(s.modules.stickers.motion);assert(s.modules.audio.enabled&&s.modules.audio.cutoff<10000);","assert(s.config.portals&&!s.config.storm);"],
 ["if(preset==='vortex')assert(s.config.blackHole&&s.config.geometry);","if(preset==='vortex')assert(s.config.storm&&!s.config.portals);"],
 ["if(preset==='fracture')assert(s.modules.glyphs.points>100&&s.modules.papers.trails===2);","if(preset==='fracture')assert(s.config.monoliths&&!s.config.storm);"],
 ["assert(s.modules.papers.selected.length>0);","assert.equal(s.config.associations,false);"],
 ["assert((await ev('__iceberg.state()')).modules.papers.active>500)","assert((await ev('__iceberg.state()')).modules.papers.active>300)"],
 ["stickerRefresh:'贴纸局部刷新',stickerFlicker:'贴纸局部闪烁',","stickerRefresh:'贴纸局部刷新',stickerFlicker:'贴纸局部闪烁',"],
 ["assert.equal((await ev('__iceberg.state()')).config[id],false);","assert.equal((await ev('__iceberg.state()')).config[id],!({stickerMotion:true,stickerRefresh:false,stickerFlicker:false,rhythm:true,cameraFast:true}[id]));"],
 ["assert.equal((await ev('__iceberg.state()')).config[id],true);","assert.equal((await ev('__iceberg.state()')).config[id],({stickerMotion:true,stickerRefresh:false,stickerFlicker:false,rhythm:true,cameraFast:true}[id]));"]
]);

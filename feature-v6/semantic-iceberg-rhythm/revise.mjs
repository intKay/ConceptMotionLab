import {cpSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),old=join(root,'../semantic-iceberg-next');
for(const name of ['foundation','corpus','luna-story','main.js','modules.js','papers.js','stickers.js','index.html','style.css','server.mjs','verify.mjs'])cpSync(join(old,name),join(root,name),{recursive:true});
mkdirSync(join(root,'out'),{recursive:true});
function edit(name,changes){let s=readFileSync(join(root,name),'utf8');for(const [a,b]of changes){if(!s.includes(a))throw Error(name+' missing '+a.slice(0,60));s=s.replace(a,b);}writeFileSync(join(root,name),s);}
edit('foundation/world.js',[["clamp(time,0,DURATION)","time"]]);
edit('server.mjs',[["port=8799","port=8800"],["process.argv[2]||8799","process.argv[2]||8800"]]);
edit('modules.js',[
 ["reverse:'深层流向反转'","reverse:'纸片反向（可选）'"],
 ["stickerMotion:'贴纸流动 / 局部刷新'","stickerMotion:'贴纸流动',stickerRefresh:'贴纸局部刷新',stickerFlicker:'贴纸局部闪烁',rhythm:'速度节奏变化',cameraFast:'视角加速'"],
 ["reverse:true","reverse:false"],["stickerMotion:false","stickerMotion:true,stickerRefresh:true,stickerFlicker:true,rhythm:true,cameraFast:true,cameraSpeed:1.8,paperSpeed:1.4"],
 ["update(t,a,position,mixer){","update(t,a,position,mixer,pathTime=t){"],
 ["this.stickers.update(t,a,c.stickers,c.stickerMotion)","this.stickers.update(t,a,c,pathTime)"]
]);
edit('papers.js',[
 ["import {TextSurge}","import {motionClock,tempoAt} from './tempo.js';import {TextSurge}"],
 ["c.z=-8.-mod(-center.z-travel*speed+5000.,65.);","c.z=12.-mod(-center.z-travel*speed+5000.,90.);"],
 ["smoothstep(8.,18.,-c.z)*(1.-smoothstep(50.,73.,-c.z))","smoothstep(1.,5.,abs(c.z))*(1.-smoothstep(55.,78.,-c.z))"],
 ["travel=travelAt(t,config.reverse)","travel=(config.reverse?-1:1)*3.8*motionClock(t,config.paperSpeed,config.rhythm)"],
 ["travelAt(t-lag,config.reverse)","(config.reverse?-1:1)*3.8*motionClock(t-lag,config.paperSpeed,config.rhythm)"],
 ["direction:config.reverse&&t>185?'远离视角':'朝向视角'","direction:config.reverse?'身后→前方':'前方→身后',speed:3.8*config.paperSpeed*tempoAt(t,config.rhythm)"]
]);
edit('stickers.js',[
 ["uniform float index;","uniform float refreshOn;uniform float flicker;uniform float index;"],
 ["motion*time*.004","motion*time*.018"],
 ["float refresh=motion*","float refresh=refreshOn*"],
 ["gl_FragColor=vec4(tint,(a.a*opacity+.008));","float cell=floor(uv.x*22.);float chosen=step(.82,fract(sin(cell*17.13+row*91.7+index*3.1)*43758.5));float blink=.55+.45*sin(time*2.6+row*.9+cell*.7+index);float light=mix(1.,.48+blink*.95,chosen*flicker);gl_FragColor=vec4(tint*light,(a.a*opacity+.008)*light);"],
 ["motion:{value:0},index:","motion:{value:0},refreshOn:{value:0},flicker:{value:0},index:"],
 ["update(t,a,enabled,motion){this.group.visible=enabled;","update(t,a,c,pathTime=t){const enabled=c.stickers,motion=c.stickerMotion;this.group.visible=enabled;"],
 ["p.strip.visible=Math.abs(t/30-(p.stage+.5))<2;","const cycle=Math.round((pathTime-(p.stage+.5)*30)/240),at=(p.stage+.5)*30+cycle*240;p.strip.position.copy(ride(at).position);p.strip.position.x=0;p.strip.visible=Math.abs(pathTime-at)<60;"],
 ["u.time.value=t;u.motion.value=motion?1:0;","u.time.value=t;u.motion.value=motion?1:0;u.refreshOn.value=c.stickerRefresh?1:0;u.flicker.value=c.stickerFlicker?1:0;"],
 ["motion};","motion,refresh:c.stickerRefresh,flicker:c.stickerFlicker,pathTime,visiblePanels:this.panels.filter(p=>p.strip.visible).length};"]
]);
edit('main.js',[
 ["import {SceneModules","import {motionClock,tempoAt} from './tempo.js';import {SceneModules"],
 ["free.copy(ride(t).position)","free.copy(ride(motionClock(t,modules.config.cameraFast?modules.config.cameraSpeed:1,modules.config.rhythm)).position)"],
 ["function syncControls(){$('#links').value=modules.config.density;","function syncControls(){$('#links').value=modules.config.density;$('#cameraSpeed').value=modules.config.cameraSpeed;$('#paperSpeed').value=modules.config.paperSpeed;"],
 ["syncControls();$('#hint')","syncControls();for(const id of ['cameraSpeed','paperSpeed'])$('#'+id).oninput=e=>{modules.config[id]=Number(e.target.value);};$('#hint')"],
 ["a=sample(data,t),r=ride(t);","a=sample(data,t),pathTime=motionClock(t,modules.config.cameraFast?modules.config.cameraSpeed:1,modules.config.rhythm),r=ride(pathTime);"],
 ["modules.update(t,a,r.position,mixer)","modules.update(t,a,r.position,mixer,pathTime)"],
 ["model:corpus.model,modules:","model:corpus.model,motion:{pathTime:motionClock(mixer.state().time,modules.config.cameraFast?modules.config.cameraSpeed:1,modules.config.rhythm),tempo:tempoAt(mixer.state().time,modules.config.rhythm)},modules:"]
]);
edit('index.html',[
 ["信息塔 · 连续基板","信息塔 · 节奏版"],["<h2>可拆装基板</h2>","<h2>节奏与组件</h2>"],
 ["<p class=\"note\">贴纸＝",'<label>视角速度<input id="cameraSpeed" type="range" min="1" max="3" step=".1" value="1.8"></label><label>纸片速度<input id="paperSpeed" type="range" min=".5" max="3" step=".1" value="1.4"></label><p class="note">节奏为24秒一轮的平滑加速与缓行，非逐鼓点校准。局部闪烁可独立关闭。贴纸＝']
]);
edit('verify.mjs',[["assert.equal(s.modules.papers.direction,'远离视角');checks.push({check:'explicit deep reversal',passed:true});","assert.equal(s.modules.papers.direction,'前方→身后');checks.push({check:'default paper flow crosses camera without deep reversal',passed:true});"]]);

import * as T from 'three';
const smooth=(a,b,t)=>{const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v);};
export function composition(t,a,c){
 const storm=c.staged?smooth(42,90,t)*(1-smooth(142,174,t))+.8*smooth(186,218,t)*(1-smooth(232,249,t)):1;
 const fold=c.staged?smooth(110,160,t)*(1-smooth(222,249,t)):1;
 const breath=1-.8*smooth(166,175,t)*(1-smooth(183,195,t));
 const energy=c.audioReactive?Math.min(1,Math.max(0,a.pulse*.85+a.mid*.35+a.bass*.3))*c.intensity:0;
 return {storm:Math.min(1,storm)*c.intensity,fold:fold*c.intensity,pressure:(.22+.78*Math.max(Math.min(1,storm),fold*.8))*breath,energy,breath};
}
function glyphMap(char){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const q=canvas.getContext('2d');q.font='400 410px "Noto Music Serif"';q.textAlign='center';q.textBaseline='middle';q.fillStyle='white';q.fillText(char,256,265);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return map;}
const sheetVertex=`varying vec2 vUv;uniform float time;uniform float fold;uniform float seed;void main(){vUv=uv;vec3 p=position;p.z+=sin(uv.x*3.14159)*fold*4.;p.x+=sin(uv.y*5.+seed+time*.15)*fold*.35;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const sheetFragment=`varying vec2 vUv;uniform sampler2D tex;uniform vec3 tint;uniform float opacity;uniform float energy;void main(){vec4 s=texture2D(tex,vUv);float edge=1.-smoothstep(.004,.012,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));float scan=pow(max(0.,sin(vUv.y*60.)),16.);float alpha=s.a*.78+edge*.55+scan*.018;gl_FragColor=vec4(tint*(1.+energy*.6),alpha*opacity);}`;
export class Spectacle{
 constructor(scene){
  this.group=new T.Group();scene.add(this.group);this.gates=[];this.sheets=[];this.rays=[];
  const beam=new T.BoxGeometry(1,1,1);
  for(let i=0;i<22;i++){const gate=new T.Group();this.group.add(gate);const material=new T.MeshBasicMaterial({color:0x83e8ef,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending});for(const [x,y,sx,sy]of [[-7,0,.065,12],[7,0,.065,12],[0,6,14,.065],[0,-6,14,.065]]){const m=new T.Mesh(beam,material);m.position.set(x,y,0);m.scale.set(sx,sy,.08);gate.add(m);}this.gates.push({group:gate,material});}
  const maps=['门','雨','空','无'].map(glyphMap);
  for(let i=0;i<20;i++){const material=new T.ShaderMaterial({vertexShader:sheetVertex,fragmentShader:sheetFragment,uniforms:{tex:{value:maps[i%4]},time:{value:0},fold:{value:0},seed:{value:i},tint:{value:new T.Color(0x91e6eb)},opacity:{value:.7},energy:{value:0}},side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending});const mesh=new T.Mesh(new T.PlaneGeometry(10,12,24,12),material);this.group.add(mesh);this.sheets.push(mesh);}
  for(let i=0;i<28;i++){const material=new T.MeshBasicMaterial({color:0x7cddff,transparent:true,opacity:.2,depthWrite:false,blending:T.AdditiveBlending});const ray=new T.Mesh(new T.PlaneGeometry(.025,18),material);this.group.add(ray);this.rays.push(ray);}
  this.debug={};
 }
 compose(t,a,c){return composition(t,a,c);}
 update(t,a,position,c){const s=composition(t,a,c),tint=new T.Color(0x58d9e8).lerp(new T.Color(0xa07bff),smooth(70,200,t));this.group.position.copy(position);
  this.gates.forEach(({group:g,material},i)=>{const z=10-((i*8.2-t*(2.3+s.storm*2)+10000)%180),depth=Math.max(0,-z);g.visible=c.portals;g.position.set(Math.sin(i*.55+t*.09)*s.storm*2,Math.cos(i*.5+t*.07)*s.storm*1.5,z);g.rotation.z=Math.sin(depth*.035+t*.12)*s.storm*.72+i*.045*s.fold;g.rotation.y=Math.sin(t*.08+i)*s.fold*.23;const scale=.75+depth*.006;g.scale.setScalar(scale);material.color.copy(tint).multiplyScalar(2.5+s.energy*1.4);material.opacity=(.14+.45*smooth(12,50,depth))*(1-smooth(135,180,depth))*s.breath;});
  this.sheets.forEach((m,i)=>{m.visible=c.monoliths;const angle=i*2.399+t*.06*s.fold,radius=12+s.fold*6,z=-14-((i*8.1-t*1.2+1000)%130);m.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius*.63,z);m.rotation.set(Math.sin(t*.07+i)*s.fold*.65,-Math.cos(angle)*(.4+s.fold*.5),Math.sin(angle)*.38+s.fold*Math.sin(t*.13+i)*.7);m.scale.setScalar(.7+s.fold*.6);const u=m.material.uniforms;u.time.value=t;u.fold.value=s.fold;u.tint.value.copy(tint).lerp(new T.Color(0xffc398),i%5===0?.6:0).multiplyScalar(1.6);u.energy.value=s.energy;u.opacity.value=(.025+s.fold*.36)*(1-smooth(95,140,-z))*s.breath;});
  this.rays.forEach((m,i)=>{m.visible=c.ribbons;const angle=i*2.399+t*.045,z=10-((i*4.7-t*(8+s.energy*6)+1000)%130);m.position.set(Math.cos(angle)*(9+i%6),Math.sin(angle)*(6+i%4),z);m.rotation.set(Math.PI/2,0,angle);m.material.color.copy(tint);m.material.opacity=(.05+s.energy*.17+s.storm*.06)*(1-smooth(70,120,-z))*s.breath;});
  this.debug={...s,gates:c.portals?22:0,sheets:c.monoliths?20:0,rays:c.ribbons?28:0,phase:t<42?'入口':t<142?'卷流':t<166?'折页':t<186?'悬停':t<232?'再涌入':'余波',audio:a.pulse};return s;
 }
}

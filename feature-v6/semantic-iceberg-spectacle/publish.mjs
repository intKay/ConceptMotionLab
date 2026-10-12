import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {dirname,resolve,join,relative,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),repo=resolve(root,'../..');
const prefix='feature-v6/semantic-iceberg-spectacle/',branch='codex/information-tower-spectacle';
function run(bin,args,{env=process.env,input}={}){
 const p=spawnSync(bin,args,{cwd:repo,encoding:'utf8',windowsHide:true,env,input});
 if(p.status!==0)throw Error(p.error?.message||p.stderr||p.stdout);
 return p.stdout.trim();
}
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='out'?[]:e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
const check=JSON.parse(readFileSync(join(root,'out/verification.json'),'utf8'));
if(check.errors.length||check.checks.length<41||check.checks.some(c=>c.passed===false))throw Error('Final checks not complete');
const paths=files(root).map(f=>relative(repo,f).split(sep).join('/'));
const allowed=new Set(['.js','.mjs','.json','.html','.css','.md','.ps1']);
if(paths.some(p=>!p.startsWith(prefix)||!allowed.has(extname(p).toLowerCase())))throw Error('Unexpected publish path');
const parent=run('git',['rev-parse','origin/main']);
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({branch,parent,paths},null,2));process.exit(0);}
const probe=spawnSync('git',['show-ref','--verify','--quiet','refs/heads/'+branch],{cwd:repo,windowsHide:true});
if(probe.status===0)throw Error('Existing branch preserved; inspect and resume manually');
if(probe.status!==1)throw Error('Branch lookup failed');
const env={...process.env,GIT_INDEX_FILE:join(root,'out/next-git-index')};
run('git',['read-tree',parent],{env});run('git',['add','-f','--',...paths],{env});
const tree=run('git',['write-tree'],{env});
// Validate every changed path before creating a branch or pushing.
const changed=run('git',['diff','--name-only',parent,tree]).split(String.fromCharCode(10)).filter(Boolean);
if(changed.length!==paths.length||changed.some(p=>!paths.includes(p)))throw Error('Unexpected commit change');
const commit=run('git',['commit-tree',tree,'-p',parent,'-m','feat: expressive portals, paper vortex and folding typography'],{env});
const record={branch,parent,commit,files:changed.length,phase:'committed'};
writeFileSync(join(root,'out/publish.json'),JSON.stringify(record,null,2));
run('git',['update-ref','refs/heads/'+branch,commit,'']);run('git',['push','origin',branch]);
record.phase='pushed';writeFileSync(join(root,'out/publish.json'),JSON.stringify(record,null,2));
const body=join(root,'out/pr-body.md');
writeFileSync(body,"用户反馈节奏版的画面不如此前四方向。本版新增独立“裂隙远航”探索：青色光门建立纵深，纸片形成旋转卷流，巨型字片弯曲与旋转；以入口、卷流、折页、喘息、再涌入、余波形成疏密及亮暗变化。降低背景贴纸亮度，保留前方至身后的纸片方向。\n\n新增光门、卷流、巨型字片、光带、音乐能量响应、疏密编排、镜头张力七个独立开关，共24项。画面强度、速度与数量滑块、四种构图及场景快捷跳转可组合；旧PR #4–#9不改不合并。\n\n源码只新增semantic-iceberg-spectacle目录，不含用户音乐、截图、日志或out。复用现有music-explorer本地依赖、曲目与long/fonts字体。启动node feature-v6/semantic-iceberg-spectacle/server.mjs，访问http://127.0.0.1:8801/。\n\n验证：本版41项独立Chrome检查通过，0页面异常；实际组件/滑块/快捷跳转事件、四预设乱序同刻像素一致、喘息密度下降、音乐响应开关及编码短样片播放/跳转均通过。9秒960×600/24fps无音轨样片只保存在本地，完整解码与黑场检查通过。详见TESTING.md。\n\n这是待用户比较的视觉探索，不宣称已审美验收。未人工听审、全曲验收或完成版导出；字片不是部首/笔画拆分，卷流非物理模拟。场景结构是艺术编排，音乐能量与瞬态来自现有本地分析数据，未人工逐鼓点校准。");
record.url=run('gh',['pr','create','--repo','intKay/ConceptMotionLab','--base','main','--head',branch,'--draft','--title','feat: 裂隙远航空间表现探索','--body-file',body]);
record.phase='draft-pr-created';writeFileSync(join(root,'out/publish.json'),JSON.stringify(record,null,2));
console.log(JSON.stringify(record));

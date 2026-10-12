import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {dirname,resolve,join,relative,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),repo=resolve(root,'../..');
const prefix='feature-v6/semantic-iceberg-next/',branch='codex/information-tower-base';
function run(bin,args,{env=process.env,input}={}){
 const p=spawnSync(bin,args,{cwd:repo,encoding:'utf8',windowsHide:true,env,input});
 if(p.status!==0)throw Error(p.error?.message||p.stderr||p.stdout);
 return p.stdout.trim();
}
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='out'?[]:e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
const check=JSON.parse(readFileSync(join(root,'out/verification.json'),'utf8'));
if(check.errors.length||check.checks.length<15||check.checks.some(c=>c.passed===false))throw Error('Final checks not complete');
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
const commit=run('git',['commit-tree',tree,'-p',parent,'-m','feat: modular information tower foundation and exploration presets'],{env});
const record={branch,parent,commit,files:changed.length,phase:'committed'};
writeFileSync(join(root,'out/publish.json'),JSON.stringify(record,null,2));
run('git',['update-ref','refs/heads/'+branch,commit,'']);run('git',['push','origin',branch]);
record.phase='pushed';writeFileSync(join(root,'out/publish.json'),JSON.stringify(record,null,2));
const body=join(root,'out/pr-body.md');
writeFileSync(body,`组合四面贴纸、纸片洪流和沉浸呈现为可拆装基板。贴纸连续覆盖，32个正文及完整块互不相同，允许局部词语回响；关联纸片显亮替代默认中央长句字幕。

13个独立开关、数量滑块、鼠标观察和恢复控件；附信息塔淹没、黑洞与重力错觉、字形像素裂解与快纸拖影三个初步预设。真实部首及笔画尚未实现，黑洞是艺术意象。

只新增semantic-iceberg-next目录，旧方向和PR #4–#7保留，不纳入当前checkout的其他修改。archive保留16份源码和SHA-256；foundation冻结基础模块。

本地启动：node feature-v6/semantic-iceberg-next/server.mjs，访问 http://127.0.0.1:8799/。需要已有music-explorer依赖、本地音乐和long/fonts字体，音乐不随PR分发。

验证：原对话实际运行15项独立Chrome检查，0页面异常；886种语料字符字体覆盖通过。见TESTING.md。headless静音，仅验证播放状态和声场参数，未人工听审、全曲审美验收或MP4导出。

发布脚本已修复Windows路径、换行和扩展名校验，并提供--dry-run文件清单；不上传音频、截图、日志或out目录，不合并旧PR。
`);
record.url=run('gh',['pr','create','--repo','intKay/ConceptMotionLab','--base','main','--head',branch,'--draft','--title','feat: 信息塔可拆装基板与三种探索预设','--body-file',body]);
record.phase='draft-pr-created';writeFileSync(join(root,'out/publish.json'),JSON.stringify(record,null,2));
console.log(JSON.stringify(record));

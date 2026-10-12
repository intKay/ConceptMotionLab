import {readFileSync,writeFileSync} from 'node:fs';import {dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));let source=readFileSync(join(root,'../semantic-iceberg-rhythm/publish.mjs'),'utf8');
source=source.replaceAll('semantic-iceberg-rhythm','semantic-iceberg-spectacle').replaceAll('information-tower-rhythm','information-tower-spectacle').replace('check.checks.length<22','check.checks.length<41').replace('feat: 信息塔节奏与加速控件','feat: 裂隙远航空间表现探索').replace('feat: modular information tower foundation and exploration presets','feat: expressive portals, paper vortex and folding typography');
const start=source.indexOf('writeFileSync(body,`'),end=source.indexOf('`);',start);
if(start<0||end<0)throw Error('PR body marker missing');
const body=`用户反馈节奏版的画面不如此前四方向。本版新增独立“裂隙远航”探索：青色光门建立纵深，纸片形成旋转卷流，巨型字片弯曲与旋转；以入口、卷流、折页、喘息、再涌入、余波形成疏密及亮暗变化。降低背景贴纸亮度，保留前方至身后的纸片方向。

新增光门、卷流、巨型字片、光带、音乐能量响应、疏密编排、镜头张力七个独立开关，共24项。画面强度、速度与数量滑块、四种构图及场景快捷跳转可组合；旧PR #4–#9不改不合并。

源码只新增semantic-iceberg-spectacle目录，不含用户音乐、截图、日志或out。复用现有music-explorer本地依赖、曲目与long/fonts字体。启动node feature-v6/semantic-iceberg-spectacle/server.mjs，访问http://127.0.0.1:8801/。

验证：本版41项独立Chrome检查通过，0页面异常；实际组件/滑块/快捷跳转事件、四预设乱序同刻像素一致、喘息密度下降、音乐响应开关及编码短样片播放/跳转均通过。9秒960×600/24fps无音轨样片只保存在本地，完整解码与黑场检查通过。详见TESTING.md。

这是待用户比较的视觉探索，不宣称已审美验收。未人工听审、全曲验收或完成版导出；字片不是部首/笔画拆分，卷流非物理模拟。场景结构是艺术编排，音乐能量与瞬态来自现有本地分析数据，未人工逐鼓点校准。`;
source=source.slice(0,start)+'writeFileSync(body,'+JSON.stringify(body)+');'+source.slice(end+3);writeFileSync(join(root,'publish.mjs'),source);

# 信息塔 · 可拆装基板

启动 `node feature-v6/semantic-iceberg-next/server.mjs`，打开 http://127.0.0.1:8799/。点击进入允许浏览器播放本地音乐；鼠标移动观察，无需按下拖动。右下“展开控件”、H或Esc恢复界面，然后打开设置，可选择预设、开关模块、调节纸片数量和音量、跳到任意层。

直接体验：`/?preset=base` 组合基板；`/?preset=tower` 信息塔淹没；`/?preset=vortex` 黑洞与重力；`/?preset=fracture` 字形与快纸。三个小样共享同一基板，设置里每项都可独立拆开。不要把这些初步效果视为全曲审美验收。

保留：上一轮原型及四方向目录未改，PR#4–#7仍独立保留；本版archive/留16份源码及SHA-256档案，属于源文件快照，不是另一个完整运行包。已有上一轮比较入口仍是 http://127.0.0.1:8798/ 。本版foundation/冻结两个自有基础模块，不依赖以后改动实验目录。

模块：stickers.js负责连续贴纸和局部动态；papers.js负责纸片数量、快慢、反向、关联显亮和拖影；modules.js的PRESETS/LABELS及SceneModules组合它们，GeometryIllusion/GlyphFracture/Underwater各自独立开关。模块统一接收绝对时间、固定音频分析、位置和config，不依赖每帧重抽或累积积分。关闭不删除实例/源码，切换预设可以恢复。新效果应增加独立配置项，避免直接修改旧方向。

去重范围：32个贴纸正文分块及完整贴纸字符串互不相同；局部短词有意回响。没有声称所有字词绝不重复。纸片槽位仍复用256词组，未冒称增加1152条原创文本。固定中央歌词高亮关闭，关联显亮来自实际流动纸片。

自有音效：用户音乐仅本地引用；淹没预设对播放声场做低通并叠加固定种子原创低频噪声，可单独关闭。未人工听审。GlyphFracture只采样字体像素，尚未接入部首/笔画结构；黑洞为艺术意象。

复用现有Three.js、SpatialLyrics/Atmosphere、音频分析与本地Noto字体。沿用long/fonts/的OFL许可，不复制用户音频，不上传歌曲/歌词、截图、日志、生成输出或浏览器profile。源码PR可复核，未导出成片。本版内容与探索清单见FEEDBACK.md、EXPLORATION.md。

检查命令：`node --check main.js`、`node --check modules.js`、`node --check stickers.js`、`node --check papers.js`；`node verify.mjs`用独立临时Chrome实际验证。详细结果只在本地out/，摘要见TESTING.md。

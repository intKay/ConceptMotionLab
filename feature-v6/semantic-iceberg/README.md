# 指称之外 · 语义冰山

本地 3D 交互 demo。词与词的局部关联留下，整体指称逐层失去锚点。熟悉房间 → 语言符号 → 注意力隐喻 → 梦核走廊 → 无法言说。八层、240 秒下潜，最后停留至音乐结束；可随时跳层审看。

运行：在本目录执行 `node server.mjs`，打开 http://127.0.0.1:8797/ ，或运行 `start.ps1`。本地已有 Node 和 Three.js，无需新增安装。

点击“进入指称之外”允许浏览器播放本地音乐。自动下潜时拖动环视；R / 自由漂浮切换 WASD 行走，空格升、C 降、Shift 加速、方向键环视。H 隐藏界面，Esc 恢复。进度条回退；“返回水面”重置。文本档案可跳层、阅读长文本、调整连线密度/音量、隐藏空间词组。

## 真实复用与来源

- 只读引用 `../music-explorer/v3/lyrics.js` 的 SpatialLyrics：渐变文字、三种入场、字形像素采样与消散粒子。前景内容替换为 Luna 原创文本，并非曲目歌词，也不是演唱字幕。
- 只读引用 `../music-explorer/v3/atmosphere.js` 的 Atmosphere：固定种子微粒、幕布、音频能量响应。
- 引用已有 Mixer 和真实 FLAC 音频分析 `radiohead.json`；效果强度来自实际音频频段/RMS/瞬态。粒子不是统计数据。
- 256+ 空间词组、两侧长文本墙及前景文字均来自独立 GPT-6-Luna 会话的 `corpus/`，不以主聊天生成文本冒充 Luna。
- 配乐：用户已有四首素材之一，Radiohead / Kid A / Everything In Its Right Place；ffprobe 实际核对 251.426667 秒。主题呼应是制作判断；没有 BPM、副歌、逐字声学对位或人工听审结论。本地音乐和曲目歌词没有复制到此目录，不公开上传。
- 本地 Noto Serif/Sans SC 字体来自 `long/fonts/`，保留该目录 OFL 许可证。本服务仅允许这两个字体及明确白名单旧模块/素材，拒绝访问其他旧项目文件。

## 概念边界与参考

词组序列、弧线和八层布局属于艺术编排。没有调用运行时模型，没有记录真实注意力矩阵；空间距离不代表 embedding 测量。局部桥接的“读得懂”与“整体未知”是创作意图，不等于语言学冰山中的学说都成立。

- 用户给出的 [Duncan Clarke — The Linguistics Iceberg Explained，13:53](https://www.youtube.com/watch?v=GFz6KqZurFY&t=833s)。检索核对标题/作者；页面抓取失败，未获取完整字幕。仅参考向深层推进的结构，不转述未经核实的该时点内容。
- [Vaswani 等，Attention Is All You Need](https://arxiv.org/abs/1706.03762)：Transformer 注意力架构原始论文；用于区分真实结构与本作的诗化连线，未复现训练/推理。

## 检查

`node --check main.js`、`node --check world.js`；`node verify.mjs` 用独立临时 Chrome profile 实际运行页面，播放本地音频、八层跳转/截图、乱序回退确定性、暂停、WASD/拖动、面板控件和移动布局。结果写 `out/verification.json`，失败记录另写，不能当作通过。

这是可玩原型，未导出 MP4；工程检查不能代替听审、审美判断或全曲人工验收。具体最终状态见 HANDOFF.md。

2026-10-12 最终记录：独立 Chrome 18项通过，无页面异常；八层截图与控件截图已保存。`node font-check.mjs` 检查886种语料字符，两个实际字体均无缺字。Luna 共8层256词组、6341汉字长文本档案。源码与原创语料经独立 PR 提交；音乐、截图、日志、验证输出和 MP4 未随本次提交。

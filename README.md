# Concept Motion Lab

当前完整成片为 [v5《偶然的秩序》](feature-v5/README.md)：3 分 44 秒、1920×1080、30 fps、14 场。文件：`feature-v5/out/film-v5.mp4`；[放映页](http://127.0.0.1:8780/feature-v5/watch.html)。v4 与 long 旧成片保留。

代码制作的中文概率统计动画：固定种子模型、Canvas 动画、原创程序配乐与离线 MP4 导出。

## 当前版本与交付

- **v5《偶然的秩序》**：完整成片，224 秒，1080p / 30 fps，无口播。涵盖组合数、条件概率、大数定律、CLT、置信区间及二项检验。[重建说明](feature-v5/README.md) · [历史验证记录](feature-v5/verification.md)。
- **v6 实验样片**：Claude 已实际实现米色记录纸、几何包豪斯、检查悖论《你撞见的黑暗》和 Pólya 随机游走《回家的概率》四个方向。最新 Pólya 样片为 48 秒、带原创配乐；用户风格验收、Codex 数学与媒体复核尚未完成。[Pólya 设计与模型](feature-v6/polya/DESIGN.md) · [交接记录](HANDOFF.md)。
- 源码和文档通过 **PR** 更新；MP4 成片通过 [Releases](https://github.com/intKay/ConceptMotionLab/releases) 分发。生成的 `out/` 不进入 Git。
- 根目录 `index.html` 是早期 v3。新版预览先运行 `node scripts/preview.mjs`，然后访问 `http://127.0.0.1:8780/feature-v6/gallery.html`；Pólya 入口为 `/feature-v6/polya/index.html`。预览音轨需按各方向的重建说明先生成。

## 协作与素材范围

[AGENTS.md](AGENTS.md) 为共同规则，[CLAUDE.md](CLAUDE.md) 为 Claude 入口。Claude 主导视觉实现；Codex 负责数学、工程、导出与媒体验证。新动画写入 `feature-v6/`，旧版保留。

本仓库保留本地 Noto 中文字体及其 OFL 许可证。尚未为项目源码选择开源许可证。第三方参考代码副本、MV 歌曲及歌词素材未纳入本次提交；参考链接及分析保留。

## 早期 v3 使用说明

以下为早期 v3 样片说明。以代码绘图制作音画同步的概念动画。48 秒《随机汇聚成规律》连续演化版：1920×1080、30 fps、11 段镜头、120 BPM 原创配乐和音效。新版文件为 `out/sample-v3.mp4`；前两版保存在 `out/sample-v1.mp4`、`out/sample-v2.mp4`，源文件分别保存在 `archive/v1/`、`archive/v2/`。

## 快速使用

环境：Windows，Python 3.11+（`numpy`）、Node.js 22+、Chrome 或 Edge、FFmpeg。使用系统字体“微软雅黑”。无需 npm 安装。若浏览器不在常见安装路径，设置环境变量 `CHROME` 为可执行文件路径。

```powershell
python scripts/music.py
node scripts/export.mjs --shots 1.5,4.7,9.7,12.8,17.8,20.8,21.8,24.5,28,33.5,38.5,42.5,45.5
node scripts/export.mjs --verify
node scripts/export.mjs --out out/sample-v3.mp4
node scripts/preview.mjs
```

输出位于 `out/`：`soundtrack.wav`、`sample-v3.mp4` 和 `shots/`。启动预览后打开 `http://127.0.0.1:8780`，可以播放和拖动时间轴。由于采用 JavaScript 模块，常规浏览器预览需要通过此本地服务。先生成音轨才能听到音乐。空格暂停／播放，左右方向键逐秒跳转。

只渲染一个片段可用 `node scripts/export.mjs --from 10 --to 20 --out out/galton.mp4`。镜头时长、字幕与音效点都在 `timeline.json`。改动后重新生成音轨与视频。

## 工程结构

- `timeline.json`：唯一的场景、时长、节拍和音效提示点来源。
- `src/film-v3.js`：Canvas 绘制、文字标注与浏览器预览；`window.__frame(t)` 供逐帧导出。导出每帧混合两次短间隔采样以缓解高速运动的跳动。`src/film.js` 为第二版旧入口，当前页面不加载它。
- `src/choreography.js`：各镜头的粒子坐标及跨镜头连续变形；相邻镜头用 1.2 秒交接，同一粒子沿弧线迁移，几何和标题分别控制淡入淡出。
- `src/model.js`：固定种子生成的 4800 条路径、对应直方图、理论二项概率、延长到 64／256 次的采样，以及 12 组长度为 1000 的频率轨迹。
- `scripts/music.py`：按同一时间轴生成原创双声道 WAV；两遍响度测量及归一化目标为 −16 LUFS，源音轨真峰值上限 −3 dBTP，为 AAC 编码后的峰值变化保留余量。
- `scripts/export.mjs`：驱动无头浏览器按精确时间取帧，交由 FFmpeg 编码 H.264/AAC MP4。

每帧只由时间和固定种子数据决定。预览由音频时钟驱动；离线导出以 `帧号 / fps` 取样，因此机器速度不改变镜头内容。浏览器只需支持 Canvas 2D；三维场景使用程序透视投影。检查命令验证跨镜头跳转后同一时刻的 JPEG 哈希一致、音频与时间轴长度一致，并检查全部粒子在 10 次转场的开始／中点／结束附近没有位置跳变。

## 内容与下一阶段

新版演出顺序：火花爆发 → 粒子硬币 → 选择树 → 16 层概率钉板 → 粒子直方图 → 双股粒子流收窄 → 12 条频率轨迹 → 波浪点阵 → 独立性粒子环 → 旋涡聚字 → 标题。

钉板每次左右选择等概率且独立；直方图记录同一批 4800 个粒子向右选择的次数。理论分布为 Binomial(16, ½)，恰好 8 次向右对应 12,870 条路径，全向右只有一条。

20–26 秒中，每个粒子的水平位置代表一组试验的正面频率，竖直方向以旋转双股流表现。固定显示的 n = 16、64、256 来自同一组逐步延长的实际伪随机试验；阶段间的位置插值用于形变，画面以箭头表示过渡。公式 σ = 1/(2√n) 是公平、独立硬币模型下的理论标准差，样本中观测到的标准差会有小幅偏差。

12 条频率轨迹来自不同种子的公平硬币试验，强调“趋近概率不等于每一步都更接近”。粒子环说明前面的结果不会改变下一次的概率。波浪和旋涡是视觉意象。第三版的反馈对应关系见 [docs/v3-direction.md](docs/v3-direction.md)，检查结果见 [docs/v3-verification.md](docs/v3-verification.md)。

后续长片可扩展 `timeline.json` 场景并替换音轨策略；歌曲 MV 需要先确定歌曲文件及使用范围，再添加歌词逐字时间数据。此工程当前没有接入 Blender MCP，因为样片的核心效果由实时图形与逐帧导出实现。

参考项目及具体借鉴点见 [docs/references.md](docs/references.md)。工程中的代码、文案、图形和音乐均为新创作，未复制参考仓库的素材。

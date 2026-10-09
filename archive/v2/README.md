# Concept Motion Lab

以代码绘图制作音画同步的概念动画。当前为 45 秒《随机汇聚成规律》粒子演出版：1920×1080、30 fps、11 段镜头、144 BPM 原创配乐和音效。新版文件为 `out/sample-v2.mp4`；上一版保存在 `out/sample-v1.mp4`，源文件保存在 `archive/v1/`。

## 快速使用

环境：Windows，Python 3.11+（`numpy`）、Node.js 22+、Chrome 或 Edge、FFmpeg。使用系统字体“微软雅黑”。无需 npm 安装。若浏览器不在常见安装路径，设置环境变量 `CHROME` 为可执行文件路径。

```powershell
python scripts/music.py
node scripts/export.mjs --shots 1.4,4.6,8.6,12.8,18,21.5,26,29.8,34,38.8,41.7
node scripts/export.mjs --verify
node scripts/export.mjs --out out/sample-v2.mp4
node scripts/preview.mjs
```

输出位于 `out/`：`soundtrack.wav`、`sample-v2.mp4` 和 `shots/`。启动预览后打开 `http://127.0.0.1:8780`，可以播放和拖动时间轴。由于采用 JavaScript 模块，常规浏览器预览需要通过此本地服务。先生成音轨才能听到音乐。空格暂停／播放，左右方向键逐秒跳转。

只渲染一个片段可用 `node scripts/export.mjs --from 10 --to 20 --out out/galton.mp4`。镜头时长、字幕与音效点都在 `timeline.json`。改动后重新生成音轨与视频。

## 工程结构

- `timeline.json`：唯一的场景、时长、节拍和音效提示点来源。
- `src/film.js`：Canvas 粒子、三维透视、动效文字与浏览器预览；`window.__frame(t)` 供逐帧导出。导出每帧混合两次短间隔采样以缓解高速运动的跳动。
- `src/model.js`：固定种子生成的 3200 条路径、对应直方图、理论二项概率，以及 12 组试验频率。
- `scripts/music.py`：按同一时间轴生成原创双声道 WAV；两遍响度测量及归一化目标为 −16 LUFS，源音轨真峰值上限 −3 dBTP，为 AAC 编码后的峰值变化保留余量。
- `scripts/export.mjs`：驱动无头浏览器按精确时间取帧，交由 FFmpeg 编码 H.264/AAC MP4。

每帧只由时间和固定种子数据决定。预览由音频时钟驱动；离线导出以 `帧号 / fps` 取样，因此机器速度不改变镜头内容。浏览器只需支持 Canvas 2D；三维场景使用程序透视投影。检查命令验证跨镜头跳转后同一时刻的 JPEG 哈希一致，并核对音频与视频时间轴长度。

## 内容与下一阶段

新版演出顺序：火花爆发 → 粒子硬币 → 选择树 → 16 层概率钉板 → 粒子直方图 → 概率地形 → 12 条频率轨迹 → 粒子环 → 波浪点阵 → 旋涡聚字 → 标题。

钉板每次左右选择等概率且独立；直方图记录同一批 3200 个粒子向右选择的次数。理论分布为 Binomial(16, ½)。概率地形是在此离散分布上做的艺术性空间延展；粒子环、波浪和旋涡是视觉意象。12 条频率轨迹来自不同种子的独立公平硬币试验。未用动画的插值数值冒充真实采样结果。

后续长片可扩展 `timeline.json` 场景并替换音轨策略；歌曲 MV 需要先确定歌曲文件及使用范围，再添加歌词逐字时间数据。此工程当前没有接入 Blender MCP，因为样片的核心效果由实时图形与逐帧导出实现。

参考项目及具体借鉴点见 [docs/references.md](docs/references.md)。工程中的代码、文案、图形和音乐均为新创作，未复制参考仓库的素材。

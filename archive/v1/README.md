# Concept Motion Lab

以代码绘图制作音画同步的概念动画。本阶段的成品是 45 秒样片《随机汇聚成规律》：1920×1080、30 fps、中文字幕、原创程序配乐和音效。

## 快速使用

环境：Windows，Python 3.11+（`numpy`）、Node.js 22+、Chrome 或 Edge、FFmpeg。使用系统字体“微软雅黑”。无需 npm 安装。若浏览器不在常见安装路径，设置环境变量 `CHROME` 为可执行文件路径。

```powershell
python scripts/music.py
node scripts/export.mjs --shots 3,12,22,32,41
node scripts/export.mjs
```

输出位于 `out/`：`soundtrack.wav`、`sample.mp4` 和 `shots/`。直接在浏览器打开 `index.html` 可以播放和拖动时间轴；先生成音轨才能在预览时听到音乐。空格暂停／播放，左右方向键逐秒跳转。

只渲染一个片段可用 `node scripts/export.mjs --from 17.5 --to 27.5 --out out/converge.mp4`。镜头时长、字幕与音效点都在 `timeline.json`。改动后重新生成音轨与视频。

## 工程结构

- `timeline.json`：唯一的场景、时长、节拍和音效提示点来源。
- `src/visual.js`：确定性 Canvas 图形、WebGL2 背景和浏览器预览；`window.__frame(t)` 供逐帧导出。
- `scripts/music.py`：按同一时间轴生成原创双声道 WAV。
- `scripts/export.mjs`：驱动无头浏览器按精确时间取帧，交由 FFmpeg 编码 H.264/AAC MP4。

每帧只由时间和固定种子数据决定。预览由音频时钟驱动；离线导出以 `帧号 / fps` 取样，因此机器速度不改变镜头内容。WebGL2 不可用时，背景退回 Canvas 渐变，数据画面仍可显示。

## 内容与下一阶段

五段内容是：随机粒子 → 抛硬币重复试验 → 正面频率收敛 → **另一种随机变量**的样本直方图 → 分布曲线。直方图并非硬币试验的结果；这一区分写在字幕里。

后续长片可扩展 `timeline.json` 场景并替换音轨策略；歌曲 MV 需要先确定歌曲文件及使用范围，再添加歌词逐字时间数据。此工程当前没有接入 Blender MCP，因为样片的核心效果由实时图形与逐帧导出实现。

参考项目及具体借鉴点见 [docs/references.md](docs/references.md)。工程中的代码、文案、图形和音乐均为新创作，未复制参考仓库的素材。

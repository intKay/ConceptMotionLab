# Concept Motion Lab

**用代码把概念、故事和声音变成运动的画面。**

Concept Motion Lab 是一个代码动画与视听实验仓库，探索程序图形、动态设计、叙事短片和音乐可视化。主题可以来自数学与科学，也可以来自生活观察、文学意象与声音体验。概率统计是目前已有作品的起点，后续创作可按主题选择表达方式与技术。

这里同时保存作品源码、模型与时间轴、设计说明、导出工具和验证记录，支持从短样片到完整成片的迭代。

## 创作方向

- **概念可视化**：把抽象关系变成可追踪的路径、形变、空间与因果过程。
- **动态设计与生成艺术**：探索中文排版、几何、粒子、材质、镜头和转场。
- **视听叙事**：让构图、节奏与声音共同推进一个问题或一段故事。
- **音乐可视化与 MV 实验**：探索声音事件、画面变化和歌词之间的联系，素材需具备相应使用与分发授权。

这些是仓库的创作范围；具体完成状态以作品说明和交接记录为准。

## 现有作品

| 作品 | 内容 | 状态与入口 |
|---|---|---|
| v5《偶然的秩序》 | 从“16 抛 12 正面”展开概率、统计与推断；224 秒，1080p / 30 fps，原创程序配乐 | 已交付完整成片：[下载 Release](https://github.com/intKay/ConceptMotionLab/releases/tag/v5.0.0) · [作品与重建说明](feature-v5/README.md) |
| v6《回家的概率》 | Pólya 随机游走：维度如何改变回返；48 秒，带原创配乐 | 实验样片，待用户验收与完整复核：[设计与模型](feature-v6/polya/DESIGN.md) |
| v6《你撞见的黑暗》 | 用萤火与目光表达检查悖论及长度偏倚；24 秒，带配乐 | 实验样片：[设计说明](feature-v6/fireflies/DESIGN.md) |
| v6 视觉风格探索 | 米色记录纸与几何包豪斯两种硬币主题表达；各 24 秒，无配乐 | 视觉样片：[记录纸](feature-v6/DESIGN.md) · [包豪斯](feature-v6/bauhaus/DESIGN.md) |
| v3、long、v4 | 概率动画的早期版本与长片迭代 | 保留源码与历史记录，供比较和复现 |

样片、编码成片、工程验证和用户验收分别记录；工程检查通过不等于完成审美评价或人工听审。详细状态见 [HANDOFF.md](HANDOFF.md)。

## 观看与预览

**直接观看成片**：到 [Releases](https://github.com/intKay/ConceptMotionLab/releases) 下载 MP4。视频、生成音轨和大批抽帧不进入 Git 历史。

**运行源码预览**：在项目根目录执行：

```powershell
node scripts/preview.mjs
```

然后打开对应页面：

- v6 样片导航：<http://127.0.0.1:8780/feature-v6/gallery.html>
- Pólya 样片：<http://127.0.0.1:8780/feature-v6/polya/index.html>
- v5 实时动画：<http://127.0.0.1:8780/feature-v5/index.html>
- v5 成片放映页：<http://127.0.0.1:8780/feature-v5/watch.html>；需先将 Release 的 `film-v5.mp4` 放入 `feature-v5/out/`。

根目录 `index.html` 是早期 v3 入口。带配乐的源码预览通常需要先生成音轨；各作品的生成顺序见其说明。

## 重建与工程约定

现有导出流程主要使用 Node.js、Python、Chrome 或 Edge、FFmpeg；Python 依赖按作品包括 NumPy、Pillow 等。脚本与环境需求随作品变化，请从 [v5 重建说明](feature-v5/README.md)、[Pólya 重建说明](feature-v6/polya/DESIGN.md) 或对应设计文档开始。

- 预览与离线导出共用时间驱动的绘制逻辑；模拟数据提前固定，避免每帧重新抽样。
- 在涉及数学或数据的作品中，区分观察、模拟、理论与装饰，保留模型条件和核对依据。
- 每个版本的生成产物写入自己的 `out/`，保留历史成片。
- 对最终编码文件检查完整解码、音视频长度、字幕与转场、实际播放和跳转，并如实记录未执行的检查。

[v5 历史验证](feature-v5/verification.md) · [v5 发布复核](docs/release-v5-2026-10-09.md) · [参考资料](docs/references.md)

## 目录

| 路径 | 用途 |
|---|---|
| `feature-v6/` | 当前动画样片与方向探索 |
| `feature-v5/` | v5 完整作品的源码、模型、配乐和验证工具 |
| `feature-v4/`、`long/`、`archive/` | 历史版本与迭代记录 |
| `src/`、`scripts/`、`timeline.json` | 早期作品及本地预览、导出工具 |
| `long/fonts/` | 本地 Noto 中文字体及 OFL 许可证 |
| `docs/` | 参考分析、工程验证与交付记录 |

## 协作与交付

Claude 主导视觉语言、中文排版、构图、镜头、转场与动画实现；Codex 负责数学检查、工程接口、运行问题、导出及媒体验证；用户决定视觉方向。当前协作流程见 [AGENTS.md](AGENTS.md)、[CLAUDE.md](CLAUDE.md) 和 [HANDOFF.md](HANDOFF.md)。

源码与文档通过独立分支和 **Pull Request** 更新，成品通过 **Releases** 分发。未经验收的样片须明确标记。

## 许可与素材

目前尚未为项目源码选择开源许可证。Noto 字体保留各自的 OFL 许可证。第三方参考代码副本、MV 歌曲和歌词素材未纳入当前提交；素材的使用和分发权限需单独确认，不能从仓库内其他文件的许可推断。

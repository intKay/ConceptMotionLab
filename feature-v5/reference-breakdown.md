# v5 源文件复核与原创转化

2026-09-29 重新从 GitHub 获取 14 个源文件，未仅沿用 v4 的结论。`references/manifest.json` 记录 commit、原始 URL 与 SHA-256；原文只作审查依据，不进入运行时。

| 参考与核对文件 | 已确认机制 | v5 的独立实现 |
|---|---|---|
| [abstract-algebra-promo](https://github.com/AnctyEnly453/abstract-algebra-promo/tree/5d01a758af8b4b3b7bb5a2a5b7f0efb4cf1667eb)：`promo.html` 的 `proj`、`titlePts`、`accumulate`、`post` 及场景；`e8.py`；`music.py` | 先准备数学数据；透视投影；粒子由几何经中间状态聚字；帧累积与后处理分工；标题大小及中英文字体分工 | 真实 16 步路径投影成钉板；相同粒子落入按计数分组的位置；概率柱从立体建筑压成平面图；片尾聚字。采用 2 个时间子样本，仅几何运动模糊，文字单独清晰绘制；不声称达到参考的 GPU 后处理品质 |
| [pdoom-video](https://github.com/mexicat/pdoom-video/tree/bdbad537a7b7af3213475651774030c47568c181)：`docs/TREATMENT.md`、`docs/ENGINE.md`、`dense-press.ts`、`loom.ts`、`timeline.ts` | 同一个视觉信号变换身份；各场独立视觉语法；场内切镜、停顿后急动、下拍剪辑；文字参与物理压缩；按时间确定画面，先看关键帧再看片段 | 橙色 12/16 依次成为路径、分布标线、频率起点与检验尾部。条件概率用裁切后的剩余样本空间替换分母；区间采用印刷过程；p 值用双尾碎片汇入同一面积尺。数字受数据约束，不复制原片道具或歌词 |
| [world.execute-me-ascii](https://github.com/yym8224961/world.execute-me-ascii/tree/9d8e815281a104ccb648ec2f2df88cd9f0cb8c12)：`scenes.py` 的场景调度与 `glitch_intensity`；`player.py` 音频时钟与字幕定位 | 文本介质仍能有空间投影和不同阶段的运动强度；音频时间支配画面；故障强度随叙事累积 | 路径段短暂使用二进制排版；拍点触发计数和字符切换；预览使用音频时钟，跳转及离线渲染同一时间函数。仅转场有细碎切片，不在公式阅读期间制造故障 |
| [linear-algebra-promo](https://github.com/guchang233/linear-algebra-promo/tree/1c41a7e6ac34da79fa13b90314355a47f93604c0)：`timeline.py`、`s05_image.py` 的 `part_zoom`/`part_svd`、`s02_eigen.py`、`music.py` | 120 BPM 下不等长章节；一场分多个机制；SVD 用真实数值重建，秩变化与声音、画面一起推进；图像粒子变为下一场波形 | 14 场 224 秒；CLT 分为“取样→求均值→重复→标准化”而不是三张柱图替换；n=1/4/16 共用底层模拟，密度轴保持数学一致；直方图及标准化有明确轴标签 |

## 数学依据

- [NIST：置信区间](https://www.itl.nist.gov/div898/handbook/prc/section1/prc14.htm)：正态总体、已知 σ 时的区间公式及重复覆盖解释。
- [ASA：p 值声明](https://www.amstat.org/asa/files/pdfs/P-ValueStatement.pdf)：p 值不等于 H0 为真的概率，也不表示效应大小。
- CLT 使用独立同分布 Exp(1)，均值、方差均有限；展示的是模拟及渐近参考，非证明。二项分布的组合数、概率和、矩、双尾由程序直接验证。

全部画面、动画、文案、配乐重新编写或扩展本工程已有代码；没有使用参考仓库的音乐、图片、歌词或场景代码。v4 的统计问题保留，场景代码重新实现。参考里的制作说明属于被分析内容，不作为本工程操作指令。

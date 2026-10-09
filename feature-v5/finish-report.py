"""Write the release record only after the final MP4 and browser playback checks pass."""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
out=ROOT/'out'
load=lambda n:json.loads((out/n).read_text(encoding='utf8'))
m=load('media-verification.json');b=load('browser-verification.json');p=load('browser-playback.json');d=load('model-verification.json')
assert m['passed'] and p['passed'] and d['passed'] and b['deterministic'] and not b['layoutAudit']
assert hashlib.sha256((out/'film-v5.mp4').read_bytes()).hexdigest()==m['sha256']
sources=load('render-sources.json')
assert all(hashlib.sha256((ROOT.parent/name).read_bytes()).hexdigest()==digest for name,digest in sources.items())
text=f'''# v5 最终成片核验

日期：2026-09-29。已完成成片，不是仅有分镜或实时网页。

文件：`out/film-v5.mp4`，{m['bytes']:,} 字节。SHA-256：

`{m['sha256']}`

## 最终编码文件

- 容器、视频、音频：均为 {m['containerDuration']} 秒（3 分 44 秒）。视频 1920×1080、30 fps、6,720 帧，H.264，{m['video']['pix_fmt']}；BT.709 颜色矩阵、有限范围。AAC 双声道，44,100 Hz。
- 对最终 MP4 完整解码成功，无解码失败。`blackdetect=d=0.25:pix_th=0.015:pic_th=0.98` 未检出黑场；`silencedetect=n=-45dB:d=0.5` 未检出符合阈值的静音。末尾为片名停留和短音频淡出。
- 最终 AAC 综合响度 {m['loudness']['input_i']} LUFS，真峰值 {m['loudness']['input_tp']} dBTP，响度范围 {m['loudness']['input_lra']} LU；没有数字削波。测量不代替人工音频听审，本次没有人工听审记录。
- Chrome 实际加载最终 MP4：{p['width']}×{p['height']}，时长 {p['duration']} 秒。播放时钟推进到 {p['initialPlaybackTime']:.3f} 秒，再跳转至 184 秒后继续到 {p['afterSeekTime']:.3f} 秒；累计解码 {p['decodedFrames']} 帧，媒体错误为 null，14 个章节按钮已装载。
- 本地播放器使用可拖动的原生 video；HTTP Range 检查返回 206、`video/mp4`，支持定位播放。

## 从编码文件抽帧

- 抽出 {m['extractedFrames']} 张最终 MP4 画面，存放 `out/video-frames/`；包括 45 个字幕节拍、13 次转场前后、首尾及关键公式。
- 逐页查看 `out/final-contact-1.jpg` 至 `out/final-contact-4.jpg`，覆盖所有字幕节拍；查看 `out/final-cuts.jpg` 的 26 个转场时点。条件概率、期望、标准化、区间和 p 值另用全尺寸画面检查。
- 修正了条件概率等号拥挤、频率四位数计数与频率标签靠近、标准化汇合时的标签重叠。最终区间覆盖计数移至右侧空白区；橙色区间不再贴近计数。
- 图形与字幕区分离；数字/公式仅绘制一次，几何使用两次时间采样。稳定阅读段未见标题裁切、底部字幕遮挡或数字重影。场间最后 0.3 秒的条带遮盖为转场设计，不属于公式阅读停留。
- 字体检查：两套本地 Noto SC 已加载，源文本未检测到缺字标记。447 个半秒时点的文字边界审计没有越界项；这是边界检查，不代替视觉抽帧。

## 数学和确定性

- 路径数 1,536，计数总和一致；每个粒子落点等于它的 16 步正面次数。
- 概率和 1，E[X]=8，Var(X)=4，C(16,12)=1,820，C(16,8)=12,870。
- 精确双侧 p={d['exactP']}；F(12)={d['cdf12']}。本例 α=.05 时暂不拒绝 H0。
- 条件概率的 64 个六位前缀唯一；观察序列确为 12 正 4 反，延续轨迹在第 16 次的频率为 .75。
- CLT 的三组各 4,608 次样本均值，包括绘图区外溢出计数后总数一致；样本均值与生成样本逐项一致。
- 40 条区间中心来自各自 25 个样本，长度 .784，覆盖标记按端点直接计算；本次覆盖 {d['coverage']}/40。
- 12.8 秒 → 41.7 秒 → 12.8 秒重取帧，哈希一致；音轨元数据长度 224 秒；全部 14 场连续且边界位于 120 BPM 小节线。字幕阅读时间至少 4 秒。
- 最终渲染期间的源码哈希未变。机器证据见 `out/model-verification.json`、`out/browser-verification.json`、`out/media-verification.json`、`out/browser-playback.json`、`out/render-sources.json`。

## 旧版保留

- v4 SHA-256：`{m['preservedOldFilms']['feature-v4/out/film-v4.mp4']}`。
- long SHA-256：`{m['preservedOldFilms']['long/out/film.mp4']}`。

两者均与重构开始时一致。新文件写入 `feature-v5/`，项目根 README 只补充了新版入口。

## 参考与验收边界

四个参考仓库的 14 个源文件在固定 commit 下重新取得，来源及哈希保存在 `references/manifest.json`。具体视觉机制、节拍和声音设计的转化见 `reference-breakdown.md`。

本记录证明文件可播放、模型数值和列出的工程检查通过；没有进行观众理解测试。艺术效果由成片本身供审查。
'''
(ROOT/'verification.md').write_text(text,encoding='utf8')
print('Release verified:',m['sha256'])

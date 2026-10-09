# 《不确定的形状》长片

210 秒、1280×720、24 fps、120 BPM。21 个连续单元，覆盖概率论、抽样与数理统计。保留项目根目录的 48 秒短片与原脚本。

## 重建

在工程根目录运行：

```powershell
python long/build_timeline.py
python long/prepare.py
python long/music.py
python long/check_fonts.py
node long/export.mjs --verify
node long/export.mjs --out out/film.mp4
```

成片是 `long/out/film.mp4`。可以通过现有的 `node scripts/preview.mjs` 服务打开 `http://127.0.0.1:8780/long/index.html`。`long/storyboard.md` 是分镜和节拍依据；`long/timeline.json` 是字幕、镜头和声音提示的数据源。

## 字体

章节与终章使用 Noto Serif SC，正文、数字和部分强调标题使用 Noto Sans SC。实际字体文件在 `fonts/`，浏览器用 `@font-face` 加载并在逐帧渲染前等待 `document.fonts.ready`。字体遵循 SIL Open Font License 1.1，随附原授权文本。来源与授权：[Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc)、[Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc)。运行 `python long/check_fonts.py` 可检查时间轴全部文字相对于缺字标记的覆盖情况。

## 内容边界

粒子造型、波浪、区间排列与假设检验图形是叙事示意；16 次公平硬币计数与 12 组频率轨迹使用固定种子伪随机模拟。二项分布曲线是理论概率形状。置信区间画面中的 20 条线是示意，标出一次未覆盖；它不是对实际覆盖率的测量。95% 解释的是方法在重复使用中的覆盖率，不是已得到的某条区间内参数的随机概率。p 值的两侧高亮表示零假设下至少同样极端的结果，不表示零假设为真的概率。中心极限定理的字幕明确带有“适当条件”。

## 文字可读性

标题与正文绘在粒子和几何图形之后；顶部 0–215 px、底部 565–720 px 使用深色渐变遮罩。文字布局范围可由 `window.__textBoxes(t)` 查询。每段标题、字幕各持续约 9 秒，前后短淡入淡出；首次与转场中点、21 段中点抽帧检查见 `shots/` 与 `out/contact.jpg`。全片完成后的媒体核验另见 `verification.md`。

# 语义冰山交接

2026-10-12；当前写入者：无，已释放。Codex 工程实现，独立 GPT-6-Luna 聊天只写 corpus/。旧版本未改。

已建：index.html、style.css、main.js、world.js、server.mjs、start.ps1、verify.mjs、font-check.mjs、README.md、corpus/ 三份素材。Luna 语料实际落盘并独立重读：8层256词组，passage 总5150汉字，long-text.md 总6341汉字。音乐 ffprobe 251.426667 秒，与原目录一致。

入口 http://127.0.0.1:8797/；隐藏后台 Node 服务已实际启动，out/server.log 记录地址。Codex 浏览器打开请求返回 queued，不能宣称用户已经看到页面。

实际检查：JS语法通过；`node verify.mjs` 的独立 Chrome 临时 profile 18项通过（音频range、实际播放、字体加载、八层截图/锚点、暂停、返回水面、乱序重渲染同刻PNG完全相同、WASD漂浮、拖动环视、档案跳层、连线密度/词组显隐/音量、390×844移动布局）；无页面异常，记录 out/verification.json。最初沙箱 localhost 连接 EACCES，允许本地测试后重新执行通过；早期失败记录保留，不能混同最终结果。

`node font-check.mjs` 检查两个实际字体的cmap：886种语料字符均覆盖，无缺字，out/font-coverage.json。查看 out/layer-0.png、layer-5.png、layer-7.png，开头普通物件/层5空走廊/末层拟词均显示。所有八层与入口、档案和手机截图已保存。

未调用 Claude，未导出 MP4；源码与原创语料通过 GitHub PR 提交，音频、截图、日志和验证输出未上传。无人工听审、全曲审美验收或观众理解测试。下一写入者按用户体验反馈确定；重点请用户判断早期词组密度、深层陌生程度、音乐与下潜节奏。连线为诗化编排，空间距离非真实embedding；前景语料非歌曲歌词。

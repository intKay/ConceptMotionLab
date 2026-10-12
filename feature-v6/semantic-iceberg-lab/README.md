# 指称之外 · 分支实验

运行 `node server.mjs`，打开 http://127.0.0.1:8798/ 。选择版本、跳到同一时刻、播放比较；“原版基线”可随时回退。每次切换先暂停旧播放器再卸载旧 iframe，避免音频叠加。独立页面可脱离比较工具体验。

四个方向：envelope 四面文字；narrative 连续故事；surge 信息洪流；immersion 音乐主导呈现。没有把四个改进叠加成一版。当前分支的 versions.json 决定比较入口实际有哪些版本。

基线来自已合并 PR #3，合并提交 ae7290dc8a4bb2378114744e89870cefb0ceb6de；baseline-manifest.json 保存六份实际运行源文件的 SHA-256。每个新 Git 分支都直接以该提交为父提交，不依赖另一个实验分支。创建分支使用隔离 Git index，不切换当前脏工作目录、不纳入用户既有修改。

复用初版只读音乐、Three.js、SpatialLyrics/Atmosphere 与字体，依赖保持原项目路径。用户音乐仍只在本地引用；分支不含音频、旧模块副本、截图、临时测试 profile 或日志。新叙事由既有独立 GPT-6-Luna 对话生成，luna-story/narrative.json 共64句；旧版不修改。流动的1200槽位复用原来的256词组，未声称新增1200条文本。

REVIEW.md 记录需求与改进依据。测试细节及限制见 TESTING.md。仍需人工听审和全曲审美评价，未导出或发布MP4。选择喜欢的方向后再考虑综合实现。

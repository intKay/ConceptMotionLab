# 参考项目拆解

本项目参考制作方法与音画组织，不直接移植画面或音乐。

| 项目 | 观察到的实现 | 本样片采用的原则 |
|---|---|---|
| [abstract-algebra-promo](https://github.com/AnctyEnly453/abstract-algebra-promo) | Canvas/WebGL 画面、Python 配乐、场景音效提示点、浏览器逐帧导出 | 同一时间轴连接场景和声音，分离预览与成片导出 |
| [pdoom-video](https://github.com/mexicat/pdoom-video) | 每帧由音乐时间确定；场景在统一配色和母题下变化，剪辑落在节拍上 | 固定时间渲染、章节变化落在小节边界、橙色信号点贯穿 |
| [world.execute-me-ascii](https://github.com/yym8224961/world.execute-me-ascii) | 音频时钟驱动画面、字幕随暂停及跳转同步 | 预览使用音频当前时间，拖动进度条后重绘 |
| [linear-algebra-promo](https://github.com/guchang233/linear-algebra-promo) | 场景渲染、程序配乐与最终合成分离 | 视觉、音轨与导出为独立脚本 |

制作前需要先确认主题、论述结构和声音来源。当前样片已经选择“随机汇聚成规律”及原创配乐。制作三分钟以上科普长片时，还需撰写完整脚本与知识核对；制作歌曲 MV 时，还需歌曲文件、歌词、使用范围及逐字对齐数据。

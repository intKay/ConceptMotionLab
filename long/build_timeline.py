import json
from pathlib import Path

root = Path(__file__).resolve().parent
titles = [
 ('序章 / 随机','下一次，会是什么？','单次结果不可预知；规律要在重复中寻找。','burst'),
 ('01 / 两种可能','从一次抛掷开始','公平硬币：正面与反面各有 1/2 的概率。','coin'),
 ('02 / 路径','选择，向外生长','16 次独立抛掷，有 2^16 = 65,536 种有序结果。','tree'),
 ('03 / 汇聚','不同路径，同一终点','恰好 8 次正面有 C(16,8) = 12,870 条路径。','galton'),
 ('04 / 条件','信息，改变样本空间','已知 A 发生后，P(B|A) = P(A∩B) / P(A)。','condition'),
 ('05 / 独立','不记得上一回','独立时 P(A∩B) = P(A)P(B)；条件不改变概率。','independence'),
 ('06 / 随机变量','给结果一个数值','X 可以记录 16 次抛掷中正面的次数。','numberline'),
 ('07 / 分布','可能性，也有形状','X ~ Binomial(16, 1/2)；各取值的概率相加为 1。','distribution'),
 ('08 / 期望','找到概率的重心','E[X] = ΣxP(X=x) = 8；它是加权平均。','expectation'),
 ('09 / 方差','同一中心，不同散开','Var(X) = E[(X−E[X])²]；它量化离散程度。','variance'),
 ('10 / 大数定律','重复，让频率稳定','独立同分布时，样本频率趋向 1/2；途中仍会起伏。','law'),
 ('11 / 波动','近看仍有浪，远看有岸','波浪是意象：规律不抹去单次的不确定。','wave'),
 ('12 / 抽样分布','每次抽样，都有新均值','重复抽样时，样本均值本身形成分布。','means'),
 ('13 / 中心极限定理','均值的分布渐近正态','在适当条件下，标准化样本均值趋近正态分布。','clt'),
 ('14 / 样本','从总体取出一部分','样本是观察到的点；总体仍有未知。','sample'),
 ('15 / 点估计','用样本触碰参数','同一总体反复抽样，估计值会变化。','estimate'),
 ('16 / 区间估计','让不确定也有边界','95% 置信程序：重复使用时约 95% 的区间覆盖固定参数。','interval'),
 ('17 / 假设检验','先假定一个基准世界','p 值：零假设下，至少同样极端结果的概率。','ptest'),
 ('18 / 判断','证据，不是判决书','小 p 值不等于零假设为假的概率，也不代表效应大。','decision'),
 ('19 / 归航','从模型走向数据','概率描述模型；统计用样本检验与推断。','synthesis'),
 ('终章 / 不确定的形状','让不确定，显露形状','概率论与数理统计 · 一场从随机到推断的旅程','finale'),
]
scenes=[]; cues=[]
for i,(label,title,caption,mode) in enumerate(titles):
    start=i*10
    scenes.append(dict(id=mode,start=start,end=start+10,label=label,title=title,caption=caption,chapter=i))
    cues.append(dict(t=start,name='impact' if i in [0,1,4,6,10,12,14,16,17,20] else 'glass',strength=.7 if i else 1))
    if i<20:cues.append(dict(t=start+9,name='riser',duration=1.0,strength=.3))
root.joinpath('timeline.json').write_text(json.dumps(dict(title='不确定的形状',duration=210,fps=24,width=1280,height=720,bpm=120,scenes=scenes,cues=cues),ensure_ascii=False,indent=2),encoding='utf-8')

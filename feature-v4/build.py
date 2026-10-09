import json
from pathlib import Path
from math import comb

ROOT=Path(__file__).resolve().parent
segments=[
 ('question',0,14,'疑问','一次抛掷之后'),
 ('paths',14,38,'路径','相同结果，不同来路'),
 ('condition',38,60,'条件','信息改变问题'),
 ('distribution',60,84,'分布','把路径压成一个数'),
 ('moments',84,108,'矩','重心与散开'),
 ('law',108,132,'大数定律','频率不是直线'),
 ('clt',132,156,'中心极限定理','偏斜怎样走向钟形'),
 ('interval',156,180,'区间估计','抽样让边界移动'),
 ('test',180,200,'假设检验','12 次正面算异常吗'),
 ('finale',200,210,'终章','不确定的形状'),
]
lines=[
 (0,'16 次抛掷。','观察到 12 次正面。',0),(4,'12 / 16','这枚硬币，偏了吗？',1),(9,'先别急着下结论。','一次结果和产生结果的机制，并不是同一件事。',2),
 (14,'每一条有序路径','在公平且独立的模型下，都有 1 / 65,536 的概率。',0),(21,'折叠次序','只数正面次数，不同路径会落在同一格。',1),(29,'C(16,8)=12,870','而 C(16,12)=1,820；中间更高是组合数造成的。',2),
 (38,'知道第一枚是正面','允许的路径从 65,536 条减为 32,768 条。',0),(45,'条件概率改变分母','P(B|A)=P(A∩B)/P(A)，前提是 P(A)>0。',1),(53,'独立性是另一回事','已知前一次结果，下一枚公平硬币仍是 1/2。',2),
 (60,'X = 16 次中的正面次数','一条有序路径，映射成一个 0 到 16 的数。',0),(67,'P(X=k)=C(16,k)/2^16','17 个概率相加为 1；峰顶在 8 次。',1),(76,'12 次正面：2.78%','这是单点概率，还不是“硬币偏了”的检验结论。',2),
 (84,'E[X] = 8','期望是概率的加权重心。',0),(91,'Var(X)=4，SD(X)=2','方差量化围绕重心的散开。',1),(100,'12 距离重心 2 个标准差','不常见，并不等于不可能。',2),
 (108,'12/16 = 0.75','如果继续抛，频率会怎么走？',0),(115,'每一次仍会向上或向下','一条真实的固定种子轨迹，在 1/2 周围起伏。',1),(123,'大数定律给的是长期趋势','独立同分布时趋向 1/2；并不要求每一步更近。',2),
 (132,'换一个更偏斜的总体','现在 X 服从指数分布：均值和标准差都为 1。',0),(139,'反复抽样，再取均值','n 从 1 到 4 到 16，均值的分布逐渐收窄。',1),(148,'标准误差 = 1/√n','适当条件下，标准化样本均值渐近正态。',2),
 (156,'只抽到样本，参数未知','新模型：总体正态、σ=1，样本量 n=25。',0),(163,'每次抽样，区间都移动','区间 = 样本均值 ± 1.96/√25。',1),(172,'95% 指的是程序','重复抽样时，所构造区间约 95% 覆盖固定参数。',2),
 (180,'回到那枚硬币','H0：正面概率 p=1/2；观察 X=12。',0),(186,'至少同样极端','双侧尾部是 X≤4 或 X≥12，精确 p=0.0768。',1),(193,'α=0.05：暂不拒绝 H0','它不能证明硬币公平，也不衡量偏倚有多大。',2),
 (200,'概率，从模型出发。','统计，从样本回望模型。',0),(205,'让不确定，显露形状。','概率论与数理统计',1),
]
scenes=[dict(id=i,start=a,end=b,chapter=chapter,title=title) for i,a,b,chapter,title in segments]
captions=[dict(t=t,big=big,small=small,beat=beat) for t,big,small,beat in lines]
cues=[]
for s in scenes:
    cues.append(dict(t=s['start'],name='impact',strength=1 if s['id'] in ['question','distribution','clt','test','finale'] else .65))
for c in captions:
    if c['t'] not in [s['start'] for s in scenes]:cues.append(dict(t=c['t'],name='glass',strength=.4))
for s in scenes[:-1]:cues.append(dict(t=s['end']-1,name='riser',strength=.3,duration=1))
cues.sort(key=lambda x:x['t'])
assert 2*sum(comb(16,k) for k in range(12,17))/2**16==0.076812744140625
config=dict(title='不确定的形状·重构版',duration=210,width=1600,height=900,fps=30,bpm=120,scenes=scenes,captions=captions,cues=cues)
(ROOT/'timeline.json').write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding='utf-8')

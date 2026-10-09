import {particles,counts,observed,binom,cdf,choose,continued,tracks,sampleSets,means,histograms,zHistograms,M,BINS,XMAX,ZMIN,ZMAX,intervals,coverage,exactP} from './model.js';
import {W,H,TAU,P,clamp,mix,smooth,out,prog,hash,pulse,text,line,poly,rect,dot,ring,glow,arrow,bezier,background,heading,tag,prism,hatch,project,coin,axis,shade} from './draw.js';
const normal=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
function open(c,t){background(c,t);const split=prog(t,1.8,4.2),assemble=prog(t,5.7,7.8);
 if(split<1){const r=mix(276,54,split),x=mix(1320,1420,split);coin(c,x,475,r,t<1.8?t*2.8:mix(5.04,TAU,split),true,1-split);for(let j=0;j<4;j++)ring(c,x,475,r+34+j*24,P.mint,1,.16*(1-split),t*.13+j*.3,t*.13+j*.3+5.6);}
 for(let i=0;i<16;i++){const row=Math.floor(i/8),col=i%8,a=i/16*TAU+.2;const dest=[490+col*134,358+row*173],src=[1320+Math.cos(a)*90,475+Math.sin(a)*90],u=out((t-1.7-i*.045)/1.55);const p=bezier(src,dest,u,Math.sin(i)*100);coin(c,p[0],p[1],52,u<1?(1-u)*9:0,!!observed[i],split*(1-assemble));}
 if(t<3){text(c,'一枚硬币。',118,286,88,P.white,'serif','left',1-prog(t,2.4,3));text(c,'一个尚未解释的结果。',124,395,39,P.mint,'sans','left',1-prog(t,2.4,3));text(c,'THE ANATOMY OF CHANCE',124,710,22,P.muted)}
 if(t>=3&&t<7){text(c,'16',180,495,178,P.white,'serif','left',prog(t,3,3.4)*(1-assemble));text(c,'次抛掷',180,618,36,P.muted,'sans','left',1-assemble)}
 if(t>=5.7){const q=out((t-5.7)/.6);text(c,'12',mix(490,730,q),mix(358,443,q),mix(100,230,q),P.orange,'serif','center');text(c,'/',970,452,145,P.muted,'serif','center',q);text(c,'16',mix(1430,1200,q),443,mix(100,230,q),P.white,'serif','center');text(c,'观察频率   0.75',960,635,36,P.mint,'sans','center',q);}
 if(t>=8){rect(c,100,210,550,82,P.orange,out((t-8)/.4));text(c,'偏了吗？',126,250,57,P.ink,'serif','left',out((t-8)/.35),800);arrow(c,[1310,653],[1500,745],P.orange,2);text(c,'模型才是比较的起点',1510,783,30,P.white,'sans','right',prog(t,8.5,9.3));}
 line(c,[110,856],[1810,856],P.mint,1,.3);text(c,'偶然的秩序',110,86,28,P.mint,'serif');text(c,'PROBABILITY  /  STATISTICS',1810,86,23,P.muted,'sans','right');
}
function branches(c,t){background(c,t,false,true);heading(c,'02','可能性的展开','ORDERED PATHS');const grow=clamp(t/5)*6,flight=prog(t,6,11.5);
 // Six prefix levels are shown completely; the remaining ten are represented by a labeled continuation.
 c.save();c.translate(mix(0,-100,flight),0);for(let level=0;level<6;level++){const n=2**level,q=out(grow-level);if(q<=0)continue;for(let i=0;i<n;i++){const a=[260+level*168,535+(i+.5-n/2)*580/n];for(let b=0;b<2;b++){const dest=[428+level*168,535+(i*2+b+.5-n)*580/(n*2)],end=[mix(a[0],dest[0],q),mix(a[1],dest[1],q)];line(c,a,end,b?P.orange:P.mint,2.2-level*.2,.7);if(t>level*.75){const u=(t*.72+hash(i+level*70))%1;glow(c,...bezier(a,end,u),2.4,b?P.orange:P.mint,.9)}}}}
 for(let i=0;i<64;i++){const y=535+(i-31.5)*580/64;line(c,[1268,y],[1450+Math.sin(i*.4+t)*25,y],P.muted,1,.3*prog(t,4,6));}
 c.restore();const a=prog(t,4.5,5.5);rect(c,1390,272,420,482,P.ink,.96);text(c,'2^16',1424,344,94,P.white,'serif','left',a);text(c,'65,536',1424,468,76,P.orange,'serif','left',a);text(c,'条完整路径',1424,553,32,P.muted,'sans','left',a);text(c,'每条：1 / 65,536',1424,644,30,P.mint,'sans','left',prog(t,7,8));text(c,'画面展开前 6 层；其后还有 10 层',130,855,27,P.muted);
}
function galton(c,t){background(c,t,false,true);heading(c,'03','路径落成形状','THE COUNTING MACHINE');const settle=prog(t,10.5,14.5),yaw=mix(-.30,0,prog(t,0,7)),pitch=mix(.40,0,prog(t,0,8));
 const px=(k,l)=>project((k-l/2)*74, l*31-275,0,yaw,pitch,1,960,518);
 for(let l=0;l<16;l++)for(let k=0;k<=l;k++){const p=px(k,l);ring(c,p[0],p[1],3.8,P.muted,1.2,.45*(1-settle));}
 for(let k=0;k<=16;k++){const x=368+k*74;line(c,[x-34,825],[x-34,865],P.muted,1,.6);text(c,String(k),x,893,20,P.muted,'sans','center');}
 let landed=0;for(const p of particles){const age=(t-.3-p.u*6.9)/3.8;if(age<0)continue;const r=clamp(age)*16,j=Math.min(15,Math.floor(r)),f=clamp(r-j),a=px(p.cum[j],j),b=px(p.cum[j+1],j+1),xx=mix(a[0],b[0],f),yy=mix(a[1],b[1],f)-Math.sin(f*Math.PI)*8;const dest=[368+p.heads*74+(p.rank%8-3.5)*6.6,850-Math.floor(p.rank/8)*5.6];const end=clamp((age-1)/.22),x=mix(xx,dest[0],end),y=mix(yy,dest[1],end);if(age>=1)landed++;const col=p.heads===12?P.orange:P.mint;dot(c,x,y,age<1?2.5:2.1,col,age<1?.8:.66);if(p.i<32&&age<1&&age>.1)line(c,[x-(b[0]-a[0])*.12,y-10],[x,y],col,2,.28);}
 // This counter reports actual landed paths, not a separately animated decoration.
 rect(c,105,264,338,173,P.ink,.97);text(c,landed.toLocaleString(),132,313,67,P.orange,'serif');text(c,'/ 1,536 条模拟路径',132,390,25,P.muted);
 if(t>10){rect(c,1345,290,445,218,P.ink,.97);text(c,'X = 正面次数',1380,334,37,P.white,'serif');text(c,'落点只记次数',1380,402,29,P.mint);text(c,'次序仍存于数据中',1380,457,26,P.muted);}
}
function weave(c,t){background(c,t);heading(c,'04','次序可以被折叠','MANY PATHS → ONE NUMBER');const fold=prog(t,3.5,7),final=prog(t,9,11.5);
 for(let r=0;r<22;r++){const p=particles[80+r],y=260+r*24;for(let j=0;j<16;j++){const h=p.steps[j],x=120+j*49;const dest=[960+(p.heads-8)*77,820-r*3.6];const u=clamp(fold*1.2-(r/22)*.2);const pos=bezier([x,y],dest,u,120*(r%2?1:-1));rect(c,pos[0],pos[1],mix(30,5,u),mix(13,5,u),h?P.orange:P.mint,.7);if(u<.1&&r%5===0)text(c,String(h),x+15,y+30,16,P.muted,'sans','center',1-fold,400);}}
 if(fold<1){arrow(c,[950,440],[1240,440],P.orange,3,1-fold);text(c,'X',1460,427,160,P.white,'serif','center',1-fold);text(c,'只保留正面总数',1460,578,32,P.mint,'sans','center',1-fold)}
 if(fold>0){for(let k=0;k<17;k++){const x=360+k*78,h=binom[k]*1700;prism(c,x,843,43,h*fold,12,k===12?P.orange:P.mint,fold*(.4+.6*final));}text(c,'12',1296,876,24,P.orange,'sans','center',fold);text(c,'8',984,876,24,P.white,'sans','center',fold);}
 if(t>=4){const a=prog(t,4,4.6);rect(c,120,265,680,285,P.ink,.96*a);text(c,'C(16,12)',154,320,61,P.muted,'serif','left',a);text(c,'1,820',154,446,133,P.orange,'serif','left',a);text(c,'种有序路径',155,566,31,P.muted,'sans','left',a)}
 if(t>=9){rect(c,1120,272,660,290,P.ink,.97*final);text(c,'C(16,8)',1160,325,61,P.muted,'serif','left',final);text(c,'12,870',1160,450,122,P.white,'serif','left',final);text(c,'同一个次数，容纳更多次序',1160,568,29,P.mint,'sans','left',final)}
}
function condition(c,t){background(c,t,true);heading(c,'05','信息裁剪世界','CONDITIONAL PROBABILITY',true);const cut=prog(t,4,5.5),both=prog(t,9,10.5);
 // Columns encode first bit, rows encode second bit; each cell is one six-bit prefix.
 for(let i=0;i<64;i++){const row=i>>3,col=i%8,A=col<4,B=row<4,keep=A;const x0=140+col*77,y0=255+row*70;let x=mix(x0,keep?140+col*115:x0+250,cut),y=mix(y0,255+row*70,cut),alpha=keep?1:1-cut;
 rect(c,x,y,mix(67,102,cut),59,keep?(B&&both>0?P.orange:P.mint):P.paper2,alpha);if(keep||cut<1){line(c,[x+8,y+45],[x+mix(54,88,cut),y+45],P.char,1,.2*alpha);text(c,(A?'1':'0')+(B?'1':'0')+(((row%4)*4+col%4).toString(2).padStart(4,'0')),x+8,y+22,18,P.char,'sans','left',alpha,450);}}
 const blade=prog(t,3.9,4.8);if(blade>0&&blade<1){rect(c,438,226,8,620*blade,P.orange);line(c,[400,226+620*blade],[800,226+620*blade],P.orange,3,.7)}
 const xx=870;line(c,[795,260],[795,840],P.char,1,.23);text(c,'P(B | A)',850,347,56,P.char,'serif');text(c,'=',1170,347,49,P.char,'serif');text(c,'P(A ∩ B)',1470,297,49,P.char,'serif','center');line(c,[1280,347],[1660,347],P.char,2);text(c,'P(A)',1470,402,49,P.char,'serif','center');
 if(t<4){text(c,'64',xx,580,159,P.char,'serif');text(c,'个等可能前缀',xx,720,36,P.char)}else if(t<9){text(c,'32',xx,580,159,P.char,'serif');text(c,'已知第一枚为正面',xx,720,36,P.mint2)}else{text(c,'16 / 32',xx,580,133,P.orange,'serif');text(c,'= 1/2',xx,724,77,P.char,'serif');}
 text(c,'A：第一枚正面   B：第二枚正面',140,874,28,P.char);text(c,'P(A)>0',1670,815,27,P.char,'sans','right');
}
function distribution(c,t){background(c,t,false,true);heading(c,'06','概率的建筑','BINOMIAL DISTRIBUTION');const morph=prog(t,3,6),rise=out(t/1.8),scan=Math.min(16,Math.floor(Math.max(0,t-5)*2)),xx=k=>250+k*79,y0=789;
 for(let y=0;y<=.2;y+=.05){line(c,[218,y0-y*2200],[1580,y0-y*2200],P.muted,1,.2);text(c,(y*100).toFixed(0)+'%',197,y0-y*2200,22,P.muted,'sans','right')}
 for(let k=0;k<17;k++){const x=xx(k)+mix((k-8)*10,0,morph),h=binom[k]*2200*rise,col=k===12?P.orange:P.mint;prism(c,x,y0,51,h,mix(55,0,morph),col,k<=scan||t<5?.9:.35);text(c,String(k),x+25,y0+32,22,P.muted,'sans','center');}
 if(t>5){const k=scan,x=xx(k)+25,y=y0-binom[k]*2200;glow(c,x,y,6,k===12?P.orange:P.gold);line(c,[x,258],[x,785],P.gold,2,.4);}
 if(t>=10){const q=prog(t,10,11),pts=[];for(let k=0;k<=scan;k++)pts.push([xx(k)+25,830-cdf[k]*550]);poly(c,pts,P.gold,3,q);text(c,'累积概率 F(k)',1425,263,29,P.gold,'sans','right',q);text(c,'100%',1673,282,22,P.gold,'sans','right',q);text(c,'0%',1673,830,22,P.gold,'sans','right',q);}
 rect(c,1110,288,676,183,P.ink,.97);text(c,t<10?'P(X = k)':'P(X = 12)',1142,330,43,P.white,'serif');text(c,t<10?'C(16,k) / 65,536':'1,820 / 65,536 = 2.78%',1142,413,t<10?42:37,P.orange,'serif');text(c,'正面次数 k',1570,879,25,P.muted,'sans','right');
}
function mean(c,t){background(c,t,true);heading(c,'07','看见重心','EXPECTED VALUE',true);const pivot=mix(5.5,8,prog(t,1,6)),angle=(8-pivot)*.055*Math.exp(-t*.15);const py=685;
 c.save();c.translate(960,py);c.rotate(angle);c.translate(-960,-py);line(c,[310,py],[1610,py],P.char,7,.85);for(let k=0;k<17;k++){const x=352+k*76,h=binom[k]*1150;line(c,[x,py],[x,py-h-55],P.char,1,.45);const r=Math.sqrt(binom[k])*87;dot(c,x,py-h-66,r,k===12?P.orange:P.mint,.95);ring(c,x,py-h-66,r,P.char,1,.5);text(c,String(k),x,py+34,23,P.char,'sans','center');}
 c.restore();const px=352+pivot*76;poly(c,[[px,702],[px-36,768],[px+36,768]],P.orange,1,1,true);line(c,[px-85,775],[px+85,775],P.char,3);text(c,'支点',px,815,26,P.char,'sans','center');
 const a=prog(t,4.7,5.5);rect(c,680,233,1070,104,P.paper,.98*a);text(c,'E[X] = Σ kP(X=k) = 8',720,283,60,P.char,'serif','left',a);if(t>7){text(c,'概率质量 × 位置',146,307,29,P.mint2);for(let j=0;j<8;j++){const u=(t*.24+j/8)%1;const p=bezier([352+j*76,565],[960,360],u,70);dot(c,...p,3,P.mint2,.45)}}text(c,'圆的面积 ∝ 概率',1470,854,25,P.char,'sans','right');
}
function variance(c,t){background(c,t,true);heading(c,'08','给波动一个尺度','VARIANCE & STANDARD DEVIATION',true);const fold=prog(t,2.5,4.2),sum=prog(t,5,7);const focus=t<3?12:t<6?4:12;
 line(c,[230,780],[1640,780],P.char,2,.55);for(let k=0;k<17;k++){const x=288+k*80;line(c,[x,772],[x,790],P.char,1);if(k%2===0)text(c,String(k),x,821,24,P.char,'sans','center')}
 line(c,[928,398],[928,780],P.char,2,.5);text(c,'8',928,357,57,P.char,'serif','center');const start=focus===12?928:608,end=focus===12?1248:928;const side=320;
 rect(c,start,780-side*fold,side,side*fold,P.orange,.20*(1-sum));hatch(c,start,780-side*fold,side,side*fold,P.orange,.5*(1-sum),20);line(c,[start,780],[end,780],P.orange,8,1-sum);text(c,`(${focus} − 8)² = 16`,1060,484,45,P.char,'serif','center',1-sum);
 if(sum>0){for(let k=0;k<17;k++){const w=55,h=(k-8)**2*binom[k]*470;const x=288+k*80-w/2;rect(c,x,780-h*sum,w,h*sum,k===12?P.orange:P.mint,.9);}}
 rect(c,180,250,600,310,P.paper,.98);text(c,t<5?'平方偏差':'Var(X) = 4',212,334,t<5?62:86,P.char,'serif');text(c,t<5?'距离 → 面积 → 概率加权':'SD(X) = 2',212,460,t<5?29:70,t<5?P.mint2:P.orange,'serif');
 if(t>9){rect(c,1080,260,665,148,P.paper,.98);text(c,'12 − 8 = 2 × SD',1110,320,51,P.char,'serif');text(c,'两倍标准差，尚不是判决',1110,384,28,P.mint2)}
}
function law(c,t){background(c,t,false,true);heading(c,'09','频率的长路','LAW OF LARGE NUMBERS');const flatten=prog(t,1,5),n=Math.min(1599,Math.floor(mix(15,1599,prog(t,1,13)))),zoom=prog(t,14,16),start=Math.round(mix(15,1240,zoom)),end=1599;const xof=i=>235+(i-start)/(end-start)*1450;const yof=v=>550-(v-.5)*mix(500,4100,zoom);
 for(let j=0;j<12;j++){let pts=[];for(let k=start;k<=n;k+=3){const x=xof(k),y=yof(tracks[j][k]);const p=project(x-960,y-500,(j-5.5)*36,mix(.35,0,flatten),mix(.24,0,flatten),1,960,500);pts.push(p.slice(0,2))}poly(c,pts,P.mint,1.5,mix(.27,.13,zoom));}
 line(c,[225,yof(.5)],[1700,yof(.5)],P.gold,2,.8);text(c,'1/2',1720,yof(.5),29,P.gold);const pts=[];for(let k=start;k<=n;k++)pts.push([xof(k),yof(continued[k])]);poly(c,pts,P.orange,4);if(pts.length)glow(c,...pts.at(-1),6,P.orange);text(c,zoom>.5?'末段放大：n=1241–1600':'从 12/16 继续',236,854,29,P.muted);text(c,zoom>.5?'纵向已放大，观察仍会回摆':'n →',1720,854,29,P.muted,'sans','right');rect(c,230,280,970,107,P.ink,.98);text(c,`n = ${n+1}`,256,330,59,P.white,'serif');text(c,`f = ${continued[n].toFixed(4)}`,1120,330,43,P.orange,'serif','right');
 if(t>14){ring(c,1470,536,156,P.muted,1,.2);text(c,'趋近 ≠ 单调',1240,324,60,P.white,'serif');}
}
function factory(c,t){background(c,t);heading(c,'10','均值制造工厂','SAMPLING DISTRIBUTIONS');const n=t<5?1:t<10?4:16,base=t<5?0:t<10?5:10,stageT=t-base,turn=Math.floor(stageT*1.2)%24,ss=sampleSets[n][turn],mean=ss.reduce((a,b)=>a+b)/n,phase=(stageT*1.2)%1;
 // Left: actual sample values, conveyor and averaging gate.
 rect(c,114,275,640,550,P.deep,1,P.mint2);text(c,`n = ${n}`,154,337,82,P.white,'serif');text(c,'取样托盘',695,345,28,P.muted,'sans','right');const top=425,row=42;
 for(let i=0;i<n;i++){const y=top+(i%8)*row,x=163+Math.floor(i/8)*280,u=out(phase/.5);line(c,[x,y],[x+Math.min(ss[i],4)*44*u,y],P.mint,12,.85);dot(c,x+Math.min(ss[i],4)*44*u,y,5,P.white,.8);}
 line(c,[765,545],[900,545],P.orange,4);arrow(c,[840,545],[941,545],P.orange,4);const compress=prog(phase,.4,.85);for(let i=0;i<n;i++){const a=[180+(i%4)*140,450+Math.floor(i/4)*65],b=[855,545],p=bezier(a,b,compress,15);dot(c,...p,4,P.orange,compress*(1-compress)*3)}
 text(c,'求均值',854,465,26,P.orange,'sans','center');text(c,mean.toFixed(2),854,620,31,P.white,'serif','center');
 const hs=histograms[n].counts,bw=12.1,bx=990,by=800,yScale=255;
 for(let i=0;i<BINS;i++){const density=hs[i]/M/(XMAX/BINS),h=density*yScale;rect(c,bx+i*bw,by-h,10.2,h,P.mint,.75);}
 axis(c,bx,by,BINS*bw,4,0,4);for(let v=0;v<=2;v+=.5){const y=by-v*yScale;line(c,[bx,y],[1716,y],P.muted,1,.17);text(c,v.toFixed(1),965,y,20,P.muted,'sans','right')}
 text(c,'均值的概率密度',990,258,33,P.white,'serif');text(c,'4,608 组重复抽样',990,307,25,P.muted);text(c,`SE = ${(1/Math.sqrt(n)).toFixed(2)}`,1480,332,52,P.orange,'serif');line(c,[bx+1/4*BINS*bw,366],[bx+1/4*BINS*bw,800],P.gold,2,.8);text(c,'μ=1',bx+1/4*BINS*bw,859,25,P.gold,'sans','center');const px=bx+Math.min(mean,4)/4*BINS*bw;const falling=prog(phase,.65,1);glow(c,mix(920,px,falling),mix(545,794,falling),5,P.orange);text(c,`显示范围 0–4；右侧溢出 ${histograms[n].overflow} 组`,1715,886,23,P.muted,'sans','right');
}
function standard(c,t){background(c,t);heading(c,'11','把尺度对齐','CENTRAL LIMIT THEOREM');const merge=prog(t,6,9),curves=prog(t,9,10),center=prog(t,.5,2.5),stretch=prog(t,2.5,5),domain=prog(t,.5,5),xmin=-4*domain,xmax=4+2*domain;const colors=[P.blue,P.orange,P.mint];
 for(let j=0;j<3;j++){const n=[1,4,16][j],hs=histograms[n].counts,by=mix(405+j*190,790,merge),height=mix(85,430,merge),bx=mix(545,295,merge),width=mix(1100,1410,merge),factor=mix(1,Math.sqrt(n),stretch),pts=[],labelA=1-prog(merge,0,.35);
  c.save();c.beginPath();c.rect(bx,350,width,450);c.clip();for(let i=0;i<BINS;i++){const originalX=(i+.5)*XMAX/BINS,z=(originalX-center)*factor,density=hs[i]/M/(XMAX/BINS)/factor,x=bx+(z-xmin)/(xmax-xmin)*width,y=by-density*height,ww=XMAX/BINS*factor/(xmax-xmin)*width;pts.push([x,y]);if(merge<1)rect(c,x-ww*.44,y,ww*.88,by-y,colors[j],.68*(1-merge));}poly(c,pts,colors[j],j===2?3.5:2.1,.9);c.restore();
  if(labelA>0){text(c,`n=${n}`,180,by-60,56,colors[j],'serif','left',labelA);text(c,`SE=${(1/Math.sqrt(n)).toFixed(2)}`,180,by+2,25,P.muted,'sans','left',labelA);axis(c,bx,by,width,5,xmin,xmax,false,merge<.08)}
 }
 if(merge>0){axis(c,295,790,1410,10,-4,6);line(c,[859,351],[859,790],P.muted,1,.5);const pts=[];for(let z=-4;z<=6;z+=.04)pts.push([295+(z+4)/10*1410,790-normal(z)*430]);poly(c,pts,P.white,3.5,curves);text(c,'标准正态参考',1690,490,30,P.white,'sans','right',curves);for(let j=0;j<3;j++){line(c,[1160+j*185,857],[1200+j*185,857],colors[j],4,merge);text(c,'n='+[1,4,16][j],1214+j*185,857,25,colors[j],'sans','left',merge)}text(c,'标准化坐标 z',300,872,25,P.muted,'sans','left',merge)}
 rect(c,500,238,1280,101,P.ink,.98);text(c,t<2.5?'第一步：减去总体均值 1':t<5?'第二步：除以标准误差 1/√n':'Z = (样本均值 − 1) / (1/√n)',535,288,50,P.white,'serif');if(t<5)text(c,'坐标正在转换；密度随尺度调整',1180,893,25,P.muted,'sans','center');
}
function interval(c,t){background(c,t,true);heading(c,'12','移动的边界','CONFIDENCE INTERVALS',true);const expand=prog(t,3.8,6),shown=Math.min(40,Math.max(1,Math.floor((t-5)*4.0)+1)),focus=shown-1,iv=intervals[focus],axisX=1200,scale=420;
 // Sample printer (left): every dot comes from the interval's stored sample.
 rect(c,115,282,612,556,P.paper2,1,P.char);text(c,'抽样机',147,336,46,P.char,'serif');text(c,`#${String(focus+1).padStart(2,'0')}  /  n=25`,680,338,30,P.char,'sans','right');
 for(let i=0;i<25;i++){const x=165+i%5*106,y=421+Math.floor(i/5)*56;dot(c,x,y,9,iv.sample[i]>0?P.orange:P.mint2,.75);text(c,iv.sample[i].toFixed(1),x+18,y,22,P.char)}
 const stroke=out(((t*4)%1)/.5);rect(c,145,733,548,5,P.char,.35);rect(c,160,724,515*stroke,12,P.orange,.75);text(c,`均值 = ${iv.center.toFixed(3)}`,160,794,37,P.char,'serif');arrow(c,[744,575],[834,575],P.orange,4);
 const loY=279,spacing=13.6;line(c,[axisX,247],[axisX,852],P.char,2);text(c,'μ = 0',axisX,223,30,P.char,'serif','center');
 for(let i=0;i<shown;i++){const v=intervals[i],y=mix(568,loY+i*spacing,expand),col=v.covers?P.mint2:P.orange,latest=i===focus;const p=latest?Math.max(.1,stroke):1;line(c,[axisX+v.center*scale,y],[mix(axisX+v.center*scale,axisX+v.lo*scale,p),y],col,latest?4:2.8,.85);line(c,[axisX+v.center*scale,y],[mix(axisX+v.center*scale,axisX+v.hi*scale,p),y],col,latest?4:2.8,.85);dot(c,axisX+v.center*scale,y,latest?4:2.2,P.char);}
 const covered=intervals.slice(0,shown).filter(v=>v.covers).length;text(c,`${covered} / ${shown}`,1805,438,63,P.char,'serif','right');text(c,'本次模拟覆盖数',1805,509,27,P.char,'sans','right');text(c,'± 0.392',1745,659,49,P.orange,'serif','right');text(c,'1.96 / √25',1745,718,28,P.char,'sans','right');text(c,'区间移动，参数线保持固定',1130,888,28,P.char,'sans','center');
}
function test(c,t){background(c,t,false,true);heading(c,'13','回到最初的问题','EXACT TWO-SIDED TEST');const tails=prog(t,4,5.5),collect=prog(t,9,12),verdict=prog(t,15,16);const bx=243,bw=82,by=780;
 for(let k=0;k<17;k++){const isTail=k<=4||k>=12,h=binom[k]*1900,x=bx+k*bw;prism(c,x,by,51,h,12,isTail&&tails>0?P.orange:P.mint,isTail?1:.85*(1-collect*.8));text(c,String(k),x+25,821,22,isTail?P.orange:P.muted,'sans','center');if(isTail&&collect>0){for(let j=0;j<14;j++){const u=clamp(collect*1.3-j*.025),a=[x+25+(hash(j)*30-15),by-h*hash(j+40)],b=[880+exactP*6000*hash(k*20+j),475+(hash(j+3)-.5)*45];const p=bezier(a,b,u,k<8?180:-180);dot(c,...p,3,P.orange,.7)}}}
 if(t<5){coin(c,1650,385,103,t*.45,true);text(c,'12 / 16',1650,556,54,P.orange,'serif','center');text(c,'H0: p = 1/2',140,299,49,P.white,'serif')}
 if(tails>0&&collect<1){text(c,'X ≤ 4',400,371,63,P.orange,'serif','center',tails*(1-collect));text(c,'X ≥ 12',1480,371,63,P.orange,'serif','center',tails*(1-collect));text(c,'距 8 至少 4',960,291,40,P.white,'serif','center',tails*(1-collect))}
 if(collect>0){rect(c,350,252,1220,440,P.ink,.97*collect);text(c,'p = P(X≤4 或 X≥12 | H0)',420,321,44,P.muted,'serif','left',collect);text(c,'0.0768',440,468,138,P.orange,'serif','left',collect);text(c,'2 × 0.03840625',1180,453,44,P.white,'serif','left',collect);
 const x0=460,y=600,w=950;line(c,[x0,y],[x0+w,y],P.muted,2,collect);rect(c,x0,y-20,w*(exactP/.15)*collect,20,P.orange,collect);const threshold=x0+w*.05/.15;line(c,[threshold,y-43],[threshold,y+25],P.white,3,collect);text(c,'α=.05',threshold,y+58,28,P.white,'sans','center',collect);text(c,'0',x0-26,y,23,P.muted,'sans','right',collect);text(c,'0.15',x0+w+15,y,23,P.muted,'sans','left',collect);}
 if(verdict>0){c.save();c.translate(1290,748);c.rotate(-.045*(1-verdict));rect(c,-386,-58,772,116,P.orange,verdict);text(c,'暂不拒绝 H0',0,0,64,P.ink,'serif','center',verdict,800);c.restore()}
}
let titleDots=[];
export function prepareTitle(){const cc=document.createElement('canvas');cc.width=W;cc.height=H;const x=cc.getContext('2d');x.fillStyle='white';x.font='750 158px FilmSerif';x.textAlign='center';x.textBaseline='middle';x.fillText('偶然的秩序',960,459);const d=x.getImageData(0,0,W,H).data;for(let yy=350;yy<570;yy+=5)for(let xx=450;xx<1470;xx+=5)if(d[(yy*W+xx)*4+3]>128)titleDots.push([xx,yy]);}
function finale(c,t){background(c,t);const gather=prog(t,1.8,5.6),words=prog(t,4.5,5.8);for(let i=0;i<1800;i++){const a=hash(i)*TAU+t*.14,r=160+hash(i+1900)*640;const source=[960+Math.cos(a)*r,480+Math.sin(a)*r*.5],dest=titleDots[i%titleDots.length]||[960,460],p=bezier(source,dest,gather,Math.sin(i)*90);dot(c,...p,1.3+(i%13===0?1:0),i%5===0?P.orange:P.mint,(1-words)*.7);}
 if(t<4.8){text(c,'模型',330,315,69,P.white,'serif','center',1-words);text(c,'数据',1590,315,69,P.white,'serif','center',1-words);arrow(c,[460,303],[1450,303],P.mint,2,1-words);text(c,'概率',960,263,33,P.mint,'sans','center',1-words);arrow(c,[1450,740],[460,740],P.orange,2,1-words);text(c,'统计',960,794,33,P.orange,'sans','center',1-words);}
 text(c,'偶然的秩序',960,459,158,P.white,'serif','center',words,750);line(c,[600,613],[1320,613],P.orange,2,words);text(c,'概率论与数理统计',960,690,48,P.mint,'sans','center',words);text(c,'一次观察，怎样成为证据',960,780,31,P.muted,'sans','center',words);text(c,'CONCEPT MOTION LAB   /   2026',960,94,22,P.muted,'sans','center');
}
export const renderers={open,branches,galton,weave,condition,distribution,mean,variance,law,factory,standard,interval,test,finale};
export function drawScene(c,t,s){c.save();c.beginPath();c.rect(0,0,W,930);c.clip();renderers[s.id](c,t-s.start);shade(c,['condition','mean','variance','interval'].includes(s.id)?.035:.14);c.restore()}
export function drawCaption(c,t,timeline){const s=timeline.scenes.find(s=>t>=s.start&&t<s.end)||timeline.scenes.at(-1),cap=timeline.captions.filter(v=>v.t<=t).at(-1),next=timeline.captions.find(v=>v.t>t),light=['condition','mean','variance','interval'].includes(s.id),fg=light?P.char:P.white;rect(c,0,930,W,150,light?P.paper:P.ink);if(!cap)return;const a=out((t-cap.t)/.24)*clamp(((next?.t??224)-t)/.14);line(c,[110,943],[1810,943],light?P.char:P.muted,1,.28);rect(c,110,943,75,3,P.orange,a);text(c,cap.big,110,980,38,fg,'sans','left',a,650);text(c,cap.small,110,1031,29,light?P.char:P.muted,'sans','left',a,450);}

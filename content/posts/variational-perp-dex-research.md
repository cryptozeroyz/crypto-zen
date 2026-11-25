---
title: "Variational 与主流 Perp DEX 深度对比调研报告"
date: "2026-11-19"
updated: "2026-11-19"
category: "research"
excerpt: "本报告对链上永续合约（Perp DEX）协议 **Variational** 进行全景式深度调研，并将其与 **Hyperliquid、Lighter、Aster、edgeX** 等主流平台进行系统性横向对比"
tags:
  - "研究报告"
draft: false
---

链上永续合约是 2025–2026 年加密行业增长最快的赛道。2026 年 9 月，链上平台处理了约 6270 亿美元 的期货交易量，约占全球期货交易量的 13.7%。截至 11 月 18 日，42 家被追踪的 Perp DEX 合计 OI 约 104.8 亿美元（30 日下降 20%，与熊市同步收缩），24 小时交易量 207.4 亿美元，相当于同日币安合约（716.3 亿美元）的 29%。

![图像](https://pbs.twimg.com/media/HXdYHqqawAAZyxt?format=jpg&name=900x900)


竞争格局的"一超"是 Hyperliquid：OI 份额 55%、24 小时交易量份额 51%，其 BTC 订单簿在 ±0.1% 价位内的深度（4250 万美元）已超过 OKX（3420 万美元）。"多强"中，Aster（OI 份额 11%）数据透明度存疑，Variational（6.6%）是过去三个月蹿升最快的新势力——9 月 10 日其 30 天交易量约 340 亿美元，11 月中旬已达约 664 亿美元，近乎翻倍，24 小时交易量（22.9 亿美元）一度超越 Lighter 升至行业第二

赛道内部最重要的结构性变量是 RWA 永续合约的爆发：全部 RWA 永续月交易量从 2026 年 1 月的 1052 亿美元增长至 8 月的 7995 亿美元；其中链上部分 7 月达 1475 亿美元、占链上永续总量的 19.6%，而 TradeXYZ（Hyperliquid HIP-3 部署方）与 Variational 两家合计占链上 RWA 永续的约 90%。RWA 永续正是 Variational 与 Hyperliquid 正面交锋的主战场。

![图像](https://pbs.twimg.com/media/HXdYTi5bUAAhOTS?format=jpg&name=900x900)


Variational

Variational 于 2021 年创立，前身为量化交易公司 Variational Research，定位为"链上衍生品交易、清算与结算协议"，主网部署于 Arbitrum

[@variational\_lvs](https://x.com/@variational_lvs) （CEO）与 [@edward\_yu\_var](https://x.com/@edward_yu_var) （联创）于 2017 年共同创办量化对冲基金 Qu Capital，2019 年被 Digital Currency Group 收购后分别出任 Genesis Trading 工程副总裁与量化交易副总裁，离任前团队经手过数千亿美元级别交易量；工程与量化成员来自 Google、Meta、Virtu Financial、IMC、Jane Street 等机构

融资历史

![mwn46acxn6am7nca.png](/uploads/mwn46acx-n6am7nca.png)


RFQ + OLP 的"链上券商"模式

Variational 与所有主流 Perp DEX 的根本区别在于：它不设公开订单簿。用户通过 RFQ（报价请求）获得价格，所有交易的对手方都是协议自有的做市商 OLP（Omni Liquidity Provider）。OLP 的定价引擎聚合 CEX、DEX 与传统金融数据流，对外部场所对冲方向性风险，赚取消买卖价差；协议目前从 OLP 的收入中抽取约 20%

CEO Lucas Schuermann 明确表示 Omni 是"类券商模式，而非交易所"，对标 Robinhood 和盈透证券而非 Hyperliquid——其逻辑是链上流动性远落后于 CME 等传统场所，与其从零重建订单簿，不如"直接到流动性最深的地方去"

产品矩阵与运营数据

Variational 的产品呈"协议 + 双层应用"结构。

Omni（散户端）提供 550+ 市场的永续合约，覆盖加密货币、个股、黄金等大宗商品与指数，最高 50 倍杠杆，永久零交易手续费，用户成本内嵌于点差，高等级用户可获得点差折扣，另有 1–5% 概率的"亏损返还"奖励机制；

Pro（机构端）定位为自动化清算所，支持定制化期权与非标 OTC 衍生品，交易 API 计划随 B 轮资金落地。

2026 年 9 月推出的 swaps 是增长引擎：该工具直接接入传统金融机构的流动性，提供更窄点差与更可预测的持有成本，上线两个月累计交易量即突破 800 亿美元，推动 TradFi 市场占平台日交易量的比重升至 50–60% 以上

关键运营数据汇总：累计交易量 4750 亿美元+（2025 年初至今）、OI 13 亿美元+、账户 10 万+、30 天交易量约 664 亿美元；8 月 21 日公司披露上线 90 天的 TradFi 市场已积累 5 亿美元 OI 与 140 亿美元交易量。从质量指标看，Castle Labs 9 月快照显示其日换手率（交易量/OI）约 1.66 倍，介于 Hyperliquid（1.16 倍）与 Lighter（2.87 倍）之间——明显低于积分-farming 驱动平台常见的 7–9 倍，更"有机"的交易结构

VAR 代币经济学与 TGE 前瞻

TGE 定于 2026 年 Q4（自 Q3 推迟，官方称因"重塑发展路径的重大战略合作"）。初始分配为：创世空投 32%（按积分比例分配、TGE 时 100% 解锁、未领取部分销毁）、生态储备 18%（基金会管理）、团队与投资人 50%（锁仓 12 个月后在至少 3 年内线性释放，团队另有个人归属计划）；国库收入的 100% 将用于回购并销毁 VAR

积分计划自 2025 年 12 月 17 日启动（含 300 万回溯积分），此后每周发放 15 万分并将持续至 TGE，外部估算总积分约 1130 万分且仍在增发；账户需持有至少 1 分并签署代币条款方可获得空投资格。32% 全额解锁的空投比例与 Hyperliquid 的 31% 相当、高于 Lighter 的约 25%，是历史上最慷慨的 Perp DEX 空投设计之一；

竞品对比

![mwn479m72zinm6je.png](/uploads/mwn479m7-2zinm6je.png)


总结

模式层面：Hyperliquid 证明"链上自建流动性"可行，Variational 证明"链上聚合存量流动性"可行；两者的竞争本质是 CLOB 与 RFQ 两种华尔街经典市场结构在链上的重演，大概率长期共存、分别主导加密原生资产与 TradFi 资产。

数据层面：Variational 以 6.6% 的 OI 份额、约 8% 的 30 天交易量份额稳居第二梯队头部，其 1.66x 的低换手率和 TradFi 占比过半的结构，是当前所有挑战者中"交易量质量"最高的；

估值层面：按 B 轮 15 亿美元计算，VAR 的"估值/OI"倍数（约 2.2x）较已发币同行（4.6–11x）存在明显折价；

市场影响层面：这笔熊市融资确认了三条趋势——一级市场资金向"有收入的金融管道"集中；Perp DEX 竞争主战场从加密原生资产转向 RWA；"顶级机构 + 真实收入 + 明确 TGE"成为穿越熊市的唯一融资公式。

本报告基于截至 2026 年 11 月 19 日的公开信息撰写，仅供一般信息与研究参考，不构成任何投资

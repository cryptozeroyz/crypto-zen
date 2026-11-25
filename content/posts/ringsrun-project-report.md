---
title: "Rings（rings.run）项目调研简报"
date: "2026-11-23"
category: "research"
dexScreener: "https://dexscreener.com/solana/8fsuyvnty4r5fzuksjzkexlq2tx96k3updyrvw5xwj9t"
excerpt: "Rings 是 Solana 上的隐私交易应用层产品矩阵——私密 OTC 大宗交易台、匿名发币 Launchpad、私密 DEX 与交易终端——于 2026 年 11 月 10 日上线主网，全部结算在 Helius 当日同步主网上线的「Solana Privacy Rings」协议之上。 Rings 由独立团队开发运营，与 Helius 无隶属关系，仅调用其公开接口。"
tags:
  - "研究报告"
tokens:
  - "Rings"
draft: false
---

## 一句话定位

Rings 是 Solana 上的隐私交易应用层产品矩阵——私密 OTC 大宗交易台、匿名发币 Launchpad、私密 DEX 与交易终端——于 2026 年 11 月 10 日上线主网，全部结算在 Helius 当日同步主网上线的「Solana Privacy Rings」协议之上。 Rings 由独立团队开发运营，与 Helius 无隶属关系，仅调用其公开接口。

## 底层协议：Solana Privacy Rings

理解 Rings 的关键在于它是 Helius 隐私协议的「第一批应用层玩家」：

* 底层为可编程屏蔽池（shielded pool），默认 Ring 加密资产与金额、地址仍公开，采用 Groth16 zk-SNARK，毫秒级证明生成，直接在 Solana 主网结算，无 L2、无排序器。
* 核心程序与 ZK 电路已经 Certora、OtterSec、ZK Security 三家审计，形式化验证预计 2026 年底完成。
* Jupiter、Backpack、Squads、DFlow、Titan 等正在集成该协议，隐私正成为 Solana 生态的显性叙事。

## 产品矩阵（上线 13 天已迭代 56 次）


| 产品 | 功能 | 收费 <br /><br /><br /> |
| :--- | :--- | :---------------------- |


| OTC 交易台（otc.rings.run）    | 大宗代币/NFT 区块交易，规模与价格密封于单笔原子交易，支持分拆出售、密封竞价、SOL/USDC 结算                                             | 成交额 0.5%（卖方付）＋挂单费 0.02–3 SOL；持有足额 \$RINGS 可免挂单费<br /> |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Launch（launch.rings.run）     | 匿名发币：从隐私余额付款，Rings 用一次性密钥代发，链上创建者不暴露你的钱包；已支持 Meteora DBC、Raydium LaunchLab、Pump.fun 三个发射台 | 每笔交易 1.5%（1.2% 归 Rings 财库，0.3% 归 Meteora）<br />                   |
| DEX（dex.rings.run）           | 经 Jupiter 的私密兑换、限价单、止损、DCA，以及经 LI.FI / NEAR Intents 的跨链桥（含 ZEC、XMR、NEAR）                                    | 兑换类 0.5%                                                                  |
| Terminal（terminal.rings.run） | 新币看盘＋快速交易，支持 Pump.fun / Meteora / Raydium 币种，私密止盈止损                                                               | 0.5%                                                                         |
| 生态扩展                       | Rings Wallet（Chrome 扩展，暂经 GitHub 分发）、MCP 服务器（AI 应用可读取板块与账户）<br />                                             | —                                                                           |

差异化特色可归纳为三点：

1. **首日卡位**：与 Helius 协议主网上线同一天发布，是目前该协议上最完整的 C 端应用，吃「协议级首发生态位」。
2. **诚实披露的产品哲学**：Disclosures 和 How-it-works 页面逐行列出「链上可见什么、谁能看到什么、哪些简单数学会泄露隐私」，甚至主动警告金额匹配、时间关联等去匿名化路径——在隐私赛道里属于少见的透明度打法。
3. **合规对冲**：每个钱包连接与成交前均做筛查，被拦截钱包不能挂单或成交，明确「不帮助规避筛查」——与 Privacy Cash 因 Binance 黑客资金流入而暂停充值的事件形成对照。

## \$RINGS 代币与飞轮

* 用途：持有价值 ≥ 挂单费 80% 的 \$RINGS 可免 OTC 挂单费，是直接的实用型需求钩子。
* 飞轮机制（仍在快速调整）：Launchpad 费用定期（每 4 小时）在公开市场买入 $RINGS，一半销毁、一半注入 Meteora 上永久锁定的流动性池；11 月 21 日起创作者可分配费用流向（至少一半进飞轮，其余给持币者与创作者），同名抢发（anti-vamp）需付 4 SOL 也全部进入飞轮。
* 回购时间点随机化（10–20 分钟窗口）以防机器人抢跑。

注意：代币市值、流通量等链上数据我未能从公开聚合器核实（\$RINGS 尚未被主流行情站收录），建议直接在链上或项目面板核对。

## 预期催化剂

**项目自身路线图**

* 私密永续合约（进行中）——隐私＋衍生品是明显的产品空白点，若落地将是最大单一催化剂
* Rings SDK（开发者工具包）——从应用走向平台
* 前端重做、DEX 接入 Raydium 池
* Rings Wallet 上架 Chrome Web Store——分发渠道正规化

**底层协议带来的顺风车**

* Helius 匿名版 Custom Rings 目标 2026 Q4 主网，届时 Rings 可升级为隐藏收发地址的完全匿名，是其路线图上明确标注「等待 Helius」的一项
* 形式化验证 2026 年底完成，机构采用门槛降低
* 隐私板块整体热度（ZEC/XMR 行情、Solana 官方力推「public by default, private by choice」）带来的叙事 Beta

## 主要风险

1. **信任假设叠加**：除自身代码外，还依赖 Helius（程序可升级、2/5 多签可暂停、证明 enclave 可见金额）、Jupiter 报价、Meteora 曲线——任何一环出问题都会传导。
2. **团队匿名、极早期**：上线仅约两周，无公开融资与团队信息；zauth 审计发现的 5 个问题虽已修复，但均属站点层而非资金安全层。
3. **隐私的实际效果依赖用户行为**：存取款公开，金额/时间关联可被推断，协议自己也承认这一点。
4. **监管不确定性**：隐私工具全球监管口径仍在演变。
5. $RINGS 机制高频变动：飞轮规则在两周内改了至少四版（销毁→锁池→各半→费用分配），经济模型尚未定型。

## 小结

Rings 是「Solana 隐私基础设施落地」这一叙事下卡位最早、迭代最快的应用层项目：产品面广（OTC／发币／DEX／终端／钱包／MCP）、费用结构清晰、\$RINGS 飞轮有真实收入支撑，且合规姿态比同类隐私项目更审慎。核心看点是私密永续能否落地，以及 Helius 匿名 Custom Rings 上线后能否顺势升级；核心风险是团队匿名、项目极早期、飞轮规则频繁变动。

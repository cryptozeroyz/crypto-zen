---
title: "LiquidV Brief Research Report"
date: "2026-11-27"
category: "research"
excerpt: ""
tags:
  - "研究报告"
tokens:
  - "LiquidV"
draft: false
---

## I. What Is the Project

LiquidV "tokenizes" any publicly traded wallet on Hyperliquid: the protocol establishes a vault, mirrors the target wallet's perpetual contract positions proportionally, and then issues a Trader Token backed by the vault's net asset value (NAV). Investors buy and sell tokens without needing to manage a copy-trading account, margin, or liquidation themselves.

The main products include:

* \$vTRADER: goes long on a trader's performance;
* **\$iTRADER**: inverse tracking, benefiting when the trader loses;
* **2x/3x long and short versions**;
* **Pair**: goes long on one trader and short on another;
* **Basket**: combines multiple wallets into a single token by weight.

New tokens launch with approximately **1 HYPE**; after completing the seed phase, buys are minted at NAV and sells are redeemed at NAV. Its value therefore theoretically derives from real position P&L rather than relying entirely on later buyers taking over.

## II. Mechanism and Business Model

**Fee structure:**

* Both seed curve purchases and formal minting charge approximately 1%;
* Base redemption fee of **0.3%**, rising to a maximum of **1%** when idle cash is insufficient;
* The target trader receives **10%** of vault profits above the high-water mark, released over 30 days;
* The vault also bears Hyperliquid trading fees, funding rates, and mirroring slippage.

**Security design:**

The vault's Hyperliquid account is held by the contract, and the mirroring program uses an API Key that "can only trade, cannot withdraw"; there are also leverage and order size limits, a 24-hour binding time lock, circuit breakers, and a heartbeat mechanism. The target trader cannot directly control the vault.

This design reduces the risk of funds being directly transferred away, but **cannot eliminate losses caused by malicious or erroneous trading**. "Cannot withdraw" does not equal "no risk of asset loss."

## III. Actual Operating Data

The following is a snapshot from the project's public indexer, not third-party audit data:

* A total of **35 tokens** are listed: 24 bonded, 11 still bonding; of these, 23 are in warming status and only 1 shows as copying.
* Simply summing the holder fields across tokens gives **90**, but this is not a deduplicated user count; a single token has at most **8 holders**.
* A total of **40 vault addresses** are listed, with combined NAV of approximately **$10,400**; 16 of these vaults hold only about $3. The largest vault, vKOOL, accounts for about **50.7%** of total NAV, and the top two combined account for about **63.5%**, indicating high concentration.
* Aggregating `paidUsd` from the interface, approximately **$30** in revenue share has been paid to traders, proving the incentive loop is operational but insufficient to validate commercial viability.

A spot check on the block explorer shows the vFLOOD vault holds approximately **$1,327** in assets, broadly consistent with the order of magnitude listed by the indexer.

**Assessment: The project is not a pure concept, but it remains a very small-scale mainnet experiment and is far from validating product-market fit.**

## IV. Core Highlights

1. **Traders do not need to actively open a vault**: any public wallet can be tokenized, covering long-tail traders that native Vaults cannot serve.
2. **Upgraded from a "copy-trading tool" to a composable asset**: tokens can be further used in trading pairs, baskets, lending collateral, or other DeFi products.
3. **NAV minting and redemption reduce the pure Ponzi characteristic**: holder returns depend mainly on the mirrored account's performance rather than token speculation itself.
4. **Long/short, pair, and basket products are differentiated**: especially the "trader relative performance" product, which is relatively distinctive in the existing on-chain copy-trading market.

## V. Main Risks

* **Tracking and liquidation risk**: mirrored trades execute seconds late and are subject to fees, slippage, minimum order sizes, and market filters; in extreme conditions, the vault may be liquidated before the target wallet is.
* **Trader behavior risk**: historical profitability does not guarantee future performance; the wallet owner may also trade through other accounts, change strategy, or stop trading.
* **Redemption is not always instant**: large sells may enter a queue and ultimately settle at the actual closing value of positions.
* **Technical and centralization dependencies**: the current mirroring bot, Key Service, indexer, and Guardian multisig remain critical infrastructure.

## VI. Overall Assessment

What is most noteworthy about LiquidV is not short-term token speculation, but "turning public trading records into composable financial assets." The direction is innovative, and the mechanism design also accounts for practical issues such as copy-trading latency, trader incentives, and bank runs; however, the current vault scale of about $10,000, very few holders, and thin security disclosures mean it has not yet crossed the threshold of a credible asset management protocol.

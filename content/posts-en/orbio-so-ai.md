---
title: "Orbio.so In-Depth Research Report: A Crypto Experiment in the AI Inference Credit Market"
date: "2026-11-27"
category: "research"
dexScreener: "https://dexscreener.com/robinhood/0xa95b1fbdccb15d2b07509b980f63adab8a94303b1781f5ebc53b72942d12ddc1"
excerpt: "Orbio.so is a Robinhood Chain project centered on a discounted AI inference credits marketplace: developers access over 400 models through a single API key (relayed via OpenRouter) and purchase user-listed credits at discounts of 5%–55%. Over the past six weeks, the project has experienced a more dramatic \"hot-cold divergence\" than the first-edition report anticipated: product-side metrics have grown explosively, while the token side has completely given back its speculative premium."
tags:
  - "研究报告"
draft: false
---

# Orbio.so In-Depth Research Report: A Crypto Experiment in the AI Inference Credit Market (Updated Edition)

**Report Date: November 27, 2026** (First edition October 16; this edition fully updated based on the latest operational data) · Research Subject: Orbio.so (ORBIO, Robinhood Chain)

## Summary

Orbio.so is a Robinhood Chain project launched on August 31, 2026, centered on a **discounted AI inference credit market**: developers access more than 400 models (relayed via OpenRouter) through a single API key, purchasing credits listed for sale by users at discounts of 5%–55%. Over the past six weeks, the project has experienced a more dramatic "hot-cold divergence" than the first edition of this report anticipated: **product-side metrics have exploded, while the token side has completely given back its speculative premium**.

On the product side, the project has upgraded from a single credit market to an "agent infrastructure" platform: on September 25 it published the Agent Launchpad whitepaper, on September 30 it launched the encrypted inference gateway **Orbio Incognito**, in early November it added a **Chat interface**, and CREDIT credits can now pay for external tools such as Firecrawl, Apify, Alchemy, fal, and Higgsfield. As of November 26, the gateway has **cumulatively processed 5.5 million requests (+118% over 30 days), processed 655.7 billion tokens over 30 days (+682%), recorded 161 daily active users (+37%), and averaged 154 paying users per day**. On the token side, ORBIO fell from a peak of $0.1229 on October 4 all the way to about $0.0111 on November 25, **with market capitalization shrinking from $117 million to about $10.57 million, a drawdown of roughly 91%, having fallen back to mid-September levels**; staked volume dropped from 354 million tokens to about 310 million.

The relationship between valuation and fundamentals has changed fundamentally: the current market capitalization of about $10 million corresponds to roughly $48,500 in real inference consumption over the past 30 days (about $580,000 annualized) and about $10,000 in credit card payments, **with valuation multiples converging from "thousands of times revenue" to the order of "about 20 times annual usage and 100 times annual cash revenue"**—the price no longer completely ignores fundamentals, but demand quality (dominated by low-cost models, weak retention, and a 65% decline in registrations) still does not support a "utility-driven" narrative. Overall judgment: **the project team is exceptionally diligent in executing its product roadmap, but the flywheel's engine (token trading volume → credit subsidies) has clearly decelerated, and the project has entered the second half of "proving itself through product revenue."**

## 1\. Project Overview

### 1.1 Product Positioning: From "Discounted Credit Market" to "Agent Economy Infrastructure"

The first edition of this report defined Orbio as a discounted inference market of "credit resale + unified gateway," a description that has become outdated six weeks later. The official website's tagline is now "**The private frontier of intelligence**—every major model, below list price," and the product matrix has expanded into four layers. The first layer remains the **unified API gateway**: migration requires only changing the base URL and key, the catalog covers more than 400 models routed through an OpenRouter managed account, and zero data retention is promised ([Orbio official website](https://www.orbio.so/)). The second layer is the **credit order book**: CREDIT earned by stakers can be listed for sale at discounts of 0%–55%, with buyers paying in USDG plus a 5% platform fee.

The newly added third layer is **private inference**: Orbio Incognito, launched on September 30, is an encrypted inference gateway that uses confidential computing to protect data in processing and allows users to verify the computing environment—a differentiated capability for sensitive data workloads and the reason the official website has shifted to a "private frontier" positioning ([CMC](https://coinmarketcap.com/cmc-ai/orbio-so/what-is/)). The fourth layer is the **Agent Launchpad**: the project team issues tokens paired with ORBIO, and creator fees are automatically converted into the agent's operating budget; CREDIT balances can also pay for tools such as Firecrawl web scraping, Apify social data, Alchemy on-chain data, Zernio posting, and fal and Higgsfield image and video generation. Developers can integrate via MCP, OpenAI-compatible SDKs, or the API directly, and the official team provides a Claude Code plugin ([Orbio Launchpad](https://www.orbio.so/launchpad/whitepaper), [Orbio Launchpad page](https://www.orbio.so/launchpad)).

![Value flow mechanism (including Launchpad branch)](/uploads/mwykfrf7-vdexs5o5.png)

Value flow mechanism (including Launchpad branch)

Worth noting is a **fifth entry point that quietly appeared in early November: Chat**. The official analytics page has shown independent statistics for the conversation channel since November 3 (a single-day high of 14,244 requests), meaning Orbio is no longer just a developer API market but has also begun offering a conversation product directly to end users—consistent with the "private frontier" positioning: privacy-sensitive individual users are more likely to use the service through a chat interface than through an API.

### 1.2 Token Mechanism: Main Pathway and Launchpad Branch Operating in Parallel

The core mechanism is unchanged: each ORBIO transaction incurs a 1.5% fee, 50% of which is converted hourly into OpenRouter inference credits and distributed to users staking ≥1,000 tokens; CREDIT is an on-chain ERC-20 credit (1 CREDIT = $1 of inference quota), and activation burns the deposit. What is new is the **Launchpad branch**: agent token trading generates creator fees, allocated across four routes: "**50% to stake ORBIO for the agent, 30% sold for USDG to mint CREDIT for the agent, 10% recorded as the agent's spendable gateway balance, and 10% to the Launchpad treasury**"; once the agent's gateway balance cumulatively exceeds $5,000, that share is also converted to minting CREDIT ([Orbio Launchpad](https://www.orbio.so/launchpad/whitepaper)). The cleverness of this design is that **trading activity in agent tokens is automatically converted into the agent's compute budget**, which the whitepaper calls "revenue becomes working capital."

On November 15, on-chain data fully validated this pathway for the first time: a creator fee of 771.51 ORBIO was distributed—50% went to staking, 10% to the treasury, and the remainder was converted to USDG and used to mint 4.184 CREDIT issued to the agent wallet ([ARadar](https://aradar.dev/research-updates/)). On-chain verifiability is a genuine advantage of this project relative to similar "agent launchpads" (such as Virtuals and Clanker), but the conclusion recorded by third parties is equally fair: **the actual inference consumption and repeat-purchase demand of independent customers still need to be verified**.

### 1.3 Team and Governance: Still Anonymous, but Contract Details Expose New Risks

There is no new disclosure of team information compared with the first edition, and the official website and protocol pages still do not name the founder; what remains publicly traceable is still developer Yash (@0x\_aster) and advisor Jose (@The0xJose). However, third-party code-level due diligence on the contracts in early October revealed an important governance risk not covered in the first edition: **the staking contract is deployed behind an upgradeable proxy, and the sole upgrade permission (admin role) is held by an ordinary private-key wallet**—the contract comments describe it as an "offline admin wallet," and neither protocol page discloses who owns that wallet; although the pause function only freezes new staking and hourly settlements and does not freeze exits, an upgrade could in theory rewrite this rule ([Phemex](https://phemex.com/academy/what-is-orbio-orbio-robinhood-chain-ai-credit-token)). Another key detail is that **unstaking has no cooldown period**: in early October, about 345 million staked ORBIO (about $26.5 million at the price then) could be dumped at any time directly into a pool with only about $3.39 million in liquidity; if a crisis of confidence occurs, stakers' escape route would be instantly blocked.

The token contract itself is relatively clean: no minting function, no blacklist, no transaction tax, a supply of 950,000,903.73 (some already burned), and launch completed through the Pons curve with no team allocation or unlock schedule; however, the top 20 addresses hold 70.84% (including the staking contract, lockups, and the Uniswap pool, three contracts), and after excluding these, 17 addresses still hold 23.2%—the conclusion of high token concentration is consistent with the first edition ([Phemex](https://phemex.com/academy/what-is-orbio-orbio-robinhood-chain-ai-credit-token)). Accordingly, this edition of the report raises "governance and custody risk" to one of the highest severity levels in the risk section.

## 2\. Data Growth Analysis

### 2.1 Token Market: A 91% Drawdown and the Complete Clearing of the Speculative Premium

ORBIO's price trajectory is the most intuitive footnote to "flywheel fragility." After peaking at $0.1229 on October 4, the price went through three downlegs: a single-day -25.2% during the October 8 market-wide selloff; a final pulse from the October 21 Launchpad upgrade news (single-day +74.1%, market cap back to $35.88 million); then a slow bleed to $0.0171 on November 19, with **FDV at just $10.57 million on November 25 (about $0.0111)—not only a roughly 91% drawdown from the peak, but even below the $13.6 million recorded by CoinGecko on September 15** ([CoinMarketCap](https://coinmarketcap.com/cmc-ai/orbio-so/price-prediction/), [Foresight News](https://global.foresightnews.pro/article/17891), [CoinGecko](https://www.coingecko.com/learn/pons-stock-token-reserves-robinhood-chain), [Robinswap](https://robinswap.trade/tokens/orbio-12/)).

![ORBIO price trajectory](/uploads/mwykft9u-m72xt0d5.png)

ORBIO price trajectory

Weakening in tandem with the price is the flywheel's fuel: staked volume fell from 354 million tokens on September 21 to about 311 million on October 21 (32.7% share); the subsidy engine of "0.75% of trading volume converted into credits" decelerated as trading volume shrank, and falling staking yields in turn pushed some stakers to exit—half of the negative feedback loop warned about in the first edition has already materialized. On market structure, CoinCodex shows the fear and greed index once fell to **10 (extreme fear)**, the 50-day moving average at $0.038 acts as resistance, the top 10 wallets still hold over 50% of supply, and daily turnover is just 0.13 ([CoinCodex](https://coincodex.com/crypto/orbioso/price-prediction), [CoinMarketCap](https://coinmarketcap.com/cmc-ai/orbio-so/price-prediction/)). It should be noted objectively that **this may also be a state in which risk has been fairly fully released**—market cap has returned to the pricing range of a "product option," and for speculative capital the worst case is to a large extent already visible.

### 2.2 Product side: the brightest growth curve in six months is here

Completely opposite to the token's trajectory, product operating data has undergone an order-of-magnitude leap over the past six weeks. The official analytics page (November 26 data) shows: **5.5 million cumulative requests, +118% over 30 days; 655.7 billion tokens processed over 30 days (+682%); average daily active users 161 (+37%); paying users averaging 154 per day, with average monthly usage per user of $118.24; 10,100 unique website visitors, a 3.5% registration conversion rate, and 33% weekly stickiness** ([Orbio Analytics](https://www.orbio.so/analytics)). Against historical data: on September 21 cumulative requests were only 249,500 and tokens 20.5 billion—meaning **request volume grew about 22x in two months**. The 547,000 requests recorded by CoinGecko on September 30 became 5.5 million by November 26—the growth is continuous and verifiable.

![Daily active and paying users](/uploads/mwykfur8-bjkk28gl.png)

Daily active and paying users

In terms of usage structure (see chart below), **daily inference spend is stable in the $1,000–2,700 range, totaling $48,480 over 30 days, exactly matching the official site's "Usage $48.48K" counter** (we verified this consistency by summing the daily breakdown). Model calls account for the overwhelming majority (30-day $39,785), tool calls $8,643 with an anomalous surge on November 9–10 (single-day $2,210/$3,318), possibly related to a batch of Agent tasks running in a concentrated period. Broken down by model (see model structure chart), **DeepSeek V4.1 Flash alone accounts for 84% of token volume**, with GPT-6 Luna and Claude Opus 5.5 together under 7%—indicating usage is highly concentrated in low-cost open-source models, consistent with the scenario of "developers buying discounted credits to run high-consumption workloads," but it also means that if platform revenue is priced as a markup on upstream costs, actual profit margins will be compressed by the low-cost model mix.

![Daily usage cost](/uploads/mwykfwa0-06fox52h.png)

Daily usage cost

![Model token structure](/uploads/mwykfxro-0eaz5jq2.png)

Model token structure

Credit inventory on the supply side also continues to grow: order book inventory was about $99,581 on October 3 (maximum discount 40%), reaching $195,871 on October 16 (maximum discount 55%), while third-party records in early October of "the last 20 purchases totaling about $112 over six hours" reveal that the order book's real liquidity remains extremely thin—**nearly $200,000 of listed supply corresponds to sparse bids**, which together with the 30-day $48.5K burn rate indicates that credits are currently mainly consumed by stakers themselves and through small discount purchases, and that the order book's depth as a "secondary market" has yet to form ([Phemex](https://phemex.com/academy/what-is-orbio-orbio-robinhood-chain-ai-credit-token)).

![Order book inventory structure (October 16 snapshot, historical data)](/uploads/mwykfz8f-irhfelg5.png)

Order book inventory structure (October 16 snapshot, historical data)

### 2.3 Growth quality: three concerns that must be confronted

The quality of the growth data needs calm scrutiny on three fronts. First is **the true paid nature of demand**. The 30-day usage of $48.5K is "inference value consumed," not cash revenue: credit card payments over the same period were only **$10,018 (-20% MoM)**, of which a single day on November 1 accounted for the vast majority at $7,725—excluding that anomalous day, average daily card payments are under $80. "Paying users averaging 154 per day" counts accounts that consumed paid balances (including staking-earned and gifted credits), which is a different concept from "card-paying users." **Annualized real cash revenue is about $100–120K, still at the scale of "product just getting started" rather than "business model validated"** ([Orbio Analytics](https://www.orbio.so/analytics)).

Second is **deteriorating acquisition and retention**. 30-day registrations were 1,289, **-65% MoM**; weekly retention data shows second-week retention of just 2%–7% for most registration-week cohorts (the best, the October 26 cohort, had 26% W1 retention and still 20% at W4, during Build Week—an event-driven week). The registration decline coincides with the broader market's retreat in risk appetite, indicating that current traffic still depends heavily on ecosystem hype rather than organic product growth ([Orbio Analytics](https://www.orbio.so/analytics)).

Third is **the water content in the "revenue" figure**. On October 21 media reported "cumulative protocol revenue of about $437,000," but this includes the portion of ORBIO collected by the Launchpad treasury converted at daily market prices—against the backdrop of a 91% token decline over 90 days, the purchasing power of such "revenue" evaporates in tandem; actual API consumption over the same period's last 14 days was only about $15,200, which is the true reading on the demand side ([Foresight News](https://global.foresightnews.pro/article/17891)). Taking the three concerns together, our judgment is consistent with the first edition but with stronger evidence: **the project has moved past the pure narrative stage, but the ultimate validation of "sustainable repeat purchases by independent paying customers" remains incomplete**.

## 3\. Valuation analysis

### 3.1 Valuation level: from "thousands of times revenue" converging to "tens of times usage"

Based on the November 25 FDV of about $10.57 million, valuation multiples have changed by orders of magnitude: against 30-day real usage ($48.5K, annualized about $580K) it is about **18x P/Usage**; against annualized cash revenue (about $100–120K) it is about **90–105x P/Revenue**—still not cheap, but it has converged from the first edition's pure narrative pricing of "over 4,000x cumulative revenue" to a range of mixed pricing of "high-growth option + real product revenue" ([Robinswap](https://robinswap.trade/tokens/orbio-12/), [Orbio Analytics](https://www.orbio.so/analytics)).

![Valuation coordinates](/uploads/mwykg0lt-od4mkozk.png)

Valuation coordinates

Compared with comparables: Venice (VVV) has a market cap of $1.635 billion and processes 1.3 trillion tokens per month, and its "token processing volume per dollar of market cap" is about 1/5 of Orbio's current level; OpenRouter has annualized revenue of $160 million and has raised $40.5 million cumulatively. Orbio's current $10 million pricing roughly equals an acquisition-style valuation of "an early-stage product with $1,300 daily inference consumption, a complete credit tokenization protocol, and a Launchpad," **speculative bubble components have clearly compressed, and what remains is mainly disagreement over growth sustainability**.

### 3.2 Three methods for anchoring valuation to fundamentals

Valuation anchor

Value

Implied multiple (@ $10.5M)

Assessment

30-day usage (consumption value)

$48.5K (annualized ~$580K)

~18× P/Usage

The closest proxy to "platform GMV," but upstream costs are not deducted

Annualized cash revenue (card payments)

~$100–120K

~90–105× P/Rev

Real but extremely early-stage, and down month-over-month in November

Credit order book inventory

~$196K (10/16 snapshot)

~54×

Signal of excess supply and insufficient buyer depth; not suitable as a valuation basis

It should be emphasized that **none of the three methods yet accounts for the cost side**: inference costs are procured at OpenRouter wholesale prices. Assuming platform gross margin of 10%–20%, current annualized gross profit is only $60–120K, implying 80–170× P/GP at a $10 million market cap—the reasonableness of the valuation rests entirely on the bet that "usage will continue to grow at triple-digit percentages." The good news is that growth momentum genuinely exists on the product side (Chat launch, tool ecosystem, Launchpad Agent pool); the bad news is that the month-over-month decline in registrations and cash payments suggests the growth engine is not yet stable.

## 4\. Industry and Competitive Landscape

### 4.1 Macro Track: Expansion of the Inference Market and Crowding of the "Agent Issuance" Track

The logic of the AI inference market remains unchanged: the global inference market is approximately $117.8 billion in 2026, expanding at a CAGR of about 13% toward $312.6 billion by 2034, with agentic AI spending being the fastest-growing subsegment ([Fortune Business Insights](https://www.fortunebusinessinsights.com/ai-inference-market-113705)). What has changed is the niche Orbio operates in: it now sits in two tracks simultaneously—the **credit circulation/routing layer** (benchmarked against Venice and the OpenRouter ecosystem) and the **Agent token issuance layer** (benchmarked against Virtuals Protocol, Clanker, and Mosh)—and the latter had already become quite crowded by Q4 2026.

![AI inference market size](/uploads/mwykg1us-qszjnh8c.png)

AI inference market size

![OpenRouter annualized revenue](/uploads/mwykg42m-5re2tv8f.png)

OpenRouter annualized revenue

Foresight News's mechanism comparison clearly illustrates Orbio Launchpad's relative position: on Virtuals Protocol, each Agent token is paired with VIRTUAL, graduates into a formal liquidity pool after the curve accumulates 42,000 VIRTUAL, and trading taxes are split between creators and the platform; Clanker supports directly attaching an AI Agent called Droid at issuance, with 10% of LP revenue (adjustable from 1%–50%) by default paying for Droid's inference costs; **Orbio's differentiation lies in its four-way automatic allocation of creator fees, which turns "trading activity → Agent compute budget" into a seamless on-chain program, and its CREDIT-payable tool suite (search, data, posting, image and video) is closer to Agents' real operating costs than pure inference subsidies** ([Foresight News](https://global.foresightnews.pro/article/17891)). As of October 21, the Launchpad had launched 2,065 Agent tokens with a combined market cap of approximately $8.42 million—a considerable number, but the average per token is only about $4,000, indicating that the vast majority have yet to develop substantive demand. This is a common characteristic of the entire "agent issuance" track, not a problem unique to Orbio.

### 4.2 Upstream Dependence and Ecosystem Soil: The Wind Is Still There, but the Direction Has Changed

OpenRouter remains an upstream dependency Orbio cannot bypass (annualized revenue of $160 million, 8 million+ developers, quadrillion-level tokens), and the structural risk of single-point dependence is the same as in the first edition. What has changed is the Robinhood Chain ecosystem soil: the capital enthusiasm for Pons launchpad's "token-stock pairing" speculation cooled markedly in November, and the ecosystem's attention half-life for any single narrative is very short—CoinGecko's retrospective shows that the leading position among tokenized stock-related tokens changed hands multiple times within weeks, meaning the ecosystem beta ORBIO once enjoyed is now receding ([Sacra](https://sacra.com/c/openrouter/), [CoinGecko](https://www.coingecko.com/learn/pons-stock-token-reserves-robinhood-chain)). For Orbio, this brings a structural relief and a new vulnerability: declining token trading volume slows the "trading fees → credits" subsidy (negative), but Launchpad creator fee sharing and the tool ecosystem diversify revenue sources (positive). **The project's revenue structure is transitioning from "single reliance on ORBIO trading taxes" to three sources: "Launchpad creator fees + platform fees + card payments."** This is the most important structural change of the past six weeks and the fundamental reason the valuation can move away from pure speculative pricing.

## 5\. Conclusion and Outlook

Six weeks ago, we described Orbio as an extremely high-risk project with "genuine product ideas and elegant mechanism design, but a valuation supported by token speculation." After this update, the picture has become clearer and more polarized. **At the token level, the prophecy fulfilled itself**: the flywheel's negative feedback ran its full course—trading volume shrank → credit subsidies slowed → stakers exited → the price stepped down further, with market cap falling from $117 million to $10.57 million. The speculative premium has largely been flushed out, and the CoinCodex Fear & Greed Index touched an extreme level of 10. **At the product level, growth exceeded first-edition expectations**: request volume grew 22× in two months, monthly token processing reached 655.7 billion, daily active and paying users both broke 150, and the product matrix expanded from a single gateway into a complete narrative of "credit marketplace + private inference + conversational entry point + Agent Launchpad + tool suite"—the team's delivery density ranks among the best in comparable projects.

Over the next two quarters, what determines the project's direction is no longer narrative but three sets of verifiable numbers: **First, whether usage can move from a monthly average of $48.5K to $100K+ driven by Chat and the tool ecosystem** (growth sustainability); **Second, whether card payments can escape the low of ~$10K per month and whether the share of repeat customers can rise** (demand authenticity); **Third, whether among the Launchpad's 2,065 Agent tokens, leading Agents with monthly consumption in the thousands of dollars can emerge** (whether the ecosystem flywheel ignites). If all three improve, the current valuation in the $10 million range will look cheap; if usage turns negative month-over-month and staking continues to bleed, the project will degenerate into yet another high-volatility footnote in the Pons ecosystem cycle—this judgment is consistent in direction with the first edition's conclusion, but the first edition's prediction of "valuation returning to fundamentals" has already been realized ahead of schedule. What the market is offering now is a re-pricing of opportunity and risk that is closer to the true starting point.

**Disclaimer**: This report is based on public information and is intended solely for general informational and research purposes. It does not constitute any investment, legal, or financial advice. Crypto assets are extremely volatile; please do your own research (DYOR) and consult licensed professionals.

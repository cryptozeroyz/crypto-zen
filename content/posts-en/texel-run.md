---
title: "Texel (texel.run) Rapid Research Report"
date: "2026-11-26"
category: "research"
dexScreener: "https://dexscreener.com/robinhood/0x5e73f5892ef5cf4d553fe0cc9b109e884c3c2a52635bf6c4f1dceff9637fe932"
excerpt: "Texel is a project with a relatively mature product but still very early-stage operations, positioned as an \"on-chain GPU cloud + AI Agent payments\" platform. The product is worth trying out with a small amount and continuing to watch; the token incentives currently clearly bear the characteristics of cold-start subsidies, and it is not advisable to judge its value solely based on burns or NVDA yields."
tags:
  - "研究报告 AIAgent"
tokens:
  - "Texel"
draft: false
---

## I. What the Project Does

Texel is built on **Robinhood Chain**, and its core proposition is turning GPU compute and AI model inference into services that can be purchased directly with a crypto wallet, aimed primarily at developers and AI Agents.

It currently includes four product categories:

* **Model inference**: Image, video, speech, and 3D generation, paid per use.
* **GPU rental**: SSH and Jupyter access, billed by the second, covering RTX 2000 Ada through B300.
* **Serverless**: Deploy Hugging Face models or your own containers, charged by actual GPU runtime.
* **Agent infrastructure**: APIs, MCP, and x402 payments that let Agents autonomously call models, rent GPUs, and set daily budgets.

I actually checked the public endpoints: they currently return **14 models and 28 GPU types**, which shows the project is more than a static marketing page; however, I did not run paid generation or rent a machine in this review, so actual speed, stability, and supply quality remain to be verified.

## II. Payment and Token Mechanics

Users first purchase Texel credits, then pay for models and GPU usage. 1 credit corresponds to a list price of 1 USD, sold at 0.70 USDG during the launch phase—a 30% discount; unused balances can be refunded. Payment is supported in USDG, ETH, TEXEL, and certain tokenized stocks.

**Three main uses of TEXEL:**

1. Use TEXEL to buy credits; after the corresponding credits are consumed, the related TEXEL is burned hourly.
2. Hold at least 1,000 TEXEL in a wallet to receive 50 free image and 2 free video generations per day.
3. Hold TEXEL to receive tokenized NVDA pro rata to holdings—the Earn mechanism.

The TEXEL contract address is:
`0x0ddcab9ae04bda0c87ecc1640636fa11e8e613e8`

## III. Public Operating Data: Growth Has Started, but Real Demand Is Very Small

The official Analytics page currently discloses:

* Cumulative **355.9 GPU hours**;
* Cumulative **64.04 million TEXEL burned**, about 6.4% of total supply;
* **19.72 million TEXEL** bought back;
* Earn has injected **85.55 NVDA**, worth about **$13,630** at the time of injection, covering 2,605 receiving wallets.

However, the receipts page shows that since November 7 there have only been:

* **24 rentals and 166 model outputs**;
* Of these, **111 were free outputs, about 67%**;
* Cumulative purchases of **943.19 credits**, with top-ups equivalent to **660.23 USDG**;
* Actual consumption of only **38.01 credits**.

Therefore, at this stage it should be viewed as an **early testnet**, not a GPU cloud that has already generated meaningful revenue.

In addition, the 6.4% burn cannot be entirely interpreted as deflation driven by real demand: about **59.806 million TEXEL** came from the launch burn on November 3, accounting for roughly 93% of cumulative burns. The value of NVDA injected through Earn is also significantly larger than the public top-up volume, and the source of funds and long-term sustainability still need further explanation.

## IV. Project Highlights

* **Relatively complete product chain**: From models and machine rental to Serverless, API, MCP, and x402, all have been implemented.
* **Clear Agent-native design**: Single-signature payments, independent budgets, and emergency stop features fit the scenario of Agents autonomously consuming compute.
* **Good public transparency**: Contract addresses, top-up and burn records, buyback records, receipts, and daily changelogs are provided.
* **On-chain receipts are verifiable**: Receipt Merkle Roots are written on-chain hourly, reducing the risk of the platform tampering with consumption records after the fact.

## V. Main Risks

1. **Opaque team and entity**: In this review, I did not find a named team or third-party security audit disclosed on the official website. Open-source contract verification does not equal a security audit.
2. **Discrepancies between marketing and roadmap**: The homepage describes features such as "cheapest/fastest/secure routing," "idle auto-stop," and a "GPU seconds market" as product capabilities, but the roadmap still lists them as Planned; actual available functionality should be the benchmark.
3. **Very low real adoption**: Public top-ups, paid consumption, and rental counts are not yet sufficient to validate the business model.
4. **Incentive sustainability is questionable**: NVDA distribution and free generation have strong subsidy characteristics and cannot simply be extrapolated as long-term returns.
5. **On-chain receipts are not proof of compute authenticity**: They can prove that platform records have not been tampered with, but cannot independently prove that the specified GPU was actually used or that model computation results are correct.
6. **Strong ecosystem dependence**: Dependence on Robinhood Chain, USDG, Uniswap liquidity, and the availability of tokenized stocks.

## VI. Overall Assessment

**Product level: Watch positively; small-scale testing is acceptable.**
Prioritize testing low-cost image models, the API, and the refund process before considering GPU rental; do not deposit large amounts of credits upfront.

**Token level: Caution.**
TEXEL already has payment, free-quota, and burn utility, but at this stage the holding returns and burn data contain a strong launch-incentive component and cannot yet be proven to be supported by real compute revenue.

**Three metrics most worth tracking going forward:** whether paid credit consumption continues to grow, whether the share of free outputs declines, and whether Earn's NVDA is clearly sourced from ongoing operating revenue.

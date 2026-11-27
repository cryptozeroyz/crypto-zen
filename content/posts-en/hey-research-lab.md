---
title: "HEY Research Lab ($HEY) Brief Research Report"
date: "2026-11-27"
category: "research"
dexScreener: "https://dexscreener.com/robinhood/0x1f0da4872bea85b2f95064d1c89671a5e578d114c375597d23962a0579771d16"
excerpt: "HEY Research Lab is a \"project development activity and evidence data layer\" for Robinhood Chain: through public sources such as code repositories, version releases, contract deployments, and project websites, it answers \"whether people are still building this project and what has recently been delivered,\" rather than giving buy or sell recommendations based on token price, trading volume, or wallet behavior."
tags:
  - "研究报告"
tokens:
  - "HEY"
draft: false
---

**HEY Research Lab is a "project development activity and evidence data layer" for Robinhood Chain**: through public sources such as code repositories, version releases, contract deployments, and project websites, it answers "whether a project still has people building it and what has been delivered recently," rather than giving buy or sell recommendations based on token price, trading volume, or wallet behavior.

* **Product level is relatively positive**: The positioning is clear, the product is already live, data coverage is broad, development is active, and fairly complete machine interfaces have been built for APIs, MCP, and AI Agents.
* **Commercialization is still early**: Token utilities such as research requests, bounties, and API quotas have been implemented, but the scale of actual paid research and external API usage remains small.
* **Transparency has shortcomings**: The team is anonymous, not all production code is open, and treasury spending and creator taxes have not yet fully entered the public ledger.
* **\$HEY risk is significantly higher than the product itself**: Market cap is small, recent gains have been large, actual trading depth is thin, and the token does not share revenue or generate yield.

## Problems Solved and Product Mechanism

In a permissionless on-chain environment, the barrier to issuing tokens and building websites is very low, but it is difficult for external users to determine:

* Whether a project truly has a team continuously developing;
* Whether the token, website, GitHub, and contracts belong to the same project;
* Whether recent "positive news" is actual product delivery or marketing announcements;
* Whether a project is still being built but has simply not yet gained market attention.

HEY transforms these questions into **indexable, traceable development evidence records**, primarily serving traders, researchers, project teams, and AI Agents that need to automatically read research conclusions.

### Data and Evaluation Method

The "deliveries" recorded by HEY include version releases, contract deployments, integrations, SDKs, documentation, and actual work from some community-type projects; marketing announcements, giveaways, and promotional posts are not counted as building activity. Bot submissions, duplicate automated submissions, and commits that only modify documentation or dependency versions are also excluded or downgraded.

Its Build Momentum score consists of five parts:

* Recency of delivery: 35%;
* Continuity of delivery: 25%;
* Importance of delivery: 20%;
* Evidence quality: 15%;
* Source diversity: 5%.

**The advantage of this design** is that it separates "building" from "price" and attempts to suppress behavior such as commit farming and release farming; **the limitation** is that the score is still designed and executed by the project itself, and public code activity cannot fully represent private development, product quality, or commercial prospects.

## Product Progress and Real Adoption

### 1. Data coverage has reached a certain scale

As of this query, the official website discloses:

* Published project pages: 5,630;
* Research-ready projects: 1,598;
* Robinhood Chain Verified Builders: 1,452;
* Currently active builders: 545;
* Projects currently in Shipping status: 238.

This shows that HEY is no longer just a concept product, but has formed a relatively large-scale project database. However, "inclusion volume" does not equal "active user usage," and it also includes many projects without building evidence or without an active market.

### 2. The project itself is relatively active in development

HEY's own page records that it has shown valid deliveries for 12 consecutive weeks, with 18 counted deliveries in the past 30 days; the public code dimension shows 46 active days, 3 contributors, and 22 GitHub Releases in the past 60 days.

This corroborates the continuous updating of the product, but it should still be noted: **this is HEY evaluating itself using its own rules, not an independent third-party rating.**

### 3. External usage and paid demand remain early

The status page shows 13,265 requests with API Keys this month, from 16 accounts; last month it was 41,774.

Research economy data shows that so far only the following have been completed:

* 1 paid research request;
* 14 free research requests;
* 1 completed bounty;
* 0 approved research notes;
* 0 rounds of research funding voting.

Therefore, **HEY has proven that it "can produce data," but has not yet fully proven that "the market is willing to continuously pay for this data."**

## Business Model and \$HEY Token

### 1. Revenue Sources

Current or planned revenue sources include:

1. **Trading creator tax**: A 2% fee is charged on each \$HEY transaction (plus a +1 pons creator fee, with traders paying a 3% transaction fee), which goes to the project treasury;
2. **Research requests**: About \$10 each, paid in \$HEY;
3. **Paid placements labeled as sponsored**: Not yet open;
4. **API/MCP usage fees**: Not yet open.

Under policy, the creator tax is evenly allocated across three directions: research bounties, infrastructure and data, and platform operations, and is not used for buybacks or market operations.

The advantage of this model is that it can fund data and research work in the early stage; the problem is that **revenue is highly dependent on token trading activity and may be disconnected from real enterprise data revenue**.

### Token Utility

The main utilities currently open include:

* Paying for research requests;
* Holding-tier discounts;
* Research evidence bounties;
* Higher monthly API quotas;
* Research Terminal Beta access.

## Market Competitiveness and Potential Moats

![mwysz6xtzlbclhvq.png](/uploads/mwysz6xt-zlbclhvq.png)

**Overall assessment: The product direction is worth watching, but the commercialization and token investment logic still need verification.**

The most valuable aspect of HEY is not "scoring projects," but attempting to establish a set of **citable, machine-readable project building records that can be traced back to original sources**. This positioning aligns well with new-chain project discovery, trading terminals, and AI Agent research needs.

However, the more reasonable current positioning is still: **an early-stage vertical data product + experimental research economy + high-risk micro-cap token**, rather than a mature research platform with a proven business model.

The five indicators most worth tracking going forward are:

1. Whether the number of independent API accounts, external integrations, and sustained call volume grow;
2. Whether paid research requests and actual revenue move beyond the single-digit stage;
3. Whether the Base expansion can form a sustained, automated second-chain data product;
4. Whether treasury income and expenditure, creator taxes, and team spending can be fully disclosed;
5. The holding concentration and real market depth of \$HEY.

---
title: "Mori Finance Research Report: Is the \"DeFi Option\" of Entrusting Assets to a Company Worth a 167% Premium?"
date: "2026-11-17"
updated: "2026-11-17"
category: "research"
dexScreener: "https://dexscreener.com/solana/hbywtfdywgw45a69cg4jwzft78kmnd9q4kvkacusdwb8"
excerpt: "What Mori Finance does can be summed up in one sentence: You deposit your SOL, cbBTC, and PENGU, choose a price at which you're willing to sell and an expiration date, and immediately receive a USDC premium. If the price hasn't risen to the strike price by expiration, both the tokens and the premium are yours. If it has risen above that, they're sold at the price you set. In traditional finance, this is called a covered call, a business worth trillions of dollars. But on Solana, it's the first time this has been done with long-tail assets — coins like PENGU. Deribit wouldn't even open an options market for them."
tags:
  - "研究报告"
tokens:
  - "MORI"
draft: false
---

Solana finally has its first viable options protocol, but its most intriguing aspect is also its most perilous one.

What Mori Finance does can be summed up in one sentence: You deposit your SOL, cbBTC, and PENGU, choose a price at which you're willing to sell and an expiration date, and immediately receive a USDC premium. If the price hasn't risen to the strike price by expiration, both the tokens and the premium are yours. If it has risen above, they're sold at the price you set. In traditional finance, this is called a covered call, a business worth trillions of dollars. But on Solana, it's the first to apply this mechanism to long-tail assets — coins like PENGU. Deribit wouldn't even open an options market for them.

What's really worth considering is its architecture. Over the past five years, the graveyard of on-chain options has been home to eleven protocols, including Opyn, Hegic, and Ribbon, all of which died for the same surprising reason: smart contract risks combined with a lack of takers for the on-chain order book. Mori's answer was radical: simply not to operate purely on-chain. The front end remains on Solana, but the assets are held in custody by Mori, and trades are executed through its own OTC account with a Kraken-backed institutional market maker.

Do you understand? It criticized Deribit for being too centralized, and then used a structure that was even more centralized than Deribit. User assets are not held in an auditable contract, but rather in a company's custodial chain, with only one market maker as the counterparty. The terms on the official website state that they "do not hold users' private keys," but the fundraising materials explicitly state that "Mori holds users' funds in custody." This narrative inconsistency could cause significant problems if something were to go wrong.

But the other side of the contradiction is that its token terms are almost abnormally clean.

There are no VC shares. The total number of tokens is 25.8 million, with 38.76% allocated to the public offering and 50% to the team. All tokens are locked until May 2028, after which they will be unlocked based on price milestones – the first tranche will be unlocked when the 90-day average price reaches 2x, and full unlocking requires a 32x increase. The founders can't make money unless the token holders make money first. Founder Pavan Katepalli: An early executive at Trilogy Education, which was sold to the publicly listed company 2U for $750 million; previously worked in technical architecture at Consensys.

The ICO on November 9 also validated the demand: the target was $250,000, and 248 people pledged $7.7 million, which was 30.8 times the target, with an average allocation rate of only 3.25%. Three days after listing, the price rose from \$0.025 to \$0.072, an increase of 187%.

Now, let's calculate the valuation. There is about $300,000 in the treasury, and the NAV per share is $0.0269 — this is the hard floor under futarchy governance. In extreme cases, token holders can vote to liquidate and distribute the funds (this actually happened on MetaDAO, and Ranger Finance was liquidated in this way). However, the market price is \$0.072, a premium of 167%. Now, let's look at the business: The self-reported trading volume in October was $1.7 million. Based on a 12% premium commission estimate, the protocol's annual revenue is approximately $35,000. The FDV of $1.85 million corresponds to a price-to-earnings ratio of 53.

In other words, less than 40% of the current price is "money," and more than 60% is a down payment for a story: The options vacuum for Solana's long-tail assets is real (options open interest has just historically surpassed futures), and the path of Rysk growing from $50 million to $182 million on HYPE over five months is also real – but Mori's current monthly volume is only 0.9% of Rysk's. There is an execution gap of 6 to 12 times in between, and the only publicly available member of the team is the founder. The $250,000 in funding is only enough to last 6 months based on the spending cap.

My conclusion: This is not a yield agreement; it's a call option on the track with clean terms. The treasury provides a floor, the milestones lock in the team, and futarchy grants liquidation rights — it reduces the probability of "project team misconduct" to the lowest level among similar projects. However, the tail risk of the custodial structure will always exist. What you are essentially buying into is the proposition that "Solana will have its own Rysk," and Mori is currently the only candidate.

It's enough to keep an eye on four things next: whether the monthly trading volume can break 5–10 million, when the second market maker will enter, whether there is a proof of reserves or a custody audit, and whether GRASS/JUP/MET/ORCA can run on the dOTC platform.

Not investment advice, DYOR.

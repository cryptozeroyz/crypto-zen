/**
 * alpha.ts —— Daily Alpha · 每日好运签数据层（客户端安全，无 fs）
 *
 * - 48 支签 × 中英双语（标题 / 签文 / 签解）
 * - 四等级 + 权重：上上 15% / 上 35% / 中 35% / 下 15%
 *   下签用 Degen 幽默包装「风险提示」，抽到也愿意分享
 * - 抽签用 crypto.getRandomValues 驱动，按等级分池
 */

export type AlphaTier = 0 | 1 | 2 | 3;

export interface AlphaFortune {
  id: number; // 1-48，展示为 NO.0xx
  tier: AlphaTier;
  cat: "hodl" | "wagmi" | "degen" | "reversal" | "meme" | "humor";
  zh: { title: string; text: string; note: string };
  en: { title: string; text: string; note: string };
}

export interface TierMeta {
  zh: string;
  label: string; // 大吉 / 吉 / 平 / 小心
  en: string;
  descZh: string;
  descEn: string;
  color: string; // 主色（金 / 金 / 灰金 / 红）
}

export const TIERS: TierMeta[] = [
  {
    zh: "上上签",
    label: "大吉",
    en: "GOOD FORTUNE",
    descZh: "好运爆棚，Alpha 降临，财富自由似乎又近了一步。",
    descEn: "Peak luck. Alpha inbound — financial freedom feels one block closer.",
    color: "#D8B56D",
  },
  {
    zh: "上签",
    label: "吉",
    en: "FORTUNE",
    descZh: "运势不错，保持耐心，机会正在积累。",
    descEn: "Solid fortune. Stay patient — opportunity is compounding.",
    color: "#D8B56D",
  },
  {
    zh: "中签",
    label: "平",
    en: "BALANCED",
    descZh: "市场平稳，保持 DYOR，不急于出手。",
    descEn: "Steady markets. Keep doing your own research — no rush.",
    color: "#9298A5",
  },
  {
    zh: "下签",
    label: "小心",
    en: "CAUTION",
    descZh: "今日宜休息，远离 FOMO，守住本金就是胜利。",
    descEn: "Rest day. Away from FOMO — protecting your principal IS the win.",
    color: "#B83A35",
  },
];

const F = (
  id: number,
  tier: AlphaTier,
  cat: AlphaFortune["cat"],
  zh: AlphaFortune["zh"],
  en: AlphaFortune["en"]
): AlphaFortune => ({ id, tier, cat, zh, en });

export const FORTUNES: AlphaFortune[] = [
  // ── A. 持币信仰类 ──────────────────────────────
  F(1, 0, "hodl",
    { title: "持币待涨", text: "持币待涨，静待花开。真正的 Alpha，往往属于有耐心的人。", note: "市场可能会波动，但你的心态不应该跟着 K 线一起波动。保持耐心，做好自己的判断。" },
    { title: "HODL & Bloom", text: "Hold, wait, and let it bloom. Real Alpha belongs to the patient.", note: "Markets will wiggle; your conviction shouldn't. Stay patient and trust your own research." }),
  F(2, 0, "hodl",
    { title: "钻石之手", text: "别轻易交出你的筹码，钻石之手终将见证时间的价值。", note: "好资产最怕的不是下跌，而是你在黎明前把它交给了别人。" },
    { title: "Diamond Hands", text: "Don't hand over your chips easily — diamond hands outlast time.", note: "The real risk isn't the dip; it's giving up your bags before dawn." }),
  F(3, 1, "hodl",
    { title: "牛市在路上", text: "你所期待的牛市，也许正在某个区块悄悄酝酿。", note: "行情总在沉默中蓄势。你现在做的每一笔研究，都是在为那一刻做准备。" },
    { title: "Bull Loading", text: "The bull run you wait for may be brewing in some quiet block.", note: "Breakouts gestate in silence. Every bit of research you do now is prep for that moment." }),
  F(4, 1, "hodl",
    { title: "时间的朋友", text: "不必追逐每一根 K 线，做时间的朋友。", note: "看得越远的人，越不会被眼前的波动绑架。今天也允许自己少看几次盘。" },
    { title: "Friend of Time", text: "You don't have to chase every candle. Be a friend of time.", note: "The longer your horizon, the less today's noise can hold you hostage." }),
  F(5, 1, "hodl",
    { title: "坚定信念", text: "别人的恐慌不应该成为你的判断，保持独立思考。", note: "市场最嘈杂的时候，往往是好机会最安静的时候。" },
    { title: "Conviction", text: "Others' panic shouldn't make your decisions. Think independently.", note: "The loudest market moments are often when the best opportunities are quietest." }),
  F(6, 1, "hodl",
    { title: "长线赢家", text: "真正的赢家，不是每次都买在最低点，而是懂得等待。", note: "完美抄底是神话，拿住好仓位是能力。你已具备后者。" },
    { title: "The Long Game", text: "Winners don't always buy the bottom — they know how to wait.", note: "Perfect entries are myth; holding quality is skill. You already have the latter." }),
  F(7, 1, "hodl",
    { title: "筹码为王", text: "好的筹码值得耐心，但也别忘了做好风险管理。", note: "耐心是你的武器，止损是你的盾牌，两样都要带。" },
    { title: "Quality Bags", text: "Good bags deserve patience — and never skip risk management.", note: "Patience is your weapon; stop-loss your shield. Carry both." }),
  F(8, 3, "hodl",
    { title: "不做下车的人", text: "如果你已经做好研究，就别让短期噪音替你做决定。", note: "下签不是凶兆，只是提醒：噪音最大的时候，最需要捂住耳朵。" },
    { title: "Don't Jump Off", text: "If you did the research, don't let short-term noise decide for you.", note: "A caution stick, not a curse: when noise peaks, cover your ears." }),
  // ── B. 财富自由类 ──────────────────────────────
  F(9, 0, "wagmi",
    { title: "财富自由", text: "愿你早日实现财富自由，从此不再为 Gas Fee 犹豫。", note: "自由的起点不是余额数字，而是每一次不再犹豫的确认签名。" },
    { title: "Financial Freedom", text: "May you go gas-fee-blind soon: freedom means never hesitating at confirm.", note: "Freedom starts before the number — it's signing without flinching." }),
  F(10, 0, "wagmi",
    { title: "百倍人生", text: "愿你下一次发现的 Alpha，不只是一次交易，而是人生转折。", note: "最好的收益曲线，是认知和资产一起抬头。" },
    { title: "100x Life", text: "May your next Alpha be more than a trade — a turning point.", note: "The best PnL curve is conviction and portfolio rising together." }),
  F(11, 1, "wagmi",
    { title: "账户翻红", text: "愿你的 Portfolio 早日从红色变成绿色。", note: "颜色会变，仓位会涨，保持研究节奏就是保持好运。" },
    { title: "Back to Green", text: "May your portfolio turn from red to green soon.", note: "Colors flip, bags grow. Keep researching and you keep the luck." }),
  F(12, 1, "wagmi",
    { title: "早日上岸", text: "愿你不再需要盯盘到凌晨，账户余额足以让你安心睡觉。", note: "最好的交易系统，是让你睡得着觉的那个。" },
    { title: "Sleep Well Rich", text: "May you stop chart-watching at 3am — your balance lets you sleep.", note: "The best trading system is the one that lets you rest." }),
  F(13, 0, "wagmi",
    { title: "财运亨通", text: "今日财运在线，愿好运与你的 Wallet 同步到账。", note: "把今天的自信留给研究，把剩下的交给时间。" },
    { title: "Fortune Online", text: "Luck is online today — may it sync to your wallet.", note: "Spend today's confidence on research; leave the rest to time." }),
  F(14, 1, "wagmi",
    { title: "财富密码", text: "你寻找的财富密码，也许就藏在下一次认真研究里。", note: "真正的密码从不在群里，在链上数据和你自己的笔记里。" },
    { title: "The Code", text: "The wealth code you're hunting may hide in your next deep dive.", note: "Real codes live on-chain and in your own notes, never in group chats." }),
  F(15, 2, "wagmi",
    { title: "提前退休", text: "愿你早日实现躺赚自由，把 K 线交给市场，把生活还给自己。", note: "退休不是不做事，是只做想做的事。今天先给它存一个区块。" },
    { title: "Retire Early", text: "May passive income free you — hand the charts back to the market.", note: "Retirement isn't doing nothing; it's doing only what you want." }),
  F(16, 1, "wagmi",
    { title: "盆满钵满", text: "愿你的每一次努力，都能在未来兑换成一份惊喜。", note: "播种和收获从不在同一个季节，但你一直在播种。" },
    { title: "Full Bags", text: "May every effort of yours cash out as a surprise later.", note: "Sowing and reaping never share a season — and you never stop sowing." }),
  // ── C. Degen 精神类 ────────────────────────────
  F(17, 0, "degen",
    { title: "WAGMI", text: "只要还在牌桌上，就永远有机会。WAGMI！", note: "活下来这件事本身，就已经跑赢了大多数人。" },
    { title: "WAGMI", text: "As long as you're at the table, there's always a chance. WAGMI!", note: "Survival alone already beats most of the market." }),
  F(18, 1, "degen",
    { title: "LFG", text: "不要害怕错过机会，真正属于你的机会值得等待。LFG！", note: "最好的机会不制造焦虑，它等你准备好。" },
    { title: "LFG", text: "Don't fear missing out — your opportunities will wait for you. LFG!", note: "Real opportunities don't create anxiety; they wait until you're ready." }),
  F(19, 0, "degen",
    { title: "To The Moon", text: "愿你的梦想直达月球，钱包不再经历地心引力。", note: "愿你的下一次起飞，燃料充足，不被回撤拽回地面。" },
    { title: "To The Moon", text: "May your dreams reach the moon — gravity-free wallet included.", note: "May your next launch have full fuel and no pullbacks." }),
  F(20, 1, "degen",
    { title: "逆风翻盘", text: "市场专治各种不服，但也总给勇敢的人留下机会。", note: "勇敢不是重仓，是冷静地在别人恐慌时执行计划。" },
    { title: "Comeback", text: "The market humbles everyone — yet always saves room for the brave.", note: "Bravery isn't max leverage; it's calmly executing your plan amid panic." }),
  F(21, 1, "degen",
    { title: "Alpha 降临", text: "愿你刷到的下一条推文，就是改变 Portfolio 的那条 Alpha。", note: "信息差不会消失，只会流动——它正在流向准备好的人。" },
    { title: "Alpha Incoming", text: "May your next scroll surface the tweet that changes your portfolio.", note: "Information asymmetry never dies; it flows — toward the prepared." }),
  F(22, 1, "degen",
    { title: "好运狙击手", text: "愿你每一次 DYOR，都能比市场早一步发现机会。", note: "你的研究速度，就是你和财富之间的距离。" },
    { title: "Alpha Sniper", text: "May every DYOR put you one step ahead of the market.", note: "Your research speed is the distance between you and the money." }),
  F(23, 1, "degen",
    { title: "早期玩家", text: "愿你总能出现在好项目的早期，而不是故事的最后一页。", note: "早一步是研究，晚一步是接盘。继续保持你的节奏。" },
    { title: "Early Bird", text: "May you always show up early — never on the last page of the story.", note: "Early is research; late is exit liquidity. Keep your pace." }),
  F(24, 2, "degen",
    { title: "逃顶大师", text: "愿你买得明白，卖得果断，不做最后一个接盘的人。", note: "卖出和买入一样需要理由。今天就把你的止盈线写下来。" },
    { title: "Top Seller", text: "May you buy with clarity and sell with conviction — never the last bag.", note: "Selling needs a thesis as much as buying. Write your take-profit line down today." }),
  // ── D. 市场反转类 ──────────────────────────────
  F(25, 2, "reversal",
    { title: "红转绿", text: "红色只是暂时的颜色，愿绿色早日成为你的主旋律。", note: "屏幕的颜色会变，你的策略不该变。" },
    { title: "Red to Green", text: "Red is just a temporary color — may green become your theme.", note: "Screen colors flip; your strategy shouldn't." }),
  F(26, 2, "reversal",
    { title: "反弹在即", text: "黎明前总有黑暗，但别把每一次下跌都当成机会。", note: "抄底是技术活，等确认是艺术活。今天艺术优先。" },
    { title: "Bounce Soon", text: "Dawn has its darkness — but not every dip is an invitation.", note: "Buying bottoms is craft; waiting for confirmation is art. Choose art today." }),
  F(27, 2, "reversal",
    { title: "空头退散", text: "愿空头绕道而行，愿你的仓位迎来属于自己的春天。", note: "冬天再长，也长不过拿着好仓位的人的耐心。" },
    { title: "Bears Beware", text: "May bears take the detour — and your bags meet their spring.", note: "No winter outlasts the patience of someone holding quality." }),
  F(28, 2, "reversal",
    { title: "V 型反转", text: "人生可以有回撤，但希望你的故事最终走出一个漂亮的 V。", note: "回撤不是结局，是曲线的一部分。你的故事还长。" },
    { title: "V-Shape Recovery", text: "Life allows drawdowns — may your story end in a beautiful V.", note: "Drawdowns aren't endings; they're part of the curve. Your story is long." }),
  F(29, 2, "reversal",
    { title: "止跌回升", text: "愿市场早日止跌，愿你的信心不再被行情消耗。", note: "行情负责波动，你负责稳定。别把两件事搞反。" },
    { title: "Hold & Rise", text: "May the market find its floor — and your confidence stop bleeding.", note: "The market handles volatility; you handle steadiness. Don't swap the jobs." }),
  F(30, 2, "reversal",
    { title: "牛回速归", text: "牛儿可能在路上堵车了，但希望它记得回家的路。", note: "迟到不等于缺席。仓位和耐心，你总得备好一样。" },
    { title: "Bull En Route", text: "The bull may be stuck in traffic — hope it remembers the way home.", note: "Late isn't absent. Keep either your bags or your patience ready." }),
  F(31, 2, "reversal",
    { title: "踏准节奏", text: "不追高、不恐慌，愿你每次出手都恰逢其时。", note: "市场奖励的不是频繁，是恰好。" },
    { title: "Right Timing", text: "No chasing, no panic — may every move land exactly on time.", note: "The market rewards not frequency, but precision." }),
  F(32, 2, "reversal",
    { title: "绝地反击", text: "不必急于证明自己，留在场上比一时输赢更重要。", note: "反击的前提是你还在桌上。今天先保管好你的筹码。" },
    { title: "Comeback Pending", text: "No need to prove anything fast — staying in the game beats winning once.", note: "Comebacks require still being at the table. Guard your chips today." }),
  // ── E. Meme 与社区文化类 ───────────────────────
  F(33, 0, "meme",
    { title: "Meme 之神", text: "愿 Meme 之神眷顾你，让你总能遇见下一个百倍叙事。", note: "保持你的梗感，那是这个市场上比指标更稀缺的资产。" },
    { title: "Meme God", text: "May the Meme God bless you with the next 100x narrative.", note: "Keep your meme sense — it's rarer than any indicator." }),
  F(34, 1, "meme",
    { title: "社区之力", text: "一个强大的 Community，可能比一百条 Roadmap 更有力量。", note: "下次研究项目时，先看看它的社区在聊什么。" },
    { title: "Community Power", text: "A strong community can outmuscle a hundred roadmaps.", note: "Next research session, read what the community is saying first." }),
  F(35, 2, "meme",
    { title: "文化永存", text: "图表会褪色，但真正的互联网文化永远不会过时。", note: "你收藏的不只是币，是一段正在发生的历史。" },
    { title: "Culture Endures", text: "Charts fade; real internet culture never does.", note: "You're not just holding coins — you're holding living history." }),
  F(36, 2, "meme",
    { title: "叙事为王", text: "愿你看懂故事，也看懂故事背后的真正价值。", note: "会讲故事的很多，有故事的很少。学会分辨二者。" },
    { title: "Narrative King", text: "May you read the story — and the real value beneath it.", note: "Many can tell stories; few have one. Learn to tell them apart." }),
  F(37, 1, "meme",
    { title: "早期信仰", text: "愿你不是在别人讲完故事后才发现它的精彩。", note: "保持阅读，保持怀疑，保持好奇——三样都是 Alpha 探测器。" },
    { title: "Early Believer", text: "May you never discover a story only after it's been told.", note: "Stay reading, stay skeptical, stay curious — all three are alpha detectors." }),
  F(38, 2, "meme",
    { title: "社区共赢", text: "愿你遇见志同道合的 Degen，一起见证下一个传奇。", note: "一个人的运气是随机，一群人的运气叫社区。" },
    { title: "Win Together", text: "May you find your degen tribe and witness the next legend together.", note: "One person's luck is random; a community's luck is a movement." }),
  F(39, 2, "meme",
    { title: "梗王附体", text: "愿你的 Meme 永远有梗，你的 Wallet 永远有余额。", note: "幽默是这个行业最被低估的生存技能。" },
    { title: "Meme Lord", text: "May your memes stay spicy and your wallet stay heavy.", note: "Humor is this industry's most underrated survival skill." }),
  F(40, 2, "meme",
    { title: "链上奇迹", text: "每一个传奇都有开始，愿你恰好在场。", note: "你已经在场了——剩下的交给坚持。" },
    { title: "On-Chain Miracle", text: "Every legend has a beginning — may you be there for it.", note: "You're already here. The rest is persistence." }),
  // ── F. Degen 幽默类 ────────────────────────────
  F(41, 3, "humor",
    { title: "不再归零", text: "愿你的资产不再归零，愿你的生活不再归于平淡。", note: "下签提醒：先检查授权，再谈梦想。" },
    { title: "No More Zero", text: "May your bags never go to zero — and your life never to boring.", note: "Caution stick: revoke approvals first, dream second." }),
  F(42, 3, "humor",
    { title: "少看 K 线", text: "今天少看十次 K 线，多享受一点生活。", note: "下签提醒：行情不会跑，生活会在。出去走五分钟。" },
    { title: "Touch Grass", text: "Watch ten fewer candles today. Live a little.", note: "Caution stick: the charts will wait; life won't. Take a five-minute walk." }),
  F(43, 3, "humor",
    { title: "Gas Fee 保佑", text: "愿你每次交易都遇上低 Gas，愿每次 Swap 都顺利成交。", note: "下签提醒：高峰时段的链上，连好运都要排队。" },
    { title: "Low Gas Blessing", text: "May every trade meet low gas and every swap land clean.", note: "Caution stick: on-chain at peak hours, even luck queues." }),
  F(44, 3, "humor",
    { title: "不做韭菜", text: "愿你少交学费，多赚经验，早日从韭菜进化成猎手。", note: "下签提醒：今天别人喊得越凶，你越要查得越细。" },
    { title: "Exit the Chives", text: "May tuition shrink, experience compound — from chive to hunter.", note: "Caution stick: the louder the shill, the deeper your research." }),
  F(45, 3, "humor",
    { title: "再也不 FOMO", text: "愿你不再追逐已经起飞的火箭，而是发现下一艘。", note: "下签提醒：起飞的票很贵，等下一班只要耐心。" },
    { title: "FOMO-Free", text: "May you stop chasing launched rockets and find the next one early.", note: "Caution stick: boarding a launched rocket is pricey; the next one only costs patience." }),
  F(46, 3, "humor",
    { title: "不再踏空", text: "愿你买入时不再犹豫，卖出时不再后悔。", note: "下签提醒：犹豫和后悔是同一件事的两面，写下来就能治好一半。" },
    { title: "No More Regret", text: "May you buy without hesitation and sell without regret.", note: "Caution stick: hesitation and regret are twins — journaling cures half." }),
  F(47, 3, "humor",
    { title: "睡觉也赚钱", text: "愿你的资产在你睡觉时安静工作，而不是半夜提醒你爆仓。", note: "下签提醒：睡前的仓位检查，胜过睡后的忏悔。" },
    { title: "Earn While Asleep", text: "May your assets work quietly at night — not wake you with liquidation.", note: "Caution stick: a bedtime position check beats midnight regret." }),
  F(48, 2, "humor",
    { title: "账户自由", text: "愿你打开 Wallet 的每一天，都比昨天多一点惊喜。", note: "惊喜是攒出来的：一次研究，一次纪律，一次不 FOMO。" },
    { title: "Wallet Freedom", text: "May every wallet-open surprise you a little more than yesterday.", note: "Surprises are built: one research, one discipline, one avoided FOMO at a time." }),
];

/* ---------------- 抽签 ---------------- */

function secureRandom(): number {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  } catch {
    return Math.random();
  }
}

/** 按 15/35/35/15 的等级权重随机抽一支签 */
export function drawFortune(): AlphaFortune {
  const r = secureRandom();
  const tier: AlphaTier = r < 0.15 ? 0 : r < 0.5 ? 1 : r < 0.85 ? 2 : 3;
  const pool = FORTUNES.filter((f) => f.tier === tier);
  return pool[Math.floor(secureRandom() * pool.length)];
}

export function fortuneById(id: number): AlphaFortune | null {
  return FORTUNES.find((f) => f.id === id) ?? null;
}

/**
 * fortunes.ts —— 每日好运签
 * 按日期字符串哈希确定性抽取（同一天所有访客同一支签，方便分享），
 * 文案走「加密梗 + 祝福」路线，中英双语。
 */

export interface Fortune {
  level: "上上签" | "上吉签" | "中吉签" | "小吉签" | "稳健签";
  title: string;
  text: string;
  /** 宜 / 忌，各 1~2 条，加密梗向 */
  yi: string[];
  ji: string[];
}

export const FORTUNES_ZH: Fortune[] = [
  {
    level: "上上签",
    title: "庄家看你脸色行事",
    text: "未来七天你的直觉比 K 线准。仓位健康，睡眠充足，好运正在排队进场。",
    yi: ["小额试探", "早点睡觉"],
    ji: ["梭哈", "看群消息"],
  },
  {
    level: "上上签",
    title: "空投砸中你",
    text: "三年前随手交互过的某个协议，下个月要发币了。祝福你的地址在名单上。",
    yi: ["翻旧钱包", "检查邮箱"],
    ji: ["得意忘形"],
  },
  {
    level: "上上签",
    title: "Meme 之神保佑你",
    text: "愿你的每只土狗都被项目方温柔以待，开盘即上所，上所即退休。",
    yi: ["小额参与", "及时止盈"],
    ji: ["卖房梭哈"],
  },
  {
    level: "上吉签",
    title: "聪明钱在抄你作业",
    text: "你已经是别人链上监控列表里的常客（褒义）。你的观点正在悄悄变值钱。",
    yi: ["记录观点", "长期持有"],
    ji: ["追高", "频繁换仓"],
  },
  {
    level: "上吉签",
    title: "K 线为你让路",
    text: "主力洗盘前偷偷看了眼你的持仓。今天躺平就是对账户最大的贡献。",
    yi: ["躺平", "定投"],
    ji: ["止损在最低点"],
  },
  {
    level: "上吉签",
    title: "鲸鱼的朋友",
    text: "你关注的聪明钱今天心情不错，持仓动向值得多喝一杯茶慢慢看。",
    yi: ["盯链上数据", "跟着聪明钱"],
    ji: ["跟反指博主"],
  },
  {
    level: "上吉签",
    title: "Gas 费全免的一天",
    text: "链上的一切今天对你打折：滑点友好，确认飞快，交易如丝般顺滑。",
    yi: ["整理钱包", "撤销旧授权"],
    ji: ["乱点签名"],
  },
  {
    level: "中吉签",
    title: "横住就是胜利",
    text: "不跌也是一种涨。你的耐心正在被市场偷偷记账，复利正在路上。",
    yi: ["复盘", "喝水"],
    ji: ["焦虑看盘"],
  },
  {
    level: "中吉签",
    title: "Sleep Staking 体质",
    text: "睡着了也在赚钱（精神上）。祝你梦里有百倍，醒来本金一分不少。",
    yi: ["关掉行情软件", "睡够八小时"],
    ji: ["半夜看仓"],
  },
  {
    level: "中吉签",
    title: "链上锦鲤",
    text: "随手点的那个合约，可能是下一只金狗。缘分到了，DYOR 也要做全套。",
    yi: ["小额参与", "查证合约"],
    ji: ["All in"],
  },
  {
    level: "中吉签",
    title: "本金的守护者",
    text: "你的钱包比交易所安全，心态比仓位稳固。剩者为王，你已在赢家组。",
    yi: ["备份助记词", "长持"],
    ji: ["杠杆"],
  },
  {
    level: "小吉签",
    title: "亏钱的姿势都很帅",
    text: "今天亏掉的每一个子，都会以认知的形式回来找你的。这不叫亏，叫学费包月。",
    yi: ["写交易日志", "散步"],
    ji: ["骂庄家"],
  },
  {
    level: "小吉签",
    title: "反指也是指",
    text: "你说跌它必涨，你说涨它必跌。反向利用起来，你就是最准的指标。",
    yi: ["小声许愿", "私下记录"],
    ji: ["公开发言带方向"],
  },
  {
    level: "小吉签",
    title: "FOMO 免疫体质",
    text: "今天你的心跳平稳得像一台冷钱包。恭喜，这是这个圈子里最贵的超能力。",
    yi: ["按既定计划加仓", "读书"],
    ji: ["临盘改主意"],
  },
  {
    level: "稳健签",
    title: "活着就是 Alpha",
    text: "市场奖励的不是最聪明的人，是活得最久的人。你已经赢了一半。",
    yi: ["控制仓位", "锻炼身体"],
    ji: [" all 仓梭哈 ".trim()],
  },
  {
    level: "稳健签",
    title: "十年老韭菜的从容",
    text: "愿你熬过的每一个熊市，都变成下一个牛市里的故事和仓位。",
    yi: ["慢慢变富", "陪家人"],
    ji: ["和别人比较"],
  },
];

export const FORTUNES_EN: Fortune[] = [
  { level: "上上签", title: "Whales Watch Your Moves", text: "Your gut beats the charts this week. Position healthy, sleep deep — luck is queuing up.", yi: ["Small bets", "Sleep early"], ji: ["All in", "Reading group chats"] },
  { level: "上上签", title: "Airdrop Incoming", text: "Some protocol you touched three years ago is about to launch a token. May your address be on the list.", yi: ["Check old wallets", "Check email"], ji: ["Getting cocky"] },
  { level: "上上签", title: "Blessed by the Meme Gods", text: "May every coin you touch list instantly and send politely. May the devs stay kind.", yi: ["Small size", "Take profit"], ji: ["Selling the house"] },
  { level: "上吉签", title: "Smart Money Copies You", text: "You are on someone's Arkham watchlist (as a compliment). Your takes are quietly becoming valuable.", yi: ["Write them down", "Hold long"], ji: ["Chasing pumps", "Overtrading"] },
  { level: "上吉签", title: "Candles Make Way", text: "The market makers peeked at your bags before dumping. Doing nothing today is alpha.", yi: ["Lie flat", "DCA"], ji: ["Selling the bottom"] },
  { level: "上吉签", title: "Friend of Whales", text: "The smart money you follow is in a good mood today. Its moves deserve a slow cup of tea.", yi: ["Watch on-chain", "Copy smartly"], ji: ["Copying contra-influencers"] },
  { level: "上吉签", title: "Zero-Gas Day", text: "Everything on-chain is discounted for you today: tight spreads, fast confirmations.", yi: ["Clean up wallets", "Revoke old approvals"], ji: ["Blind signing"] },
  { level: "中吉签", title: "Flat Is a Win", text: "Not going down is a kind of going up. Your patience is being quietly tallied by the market.", yi: ["Review trades", "Hydrate"], ji: ["Anxious chart-watching"] },
  { level: "中吉签", title: "Sleep-Staking Physique", text: "You earn while asleep (spiritually). May your dreams be 100x and your principal intact at dawn.", yi: ["Close the charts", "8 hours of sleep"], ji: ["Checking bags at 3am"] },
  { level: "中吉签", title: "On-Chain Koi Fish", text: "That random contract you clicked might be the next golden dog. Fate knocks — still DYOR.", yi: ["Small size", "Verify the contract"], ji: ["Full port"] },
  { level: "中吉签", title: "Guardian of Principal", text: "Your wallet is safer than an exchange, your mind steadier than your bags. Survivors win by default.", yi: ["Back up seed phrase", "Hold"], ji: ["Leverage"] },
  { level: "小吉签", title: "Losing, But Stylishly", text: "Every dollar lost today returns as knowledge. Not a loss — a monthly tuition plan.", yi: ["Journal trades", "Take a walk"], ji: ["Rage at the market"] },
  { level: "小吉签", title: "Contra-Indicator Is Still an Indicator", text: "Say down and it pumps. Weaponize it: you are the most accurate signal in the room.", yi: ["Wish quietly", "Log it privately"], ji: ["Public directional calls"] },
  { level: "小吉签", title: "FOMO-Immune Physique", text: "Your heartbeat today is as calm as a cold wallet. In this casino, that's the priciest superpower.", yi: ["Stick to the plan", "Read a book"], ji: ["Last-minute changes"] },
  { level: "稳健签", title: "Surviving Is Alpha", text: "The market doesn't reward the smartest — it rewards the longest-lived. You're already halfway to winning.", yi: ["Size positions", "Exercise"], ji: ["Yolo"] },
  { level: "稳健签", title: "Ten-Year-Veteran Calm", text: "May every bear market you endured become a story — and a position — in the next bull run.", yi: ["Get rich slowly", "Family time"], ji: ["Comparing with others"] },
];

/** 简单字符串哈希 → 当日确定性下标 */
function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 本地日期 YYYY-MM-DD（sv locale 技巧，无时区偏移） */
export function todayKey(d: Date = new Date()): string {
  return d.toLocaleDateString("sv-SE");
}

export function pickFortune(dateKey: string, locale: "zh" | "en"): Fortune {
  const pool = locale === "en" ? FORTUNES_EN : FORTUNES_ZH;
  return pool[hashOf(dateKey) % pool.length];
}

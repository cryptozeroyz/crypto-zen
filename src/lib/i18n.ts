/**
 * i18n.ts —— 多语言支持：语言列表 + 中英文文案字典
 *
 * 所有面向用户的文案都在这里，组件通过 props 接收对应语言的字典（可序列化）。
 * 文章正文的多语言由 content/posts-en/*.md 提供（后台自动翻译生成）。
 */

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return value === "zh" || value === "en";
}

const zh = {
  meta: {
    description:
      "Crypto Zen 的个人主页与写作空间：分享 Memecoin 研究报告、链上数据分析方法与 DYOR 心得。",
    titleTemplate: "%s · Crypto Zen",
    defaultTitle: "Crypto Zen",
  },
  nav: {
    articles: "文章",
    watchlist: "关注",
    about: "关于",
    homeAria: "Crypto Zen 的首页",
    switchLang: "切换语言",
  },
  footer: {
    rights: "© {year} {name} · 保留所有权利",
    signature: "以慢为快，以静制动。",
  },
  home: {
    hero: {
      line1: "在 Meme 世界的喧嚣里，",
      line2: "做真正严肃的研究。",
      sub: [
        "穿越噪音，让值得研究的 Meme 被看见。",
        "独立研究，审慎判断，为每一次 FOMO 按下暂停键。",
      ],
    },
    primaryCta: "阅读文章",
    secondaryCta: "看看我在关注什么",
    stats: {
      all: "全部文章",
      watch: "关注代币",
      trench: "Trench Index",
    },
    sections: {
      articles: "文章",
      watchlist: "关注列表",
      about: "关于我",
      social: "找到我",
    },
  },
  articles: {
    searchPh: "搜索标题、摘要或标签",
    noResult: "没有符合条件的文章。",
    loadMore: "加载更多 · 还有 {n} 篇",
    noMore: "已经到底了。",
  },
  category: { research: "研究报告", essay: "随笔", ops: "产品运营" },
  post: {
    back: "← 返回首页",
    minRead: "约 {n} 分钟",
    updated: "更新于",
    prev: "← 上一篇（更早）",
    next: "下一篇（更新）→",
    toc: "目录",
    liveChart: "实时 K 线",
    notTranslatedTitle: "本文暂无英文版",
    notTranslatedBody: "这篇文章还没有英文翻译，先看看中文版吧。",
    readZhVersion: "阅读中文版 →",
  },
  disclosure: {
    title: "免责声明",
    content:
      "本文仅为个人研究记录，不构成任何投资建议；加密资产波动巨大，请始终 DYOR。",
  },
  about: {
    title: "关于我",
    paragraphs: [
      "你好，我是 Crypto Zen。过去几年我一直在加密行业里打转：参与创业、做运营、做交易、赚过钱、亏过钱。",
      "这个网站是我给自己的一块自留地。不发币、不带单、不接广告，只记录我作为一个普通参与者对 Meme 市场的观察。我既写严肃分析，也写不那么严肃的段子，因为我始终觉得：如果你不能笑着面对这个市场，你迟早会被它气死。",
      "我的所有内容都不构成投资建议。市场有风险，钱包归你，决策也归你。",
    ],
  },
  social: { x: "X（Twitter）", telegram: "Telegram", xHandle: "@0CryptoZero", tgHandle: "@YZWEB3" },
  watchlist: {
    title: "关注列表",
    intro:
      "我正在关注的 Memecoin：头像与行情按 CA 自动抓取（DexScreener，约 5 分钟更新）。徽章由后台维护，不构成投资建议。",
    chart: "K 线",
    trenchTitle: "Trench Index",
    trenchSource: "数据来源：tehcscreener.com",
    bandLabel: { ded: "死寂", cold: "冷清", active: "活跃", hot: "火热", euphoric: "狂热" },
    holding: "持仓",
    notHolding: "观望",
    mcap: "市值",
    watchedAt: "关注于",
    copyCa: "复制 CA",
    copied: "已复制",
    expand: "展开全文",
    close: "关闭",
    method: "发射盘与交易终端活跃度综合分 · 基于近 90 天分位",
    components: {
      pad_volume: "发射盘交易量",
      tokens_launched: "新发行代币",
      pad_revenue: "发射盘收入",
      bot_volume: "终端交易量",
      bot_fees: "终端手续费",
    },
  },
  theme: { toDark: "切换到暗色模式", toLight: "切换到亮色模式" },
};

const en: typeof zh = {
  meta: {
    description:
      "Crypto Zen's personal site and writing space: memecoin research reports, on-chain analysis, and DYOR notes.",
    titleTemplate: "%s · Crypto Zen",
    defaultTitle: "Crypto Zen",
  },
  nav: {
    articles: "Articles",
    watchlist: "Watchlist",
    about: "About",
    homeAria: "Crypto Zen home",
    switchLang: "Switch language",
  },
  footer: {
    rights: "© {year} {name}. All rights reserved.",
    signature: "Slow is fast. Stillness moves.",
  },
  home: {
    hero: {
      line1: "In the noise of the Meme world,",
      line2: "do the serious research.",
      sub: [
        "Cut through the noise and surface memes worth studying.",
        "Independent research, careful judgment, a pause button for every FOMO.",
      ],
    },
    primaryCta: "Read Articles",
    secondaryCta: "See what I'm watching",
    stats: {
      all: "Posts",
      watch: "Watching",
      trench: "Trench Index",
    },
    sections: {
      articles: "Articles",
      watchlist: "Watchlist",
      about: "About",
      social: "Find Me",
    },
  },
  articles: {
    searchPh: "Search title, excerpt or tags",
    noResult: "No posts match your filters.",
    loadMore: "Load more · {n} left",
    noMore: "That's all.",
  },
  category: { research: "Research", essay: "Essay", ops: "Product & Ops" },
  post: {
    back: "← Home",
    minRead: "{n} min read",
    updated: "Updated",
    prev: "← Older post",
    next: "Newer post →",
    toc: "Contents",
    liveChart: "Live Chart",
    notTranslatedTitle: "No English version yet",
    notTranslatedBody: "This post hasn't been translated into English yet. Check out the Chinese version.",
    readZhVersion: "Read the Chinese version →",
  },
  disclosure: {
    title: "Disclaimer",
    content:
      "This post is a personal research note only and does not constitute investment advice. Crypto assets are extremely volatile — always DYOR.",
  },
  about: {
    title: "About",
    paragraphs: [
      "Hi, I'm Crypto Zen. I've spent the past few years deep in the crypto industry: founding startups, running operations, trading — I've made money and lost money.",
      "This site is a quiet corner I keep for myself. No token launches, no trade calls, no ads — just observations from an ordinary participant in the memecoin market. I write serious analysis and less-serious shitposts, because I've always believed: if you can't laugh at this market, it will eventually drive you mad.",
      "Nothing here is investment advice. The market carries risk; your wallet, your decisions.",
    ],
  },
  social: { x: "X (Twitter)", telegram: "Telegram", xHandle: "@0CryptoZero", tgHandle: "@YZWEB3" },
  watchlist: {
    title: "Watchlist",
    intro:
      "Memecoins I'm watching. Avatars and market data are fetched by contract address (DexScreener, ~5 min refresh). Badges are managed from the admin panel. Not investment advice.",
    chart: "Chart",
    trenchTitle: "Trench Index",
    trenchSource: "Data: tehcscreener.com",
    bandLabel: { ded: "Dead", cold: "Cold", active: "Active", hot: "Hot", euphoric: "Euphoric" },
    holding: "Holding",
    notHolding: "Watching",
    mcap: "MCap",
    watchedAt: "Watched",
    copyCa: "Copy CA",
    copied: "Copied",
    expand: "Read more",
    close: "Close",
    method: "Composite launchpad & trading-terminal activity · 90-day percentile blend",
    components: {
      pad_volume: "Pad Volume",
      tokens_launched: "Tokens Launched",
      pad_revenue: "Pad Revenue",
      bot_volume: "Terminal Volume",
      bot_fees: "Terminal Fees",
    },
  },
  theme: { toDark: "Switch to dark mode", toLight: "Switch to light mode" },
};

export type Dictionary = typeof zh;

export function getDictionary(locale: Locale): Dictionary {
  return locale === "en" ? en : zh;
}

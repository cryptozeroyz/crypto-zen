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
    links: "推荐",
    bookmarks: "收藏",
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
    sections: {
      articles: "文章",
      watchlist: "关注列表",
      links: "推荐",
      about: "关于我",
      social: "找到我",
    },
    viewAll: "查看全部 →",
  },
  articles: {
    searchPh: "搜索标题、摘要或标签",
    noResult: "没有符合条件的文章。",
    loadMore: "加载更多 · 还有 {n} 篇",
    noMore: "已经到底了。",
    random: "随便看看",
    randomDrawing: "正在抽取…",
    randomAria: "随机打开一篇文章",
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
    intro: "我正关注/持仓的memecoin，非投资建议。",
    chart: "K 线",
    holding: "持仓",
    notHolding: "观望",
    mcap: "市值",
    watchedAt: "关注于",
    copyCa: "复制 CA",
    copied: "已复制",
    expand: "展开全文",
    close: "关闭",
  },
  ticker: {
    aria: "BTC / ETH / SOL 实时价格",
  },
  nowPlaying: {
    listening: "正在听",
    recent: "最近在听",
    now: "现在在",
  },
  reading: {
    continue: "继续阅读",
    bookmark: "收藏",
    bookmarked: "已收藏",
    unbookmark: "取消收藏",
    clearHistory: "清除记录",
    justNow: "刚刚",
    minutesAgo: "{n} 分钟前",
    hoursAgo: "{n} 小时前",
    daysAgo: "{n} 天前",
    bookmarkedList: "我的收藏",
    emptyBookmarks: "还没有收藏。在文章页点 ☆ 收藏按钮，你喜欢的文章会出现在这里（只保存在你的浏览器里）。",
  },
  resources: {
    title: "好物推荐",
    intro: "我读过的好书、用过的物件、顺手的工具，以及可以直接拿去用的资料。全部亲自验证，不接推广。",
    note: "商品链接不含返利 · 资料可自由下载/复制，注明出处即可",
    tabs: { all: "全部", book: "图书", goods: "物品", tool: "工具", file: "资料" },
    searchPh: "搜索名称、推荐语或标签",
    buy: "购买 ↗",
    view: "查看 ↗",
    open: "打开 ↗",
    copy: "复制 ⧉",
    copied: "已复制 ✓",
    download: "下载 ↓",
    empty: "没有符合条件的条目。",
  },
  fortune: {
    button: "每日好运签",
    draw: "正在为你抽签…",
    already: "今日签已抽",
    yi: "宜",
    ji: "忌",
    close: "关闭",
    brand: "CRYPTO ZEN · 每日好运签",
  },
  theme: { auto: "跟随系统", light: "浅色模式", dark: "暗色模式" },
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
    links: "Resources",
    bookmarks: "Saved",
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
    sections: {
      articles: "Articles",
      watchlist: "Watchlist",
      links: "Resources",
      about: "About",
      social: "Find Me",
    },
    viewAll: "View all →",
  },
  articles: {
    searchPh: "Search title, excerpt or tags",
    noResult: "No posts match your filters.",
    loadMore: "Load more · {n} left",
    noMore: "That's all.",
    random: "Random post",
    randomDrawing: "Picking…",
    randomAria: "Open a random post",
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
    intro: "Memecoins I watch / hold. Not investment advice.",
    chart: "Chart",
    holding: "Holding",
    notHolding: "Watching",
    mcap: "MCap",
    watchedAt: "Watched",
    copyCa: "Copy CA",
    copied: "Copied",
    expand: "Read more",
    close: "Close",
  },
  ticker: {
    aria: "Live BTC / ETH / SOL prices",
  },
  nowPlaying: {
    listening: "Now playing",
    recent: "Recently played",
    now: "Right now:",
  },
  reading: {
    continue: "Continue reading",
    bookmark: "Bookmark",
    bookmarked: "Bookmarked",
    unbookmark: "Remove bookmark",
    clearHistory: "Clear history",
    justNow: "Just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",
    bookmarkedList: "My bookmarks",
    emptyBookmarks: "Nothing saved yet. Hit the ☆ bookmark button on any post and it will show up here (stored only in your browser).",
  },
  resources: {
    title: "Resources",
    intro: "Books I've read, gear I use, tools I rely on, and materials you can take away. All personally vetted, no sponsors.",
    note: "No affiliate links · Materials are free to copy/download with attribution",
    tabs: { all: "All", book: "Books", goods: "Gear", tool: "Tools", file: "Files" },
    searchPh: "Search name, note or tags",
    buy: "Buy ↗",
    view: "View ↗",
    open: "Open ↗",
    copy: "Copy ⧉",
    copied: "Copied ✓",
    download: "Download ↓",
    empty: "Nothing matches your filters.",
  },
  fortune: {
    button: "Daily Fortune",
    draw: "Drawing your fortune…",
    already: "Today's draw",
    yi: "Do",
    ji: "Avoid",
    close: "Close",
    brand: "CRYPTO ZEN · DAILY FORTUNE",
  },
  theme: { auto: "Auto", light: "Light", dark: "Dark" },
};

export type Dictionary = typeof zh;

export function getDictionary(locale: Locale): Dictionary {
  return locale === "en" ? en : zh;
}

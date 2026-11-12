/**
 * siteConfig.ts —— 全站基础配置
 *
 * 文案（含中英文）统一在 src/lib/i18n.ts 的多语言字典里维护，
 * 这里只放不随语言变化的信息：站点名、域名、社交链接、页脚签名。
 */

export const siteConfig = {
  /** 站点标题（品牌名） */
  title: "Crypto Zen",

  /** 部署后的站点地址（用于 canonical / OG / sitemap） */
  url: "https://crypto-zen.vercel.app",

  /** 社交与联系方式（仅保留 X 和 Telegram） */
  social: {
    twitter: "https://x.com/0CryptoZero",
    twitterHandle: "@0CryptoZero",
    telegram: "https://t.me/YZWEB3",
  },

  /** 页脚 */
  footer: {
    copyrightName: "CryptoZen",
    signature: "以慢为快，以静制动。",
  },
} as const;

export type SiteConfig = typeof siteConfig;

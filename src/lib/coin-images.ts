/**
 * coin-images.ts —— Hero 漂浮币与行情条的静态 logo
 *
 * 图片已自托管在 public/images/coins/（构建进站点，随仓库分发），
 * 不再依赖 CoinGecko CDN——国内无代理访客也能正常显示。
 */

export interface HeroLogo {
  id: string;
  image: string;
  sym: string;
}

export const HERO_LOGOS: HeroLogo[] = [
  { id: "bitcoin", image: "/images/coins/btc.png", sym: "BTC" },
  { id: "ethereum", image: "/images/coins/eth.png", sym: "ETH" },
  { id: "solana", image: "/images/coins/sol.png", sym: "SOL" },
  { id: "pepe", image: "/images/coins/pepe.jpg", sym: "PEPE" },
  { id: "bonk", image: "/images/coins/bonk.jpg", sym: "BONK" },
  { id: "dogwifcoin", image: "/images/coins/wif.jpg", sym: "WIF" },
  { id: "dogecoin", image: "/images/coins/doge.png", sym: "DOGE" },
];

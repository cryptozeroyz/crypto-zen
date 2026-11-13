/**
 * coin-images.ts —— Hero 漂浮币的静态 logo 地址
 *
 * 直接引用 CoinGecko 静态 CDN（coin-images.coingecko.com 是纯文件服务，
 * 没有 API 速率限制，运行时零请求）。图片地址通过 search API 一次性查证，
 * 若某天 404 可重新查询替换。
 */

export interface HeroLogo {
  id: string;
  image: string;
  sym: string;
}

export const HERO_LOGOS: HeroLogo[] = [
  { id: "bitcoin", image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png", sym: "BTC" },
  { id: "ethereum", image: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png", sym: "ETH" },
  { id: "solana", image: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png", sym: "SOL" },
  { id: "pepe", image: "https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg", sym: "PEPE" },
  { id: "bonk", image: "https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg", sym: "BONK" },
  { id: "dogwifcoin", image: "https://coin-images.coingecko.com/coins/images/33566/large/dogwifhat.jpg", sym: "WIF" },
  { id: "dogecoin", image: "https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png", sym: "DOGE" },
];

/**
 * coin-images.ts —— Hero 漂浮币 logo（构建期从 CoinGecko 抓取，SSR 友好）
 * 失败返回空数组，组件会回退到字母圆片。
 */

export interface HeroLogo {
  id: string;
  image: string;
  sym: string;
}

const HERO_IDS =
  "bitcoin,ethereum,solana,pepe,bonk,dogwifhat,dogecoin";

export async function fetchHeroLogos(): Promise<HeroLogo[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${HERO_IDS}`,
      { signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as Array<{
      id?: string;
      image?: string;
      symbol?: string;
    }>;
    if (!Array.isArray(json)) return [];
    return json
      .filter((c) => c.id && c.image)
      .map((c) => ({ id: c.id as string, image: c.image as string, sym: (c.symbol ?? "?").toUpperCase() }));
  } catch {
    return [];
  }
}

/** gecko.ts —— GeckTerminal OHLCV（K线/走势）共享客户端 */

const GECKO_NET: Record<string, string> = {
  solana: "solana",
  ethereum: "eth",
  bsc: "bsc",
  base: "base",
  arbitrum: "arbitrum",
  polygon: "polygon_pos",
  avalanche: "avax",
  blast: "blast",
};

export async function fetchGeckoOhlcv(
  chainId: string,
  pair: string,
  range: string
): Promise<number[]> {
  const net = GECKO_NET[chainId];
  if (!net) return [];
  const conf: Record<string, [string, number, number]> = {
    "24H": ["hour", 1, 24],
    "7D": ["hour", 4, 42],
    "30D": ["day", 1, 30],
    "ALL": ["day", 1, 90],
  };
  const [tf, agg, limit] = conf[range] ?? conf["7D"];
  const res = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/${net}/pools/${pair}/ohlcv/${tf}?aggregate=${agg}&limit=${limit}`,
    { next: { revalidate: 1800 }, headers: { Accept: "application/json" } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const list = json?.data?.attributes?.ohlcv_list;
  if (!Array.isArray(list)) return [];
  return list.map((c: number[]) => Number(c[4])).reverse(); // c = 收盘价，转为时间正序
}

/** 完整蜡烛序列：{t, o, h, l, c}，时间正序（K 线 + 标点用） */
export interface Candle {
  t: number; // unix 秒
  o: number;
  h: number;
  l: number;
  c: number;
}

export async function fetchGeckoOhlcvCandles(
  chainId: string,
  pair: string,
  range: string
): Promise<Candle[]> {
  const net = GECKO_NET[chainId];
  if (!net) return [];
  const conf: Record<string, [string, number, number]> = {
    "24H": ["hour", 1, 24],
    "7D": ["hour", 4, 42],
    "30D": ["day", 1, 30],
    "ALL": ["day", 1, 90],
  };
  const [tf, agg, limit] = conf[range] ?? conf["7D"];
  const res = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/${net}/pools/${pair}/ohlcv/${tf}?aggregate=${agg}&limit=${limit}`,
    { next: { revalidate: 1800 }, headers: { Accept: "application/json" } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const list = json?.data?.attributes?.ohlcv_list;
  if (!Array.isArray(list)) return [];
  return list
    .map(
      (c: number[]) =>
        ({ t: Number(c[0]), o: Number(c[1]), h: Number(c[2]), l: Number(c[3]), c: Number(c[4]) }) as Candle
    )
    .reverse();
}

/** 带时间戳的收盘序列：[[unix秒, 收盘价], ...]，时间正序 */
export async function fetchGeckoOhlcvSeries(
  chainId: string,
  pair: string,
  range: string
): Promise<Array<[number, number]>> {
  const candles = await fetchGeckoOhlcvCandles(chainId, pair, range);
  return candles.map((c) => [c.t, c.c] as [number, number]);
}

export const fetchGeckoSpark = (chainId: string, pair: string) =>
  fetchGeckoOhlcv(chainId, pair, "7D");


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

/** 带时间戳的收盘序列：[[unix秒, 收盘价], ...]，时间正序（图表标点用） */
export async function fetchGeckoOhlcvSeries(
  chainId: string,
  pair: string,
  range: string
): Promise<Array<[number, number]>> {
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
    .map((c: number[]) => [Number(c[0]), Number(c[4])] as [number, number])
    .reverse();
}

export const fetchGeckoSpark = (chainId: string, pair: string) =>
  fetchGeckoOhlcv(chainId, pair, "7D");


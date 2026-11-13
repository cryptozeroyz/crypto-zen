"use client";

/**
 * PriceTicker.tsx —— 头部行情条（BTC / ETH / SOL）
 * 纯前端：CoinGecko markets 免费接口（含官方币 logo，CORS 开放），
 * 挂载时拉取 + 每 60 秒刷新。失败保持旧数据，从未成功过则整体隐藏。
 */

import { useEffect, useState } from "react";

interface CoinDef {
  id: string;
  sym: string;
}

const COINS: CoinDef[] = [
  { id: "bitcoin", sym: "BTC" },
  { id: "ethereum", sym: "ETH" },
  { id: "solana", sym: "SOL" },
];

interface CoinMarket {
  id: string;
  current_price: number;
  price_change_percentage_24h?: number;
  image?: string;
}

function formatPrice(p: number): string {
  if (p >= 1000)
    return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 10) return p.toFixed(1);
  return p.toFixed(2);
}

export default function PriceTicker({ ariaLabel }: { ariaLabel: string }) {
  const [markets, setMarkets] = useState<CoinMarket[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const ids = COINS.map((c) => c.id).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const json = (await res.json()) as CoinMarket[];
        if (!cancelled && Array.isArray(json) && json.length > 0) setMarkets(json);
      } catch {
        /* 网络失败保持旧数据 */
      }
    };

    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // 从未加载成功不渲染（避免闪烁）
  if (!markets) return null;

  return (
    <div
      aria-label={ariaLabel}
      className="hidden items-center gap-4 font-mono text-xs lg:flex"
    >
      {COINS.map(({ id, sym }) => {
        const item = markets.find((m) => m.id === id);
        if (!item) return null;
        const up = (item.price_change_percentage_24h ?? 0) >= 0;
        return (
          <span key={id} className="flex items-center gap-1.5 whitespace-nowrap">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt=""
                width={16}
                height={16}
                loading="lazy"
                className="h-4 w-4 rounded-full"
              />
            ) : null}
            <span className="font-semibold tabular-nums text-heading">
              ${formatPrice(item.current_price)}
            </span>
            <span
              className={`tabular-nums ${
                up
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {up ? "+" : ""}
              {(item.price_change_percentage_24h ?? 0).toFixed(1)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}

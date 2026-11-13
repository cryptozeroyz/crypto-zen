"use client";

/**
 * PriceTicker.tsx —— 头部行情条（BTC / ETH / SOL）
 * 纯前端：CoinGecko 免费公开 API（CORS 开放），挂载时拉取 + 每 60 秒刷新。
 * 拉取失败时保持旧数据，从未成功过则整体隐藏。
 */

import { useEffect, useState } from "react";

interface CoinDef {
  id: string;
  sym: string;
  icon: string;
}

const COINS: CoinDef[] = [
  { id: "bitcoin", sym: "BTC", icon: "₿" },
  { id: "ethereum", sym: "ETH", icon: "Ξ" },
  { id: "solana", sym: "SOL", icon: "◎" },
];

type Prices = Record<string, { usd: number; usd_24h_change?: number }>;

function formatPrice(p: number): string {
  if (p >= 1000)
    return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 10) return p.toFixed(1);
  return p.toFixed(2);
}

export default function PriceTicker({ ariaLabel }: { ariaLabel: string }) {
  const [prices, setPrices] = useState<Prices | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const ids = COINS.map((c) => c.id).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const json = (await res.json()) as Prices;
        if (!cancelled && json && json.bitcoin) setPrices(json);
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
  if (!prices) return null;

  return (
    <div
      aria-label={ariaLabel}
      className="hidden items-center gap-4 font-mono text-xs lg:flex"
    >
      {COINS.map(({ id, sym, icon }) => {
        const item = prices[id];
        if (!item) return null;
        const up = (item.usd_24h_change ?? 0) >= 0;
        return (
          <span key={id} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-muted" aria-hidden="true">
              {icon}
            </span>
            <span className="font-semibold tabular-nums text-heading">
              ${formatPrice(item.usd)}
            </span>
            <span
              className={`tabular-nums ${
                up
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {up ? "+" : ""}
              {(item.usd_24h_change ?? 0).toFixed(1)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}

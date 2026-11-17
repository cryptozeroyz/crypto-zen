"use client";

/**
 * PriceTicker.tsx —— BTC / ETH / SOL 行情展示
 *
 * 两种形态：
 * - inline（默认）：紧凑单行，供后台/菜单嵌入；仅桌面显示（hidden lg:flex），
 *   菜单内传 always 强制渲染。
 * - chips：胶囊芯片组（每币一枚：logo + 价格 + 24H 涨跌幅），
 *   用于首页 Hero 区（2026-11 导航改版后行情从顶栏迁至此处），全宽度可见。
 *
 * 数据走本站 /api/market 代理（首尔服务器中转 CoinGecko），
 * logo 用自托管静态文件——国内无代理访客也能正常显示。
 * 挂载时拉取 + 每 60 秒刷新。失败保持旧数据，从未成功过则整体隐藏。
 */

import { useEffect, useState } from "react";

interface CoinDef {
  id: string;
  sym: string;
  logo: string;
}

const COINS: CoinDef[] = [
  { id: "bitcoin", sym: "BTC", logo: "/images/coins/btc.png" },
  { id: "ethereum", sym: "ETH", logo: "/images/coins/eth.png" },
  { id: "solana", sym: "SOL", logo: "/images/coins/sol.png" },
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

export default function PriceTicker({
  ariaLabel,
  always = false,
  variant = "inline",
}: {
  ariaLabel: string;
  /** 默认仅桌面显示（hidden lg:flex）；菜单内传 true 强制渲染 */
  always?: boolean;
  /** inline 紧凑单行 / chips 胶囊芯片组（Hero 区用） */
  variant?: "inline" | "chips";
}) {
  const [markets, setMarkets] = useState<CoinMarket[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/market?type=ticker`, { cache: "no-store" });
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

  /* chips 形态：胶囊芯片组，任意宽度可见 */
  if (variant === "chips") {
    if (!markets) return null;
    return (
      <div aria-label={ariaLabel} className="flex flex-wrap items-center gap-2.5">
        {COINS.map(({ id, sym, logo }) => {
          const item = markets.find((m) => m.id === id);
          if (!item) return null;
          const up = (item.price_change_percentage_24h ?? 0) >= 0;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 font-mono text-xs transition-all duration-200 hover:border-accent/50 hover:shadow-[0_0_0_3px_rgba(37,99,235,0.07)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" width={15} height={15} loading="lazy" className="h-[15px] w-[15px] rounded-full" />
              <span className="font-semibold text-heading">{sym}</span>
              <span className="tabular-nums text-heading">${formatPrice(item.current_price)}</span>
              <span className={`tabular-nums ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {up ? "+" : ""}
                {(item.price_change_percentage_24h ?? 0).toFixed(1)}%
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  /* inline 形态（默认） */
  return (
    <div
      aria-label={ariaLabel}
      className={`items-center gap-4 font-mono text-xs ${
        always ? "flex" : "hidden lg:flex"
      }`}
    >
      {COINS.map(({ id, sym, logo }) => {
        const item = markets?.find((m) => m.id === id);
        if (!item) return null;
        const up = (item.price_change_percentage_24h ?? 0) >= 0;
        return (
          <span key={id} className="flex items-center gap-1.5 whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              width={16}
              height={16}
              loading="lazy"
              className="h-4 w-4 rounded-full"
            />
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

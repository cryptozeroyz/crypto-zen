"use client";

/**
 * RedesignStrip.tsx —— 改版第三批：打字机下方的 sketch 风数据条
 * BTC/ETH/SOL 行情胶囊（真实数据，60s 刷新）+ 现在在状态。
 */

import { useEffect, useState } from "react";
import PriceTicker from "@/components/PriceTicker";
import NowPlaying from "@/components/NowPlaying";
import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n";

export default function RedesignStrip({ locale, t }: { locale: Locale; t: any }) {
  return (
    <section className="rs-strip" aria-label="Live">
      <style>{`
        .rs-strip{background:#f6f3ee;border-bottom:2px solid #2a2230;padding:22px 0;margin-right:72px}
        @media(max-width:640px){.rs-strip{margin-right:56px}}
        .rs-in{max-width:760px;margin:0 auto;padding:0 40px;display:flex;flex-wrap:wrap;align-items:center;gap:14px}
        .rs-lab{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.18em;color:#ff5b3a;font-weight:700}
        .rs-chip{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px dashed #2a2230;border-radius:999px;padding:5px 13px;font-family:ui-monospace,monospace;font-size:12px;color:#2a2230}
        .rs-now{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#5c2a52}
      `}</style>
      <div className="rs-in">
        <span className="rs-lab">LIVE</span>
        <span className="rs-chip"><PriceTicker ariaLabel="ticker" always /></span>
        <span className="rs-now">
          <NowPlaying
            lastfm={siteConfig.lastfm}
            labels={{ listening: t.nowPlaying.listening, recent: t.nowPlaying.recent, now: t.nowPlaying.now }}
          />
        </span>
      </div>
    </section>
  );
}

"use client";

/**
 * DailyAlphaClient.tsx —— Daily Alpha · 每日好运签（三阶段交互）
 *
 * A 未抽签：黑金仪式感入口（✦ / 标题 / 今日日期 / 抽签按钮）
 * B 抽签中：签文快速滚动 1 秒后落定
 * C 已抽签：签卡（等级印章 + 签文 + 签解）+ 分享/下载/复制 + 历史
 *
 * 每日一次：以服务端传入的 UTC+8 日期为准，结果写 localStorage。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  drawFortune,
  fortuneById,
  TIERS,
  type AlphaFortune,
} from "@/lib/alpha";
import { downloadShareCard } from "@/components/alpha/share-card";
import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n";

const TODAY_KEY = "cz_alpha_today";
const HISTORY_KEY = "cz_alpha_history";

export interface AlphaLabels {
  eyebrow: string;
  title: string;
  sub: string;
  draw: string;
  drawing: string;
  rule: string;
  todayLuck: string;
  reading: string;
  share: string;
  download: string;
  copy: string;
  copied: string;
  history: string;
  historyEmpty: string;
  tomorrow: string;
  no: string;
}

interface Stored {
  d: string;
  id: number;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function DailyAlphaClient({
  locale,
  todayKey,
  labels,
}: {
  locale: Locale;
  /** 服务端算好的 UTC+8 日期（防伪：改本地时间无效） */
  todayKey: string;
  labels: AlphaLabels;
}) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"idle" | "drawing" | "done">("idle");
  const [fortune, setFortune] = useState<AlphaFortune | null>(null);
  const [spinTitle, setSpinTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const timers = useRef<number[]>([]);

  // 挂载：恢复今日已抽的签
  useEffect(() => {
    const stored = readJson<Stored | null>(TODAY_KEY, null);
    if (stored && stored.d === todayKey) {
      const f = fortuneById(stored.id);
      if (f) {
        setFortune(f);
        setStage("done");
      }
    }
    setMounted(true);
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, [todayKey]);

  const pick = () => {
    const f = drawFortune();
    (window as unknown as { umami?: { track: (e: string) => void } }).umami?.track("抽签");
    try {
      window.localStorage.setItem(TODAY_KEY, JSON.stringify({ d: todayKey, id: f.id }));
      const history = readJson<Stored[]>(HISTORY_KEY, []);
      window.localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
          [{ d: todayKey, id: f.id }, ...history.filter((h) => h.d !== todayKey)].slice(0, 30)
        )
      );
    } catch {
      /* 隐私模式忽略 */
    }
    return f;
  };

  const draw = () => {
    if (stage !== "idle") return;
    setStage("drawing");
    // 签文滚动效果：快速切换标题，1 秒后落定
    const pool = [17, 21, 33, 10, 2, 19, 13, 27];
    let i = 0;
    const spin = window.setInterval(() => {
      const f = fortuneById(pool[i % pool.length]);
      if (f) setSpinTitle(locale === "zh" ? f.zh.title : f.en.title);
      i++;
    }, 90);
    timers.current.push(
      window.setTimeout(() => {
        window.clearInterval(spin);
        setFortune(pick());
        setStage("done");
      }, 1000)
    );
  };

  const shareText = useMemo(() => {
    if (!fortune) return "";
    const L = locale === "zh" ? fortune.zh : fortune.en;
    const tier = TIERS[fortune.tier];
    const lines =
      locale === "zh"
        ? [
            "今日 Daily Alpha 已到账 ✨",
            "",
            `🔮 ${tier.zh} · ${L.title}`,
            `💎 ${L.text}`,
            "",
            `你的今日签运如何？→ ${siteConfig.url}/alpha`,
            "#DailyAlpha #WAGMI",
          ]
        : [
            "Today's Daily Alpha is here ✨",
            "",
            `🔮 Fortune: ${tier.en} · ${L.title}`,
            `💎 ${L.text}`,
            "",
            `Get your daily Crypto fortune: ${siteConfig.url}/alpha`,
            "#DailyAlpha #WAGMI",
          ];
    return lines.join("\n");
  }, [fortune, locale]);

  const share = () => {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    if (!fortune) return;
    const L = locale === "zh" ? fortune.zh : fortune.en;
    const tier = TIERS[fortune.tier];
    const text = `${tier.zh} · ${L.title}\n${L.text}\n— Daily Alpha · ${siteConfig.url}/alpha`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const history = useMemo(() => {
    if (!mounted) return [] as Array<{ d: string; f: AlphaFortune }>;
    return readJson<Stored[]>(HISTORY_KEY, [])
      .map((h) => ({ d: h.d, f: fortuneById(h.id) }))
      .filter((h): h is { d: string; f: AlphaFortune } => h.f !== null)
      .slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, stage]);

  const tier = fortune ? TIERS[fortune.tier] : null;
  const L = fortune ? (locale === "zh" ? fortune.zh : fortune.en) : null;

  const btnGold =
    "inline-flex items-center gap-2 rounded-full bg-[#D8B56D] px-8 py-3.5 text-sm font-semibold text-[#0B0D12] transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_30px_rgba(216,181,109,0.35)]";
  const btnGhost =
    "inline-flex items-center gap-1.5 rounded-full border border-[#D8B56D]/40 px-4 py-2 text-[13px] text-[#D8B56D] transition-all duration-200 hover:border-[#D8B56D] hover:bg-[#D8B56D]/10";

  return (
    <div className="mx-auto w-full max-w-content px-6 py-16 sm:py-20">
      {/* ── A. 未抽签 ── */}
      {stage === "idle" && (
        <div className="flex flex-col items-center text-center">
          <svg viewBox="0 0 200 200" aria-hidden="true" className="h-14 w-14 text-[#D8B56D]">
            <g stroke="currentColor" strokeWidth="10" strokeLinecap="round" transform="translate(100,100)">
              <line y1="-70" y2="70" />
              <line y1="-70" y2="70" transform="rotate(60)" opacity="0.55" />
              <line y1="-70" y2="70" transform="rotate(120)" opacity="0.55" />
            </g>
          </svg>
          <p className="mt-6 text-[11px] tracking-[0.35em] text-[#9298A5]">
            {labels.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F5F5F5] sm:text-5xl">
            {labels.title}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#9298A5]">
            {labels.sub}
          </p>
          <p className="mt-2 font-mono text-xs tabular-nums text-[#9298A5]/70">
            {todayKey}
          </p>

          <button type="button" onClick={draw} className={`${btnGold} mt-10`}>
            {labels.draw}
          </button>
          <p className="mt-4 text-[11px] tracking-[0.25em] text-[#9298A5]/60">
            {labels.rule}
          </p>
        </div>
      )}

      {/* ── B. 抽签中 ── */}
      {stage === "drawing" && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="animate-pulse font-serif text-4xl font-bold text-[#D8B56D]">
            {spinTitle || "···"}
          </div>
          <p className="mt-8 text-[11px] tracking-[0.3em] text-[#9298A5]">
            {labels.drawing}
          </p>
        </div>
      )}

      {/* ── C. 签卡 ── */}
      {stage === "done" && fortune && tier && L && (
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#D8B56D]/30 bg-[#151922] p-8 shadow-[0_20px_60px_-20px_rgba(216,181,109,0.25)]">
            {/* 印章 */}
            <div className="absolute right-6 top-6">
              <span
                className="flex h-12 items-center justify-center rounded-md px-3 font-bold text-[#F5F5F5]"
                style={{ background: fortune.tier === 3 ? "#B83A35" : tier.color }}
              >
                {locale === "zh" ? tier.label : tier.en}
              </span>
            </div>

            <p className="text-[10px] tracking-[0.35em] text-[#9298A5]">
              DAILY ALPHA · 好运签
            </p>
            <p className="mt-1.5 font-mono text-xs tabular-nums text-[#9298A5]/70">
              NO. {String(fortune.id).padStart(3, "0")} · {todayKey}
            </p>

            <p className="mt-6 text-sm text-[#9298A5]">{labels.todayLuck}</p>
            <h2 className="mt-1 font-serif text-4xl font-bold" style={{ color: tier.color }}>
              {locale === "zh" ? tier.zh : tier.en}
            </h2>
            <p className="mt-1 text-xs" style={{ color: tier.color }}>
              {locale === "zh" ? tier.descZh : tier.descEn}
            </p>

            <h3 className="mt-8 text-center font-serif text-3xl font-bold text-[#F5F5F5]">
              {L.title}
            </h3>
            <p className="mt-4 text-center text-[15px] leading-relaxed text-[#F5F5F5]">
              {L.text}
            </p>

            <div className="mt-8 border-t border-[#D8B56D]/15 pt-5">
              <p className="text-xs font-medium tracking-widest text-[#9298A5]">
                {labels.reading}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#9298A5]">
                {L.note}
              </p>
            </div>
          </div>

          {/* 操作 */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={share} className={btnGold}>
              {labels.share} ↗
            </button>
            <button
              type="button"
              onClick={() => downloadShareCard(fortune, todayKey, locale)}
              className={btnGhost}
            >
              {labels.download} ⬇
            </button>
            <button type="button" onClick={() => void copy()} className={btnGhost}>
              {copied ? labels.copied : labels.copy} ⧉
            </button>
          </div>
          <p className="mt-6 text-xs text-[#9298A5]/70">{labels.tomorrow}</p>

          {/* 历史 */}
          <div className="mt-12 w-full max-w-md">
            <p className="text-xs font-medium tracking-widest text-[#9298A5]">
              {labels.history}
            </p>
            {history.length === 0 ? (
              <p className="mt-3 text-[13px] text-[#9298A5]/70">
                {labels.historyEmpty}
              </p>
            ) : (
              <ul className="mt-3 space-y-1">
                {history.map((h) => (
                  <li
                    key={h.d}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px]"
                  >
                    <span
                      className="w-14 shrink-0 font-medium"
                      style={{ color: TIERS[h.f!.tier].color }}
                    >
                      {locale === "zh" ? TIERS[h.f!.tier].zh : TIERS[h.f!.tier].en}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[#F5F5F5]/85">
                      {locale === "zh" ? h.f!.zh.title : h.f!.en.title}
                    </span>
                    <time className="shrink-0 font-mono text-xs tabular-nums text-[#9298A5]/60">
                      {h.d.slice(5)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

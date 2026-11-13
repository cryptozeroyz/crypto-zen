"use client";

/**
 * FortuneDraw.tsx —— 每日好运签（纯客户端）
 *
 * - 右下角浮动入口，点击弹窗翻牌抽签
 * - 按本地日期确定性抽签：同一天所有人同一支签，方便分享
 * - localStorage 记录当日已抽；再点直接回看今日签，明天自动重置
 * - Esc / 点遮罩关闭；尊重 prefers-reduced-motion
 */

import { useCallback, useEffect, useState } from "react";
import { pickFortune, todayKey, type Fortune } from "@/lib/fortunes";
import type { Locale } from "@/lib/i18n";

const STORAGE_KEY = "cz_fortune_day";

export interface FortuneLabels {
  button: string;
  draw: string;
  already: string;
  yi: string;
  ji: string;
  close: string;
  brand: string;
}

function FortuneFace({
  fortune,
  dateKey,
  labels,
}: {
  fortune: Fortune;
  dateKey: string;
  labels: FortuneLabels;
}) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent dark:text-accent-mint">
          {fortune.level}
        </span>
        <time className="tabular-nums">{dateKey}</time>
      </div>

      <h3 className="mt-5 text-center font-serif text-2xl font-bold tracking-tight text-heading">
        {fortune.title}
      </h3>
      <p className="mt-3 flex-1 text-center text-[13px] leading-relaxed text-muted">
        {fortune.text}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-accent/5 p-3">
          <p className="font-semibold text-accent dark:text-accent-mint">
            {labels.yi}
          </p>
          <ul className="mt-1 space-y-0.5 text-muted">
            {fortune.yi.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-red-500/5 p-3">
          <p className="font-semibold text-red-500">{labels.ji}</p>
          <ul className="mt-1 space-y-0.5 text-muted">
            {fortune.ji.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] tracking-[0.3em] text-muted">
        {labels.brand}
      </p>
    </div>
  );
}

export default function FortuneDraw({
  locale,
  labels,
}: {
  locale: Locale;
  labels: FortuneLabels;
}) {
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [drawnToday, setDrawnToday] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dateKey = todayKey();
  const fortune = pickFortune(dateKey, locale);

  // 挂载后同步「今日是否已抽」
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === dateKey) {
        setDrawnToday(true);
      }
    } catch {
      /* 隐私模式忽略 */
    }
    setMounted(true);
  }, [dateKey]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const draw = useCallback(() => {
    if (flipped) return;
    setFlipped(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, dateKey);
    } catch {
      /* 忽略 */
    }
    setDrawnToday(true);
  }, [flipped, dateKey]);

  const openModal = () => {
    setOpen(true);
    // 今日已抽过 → 直接展示正面；否则翻牌前给个短延迟便于看到抽卡动作
    if (drawnToday) {
      setFlipped(true);
    } else {
      setFlipped(false);
      window.setTimeout(draw, 450);
    }
  };

  return (
    <>
      {/* 浮动入口 */}
      <button
        type="button"
        onClick={openModal}
        aria-label={labels.button}
        title={labels.button}
        className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full border border-accent/30 bg-card px-4 text-sm font-medium text-heading shadow-lg shadow-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] dark:shadow-black/40"
      >
        <span aria-hidden="true" className="text-base">
          🎐
        </span>
        <span className="hidden sm:inline">
          {mounted && drawnToday ? labels.already : labels.button}
        </span>
        <span className="sm:hidden">
          {mounted && drawnToday ? "✓" : "签"}
        </span>
      </button>

      {/* 弹窗 */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.button}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭 */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-muted transition-colors hover:text-heading"
            >
              ✕
            </button>

            {/* 3D 翻牌容器 */}
            <div className="[perspective:1200px]">
              <div
                className={`relative h-[400px] w-full transition-transform duration-700 [transform-style:preserve-3d] ${
                  flipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* 背面（签面未翻） */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-line bg-card [backface-visibility:hidden]">
                  <svg
                    viewBox="0 0 200 200"
                    aria-hidden="true"
                    className="h-20 w-20 text-accent opacity-30 dark:text-accent-mint"
                  >
                    <g
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="round"
                      transform="translate(100,100)"
                    >
                      <line y1="-78" y2="78" />
                      <line y1="-78" y2="78" transform="rotate(36)" opacity="0.55" />
                      <line y1="-78" y2="78" transform="rotate(72)" />
                      <line y1="-78" y2="78" transform="rotate(108)" opacity="0.55" />
                      <line y1="-78" y2="78" transform="rotate(144)" />
                    </g>
                  </svg>
                  <p className="mt-5 text-sm font-medium text-muted">
                    {labels.draw}
                  </p>
                </div>

                {/* 正面（签文） */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-card shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent-mint to-accent"
                  />
                  <FortuneFace
                    fortune={fortune}
                    dateKey={dateKey}
                    labels={labels}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

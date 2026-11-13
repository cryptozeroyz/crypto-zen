"use client";

/**
 * ThemeToggle.tsx —— 三态主题切换：自动（跟随系统/时间）→ 浅色 → 深色 → 自动
 *
 * 初始判定在 layout.tsx 的内联脚本里完成（首次绘制前，自动模式实时跟随系统）；
 * 这里负责手动切换：写 localStorage（"light" / "dark"），选「自动」时移除该键。
 */

import { useEffect, useState } from "react";

export interface ThemeLabels {
  auto: string;
  light: string;
  dark: string;
}

type Mode = keyof ThemeLabels;

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16v4" strokeLinecap="round" />
      <circle cx="12" cy="10" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS: Record<Mode, () => React.ReactElement> = {
  auto: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

export default function ThemeToggle({ labels }: { labels: ThemeLabels }) {
  const [mode, setMode] = useState<Mode>("auto");

  // 挂载后同步当前模式（内联脚本已应用好主题）
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      setMode(stored === "light" || stored === "dark" ? stored : "auto");
    } catch {
      /* 忽略 */
    }
  }, []);

  const applyMode = (next: Mode) => {
    setMode(next);
    const dark =
      next === "dark" ||
      (next === "auto" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    try {
      if (next === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {
      /* 隐私模式下忽略 */
    }
  };

  const cycle = () => {
    const order: Mode[] = ["auto", "light", "dark"];
    applyMode(order[(order.indexOf(mode) + 1) % order.length]);
  };

  const Icon = ICONS[mode];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={labels[mode]}
      title={labels[mode]}
      className="p-1 text-muted transition-colors duration-200 hover:text-heading"
    >
      <Icon />
    </button>
  );
}

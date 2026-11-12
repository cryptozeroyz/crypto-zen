"use client";

/**
 * ThemeToggle.tsx —— 亮 / 暗主题切换按钮（太阳 / 月亮图标）
 * 主题的初始判定在 layout.tsx 的内联脚本里完成（首次绘制前），
 * 这里只负责切换：改 <html> 的 .dark class 并写入 localStorage。
 * 服务端始终渲染月亮图标（站点是亮色优先），挂载后再同步真实状态。
 */

import { useEffect, useState } from "react";

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

interface ThemeToggleProps {
  toDarkLabel: string;
  toLightLabel: string;
}

export default function ThemeToggle({ toDarkLabel, toLightLabel }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);

  // 挂载后同步当前真实主题（内联脚本可能已加上 .dark）
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* 隐私模式下忽略 */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? toLightLabel : toDarkLabel}
      className="p-1 text-muted transition-colors duration-200 hover:text-heading"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

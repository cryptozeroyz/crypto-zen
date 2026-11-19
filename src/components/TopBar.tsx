"use client";

/**
 * TopBar.tsx —— 全局顶栏（手绘风外壳，替代原右侧深紫轨道）
 * 左：头像 Logo + 站名；中：导航（悬停珊瑚橙下划线滑入，当前页常亮）；
 * 右：语言切换 / 主题切换 / X / Telegram；窄屏收进珊瑚橙汉堡下拉菜单。
 * 滚动时顶栏加投影（scrolled 类），菜单支持 Esc 与路由变化自动关闭。
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";
import ThemeToggle from "@/components/ThemeToggle";

const ITEMS = [
  { zh: "首页", en: "Home", href: "" },
  { zh: "投研日志", en: "Journal", href: "/dashboard" },
  { zh: "文章", en: "Writing", href: "/writing" },
  { zh: "方程式新闻", en: "News", href: "/news" },
  { zh: "推荐", en: "Resources", href: "/resources" },
  { zh: "好运签", en: "Alpha", href: "/alpha" },
  { zh: "关于", en: "About", href: "/about" },
] as const;

/** 判断导航项是否当前页：href 为空=首页；否则前缀匹配 */
function isActive(pathname: string, locale: Locale, href: string) {
  const base = `/${locale}${href}`;
  if (href === "") return pathname === `/${locale}`;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default function TopBar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* 路由变化关闭菜单 */
  useEffect(() => setOpen(false), [pathname]);

  /* Esc 关闭菜单 */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* 滚动超过 10px 加投影（rAF 节流） */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`topbar${scrolled ? " scrolled" : ""}`}>
        <div className="tb-in">
          {/* 左：Logo */}
          <Link href={`/${locale}`} className="tb-brand" aria-label="Crypto Zen home">
            <Image
              src="/avatar.png"
              alt="Crypto Zen"
              width={34}
              height={34}
              className="tb-ava"
              priority
            />
            <span className="tb-word">Crypto Zen</span>
          </Link>

          {/* 中：桌面导航 */}
          <nav className="tb-nav" aria-label="主导航">
            {ITEMS.map((it) => (
              <Link
                key={it.href || "home"}
                href={`/${locale}${it.href}`}
                className={isActive(pathname, locale, it.href) ? "on" : ""}
              >
                {locale === "zh" ? it.zh : it.en}
              </Link>
            ))}
          </nav>

          {/* 右：工具区 */}
          <div className="tb-tools">
            <LangToggle locale={locale} />
            <ThemeToggleMini locale={locale} />
            <a
              href={siteConfig.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="tb-ico"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2.1h3.7l-8.1 9.3 9.5 12.5h-7.5l-5.9-7.7-6.7 7.7H.2l8.7-9.9L0 2.1h7.7l5.3 7 5.9-7z" />
              </svg>
            </a>
            <a
              href={siteConfig.social.telegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="tb-ico"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.9 4.6L2.7 11.8c-.9.3-.9 1.6.1 1.9l4.8 1.5 1.9 5.7c.3.8 1.2 1 1.8.4l2.6-2.5 4.9 3.6c.7.4 1.6.1 1.8-.7l3.2-15.3c.2-.9-.6-1.6-1.5-1.3z" />
              </svg>
            </a>
            {/* 窄屏汉堡 */}
            <button
              className="tb-burger"
              aria-label="菜单"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <i />
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>

      {/* 遮罩 + 下拉菜单 */}
      <div
        className={`tb-mask ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <nav className={`tb-menu ${open ? "open" : ""}`} aria-hidden={!open} aria-label="移动端导航">
        {ITEMS.map((it, i) => (
          <Link
            key={it.href || "home"}
            href={`/${locale}${it.href}`}
            style={{ "--d": `${0.06 + i * 0.05}s` } as React.CSSProperties}
            tabIndex={open ? 0 : -1}
          >
            {locale === "zh" ? it.zh : it.en}
            <span className="en">{locale === "zh" ? it.en : it.zh}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

function LangToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const other = locale === "zh" ? "en" : "zh";
  const rest =
    (pathname.startsWith(`/${locale}`) ? pathname.slice(locale.length + 1) : pathname) || "/";
  const switchPath = `/${other}${rest}`;
  return (
    <a
      href={switchPath}
      onClick={() => {
        try {
          document.cookie = `cz_locale=${other};path=/;max-age=31536000`;
        } catch {}
      }}
      className="tb-lang"
      aria-label={locale === "zh" ? "Switch to English" : "切换为中文"}
    >
      {locale === "zh" ? "EN" : "中"}
    </a>
  );
}

function ThemeToggleMini({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).theme;
  return <ThemeToggle labels={t} />;
}

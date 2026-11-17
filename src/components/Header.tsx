"use client";

/**
 * Header.tsx —— 顶部导航
 *
 * 桌面端（lg+）：好运签入口 + 锚点导航 + 语言切换 + 主题切换，全部平铺。
 * 移动端（<lg）：汉堡按钮展开下拉菜单——导航链接大号可点，语言/主题/行情
 * 收进菜单底部；路由跳转自动收起，支持 Esc 与点击遮罩关闭。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import type { Dictionary, Locale } from "@/lib/i18n";
import Container from "@/components/Container";
import ThemeToggle from "@/components/ThemeToggle";
import PriceTicker from "@/components/PriceTicker";

/** 单页导航：锚点 id 与文案 key（links → /resources，news → /news，watchlist → /dashboard） */
const NAV_ITEMS = [
  { key: "watchlist", anchor: "watchlist" },
  { key: "articles", anchor: "articles" },
  { key: "news", anchor: "news" },
  { key: "links", anchor: "links" },
  { key: "bookmarks", anchor: "reading" },
  { key: "about", anchor: "about" },
] as const;

interface HeaderProps {
  locale: Locale;
  t: Dictionary;
}

export default function Header({ locale, t }: HeaderProps) {
  const pathname = usePathname();
  const otherLocale: Locale = locale === "zh" ? "en" : "zh";
  const onHome = pathname === `/${locale}`;
  const [open, setOpen] = useState(false);

  /* 路由跳转后自动收起菜单 */
  useEffect(() => setOpen(false), [pathname]);

  /* Esc 关闭 */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* 菜单打开时禁止背景滚动 */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 切换语言：替换路径前缀，并写入 cookie 供下次访问默认
  const switchPath =
    (pathname.startsWith(`/${locale}`)
      ? pathname.slice(locale.length + 1)
      : pathname) || "/";
  const onSwitch = () => {
    try {
      document.cookie = `cz_locale=${otherLocale};path=/;max-age=31536000`;
    } catch {
      /* 忽略 */
    }
  };

  const navHref = (anchor: string) =>
    anchor === "links"
      ? `/${locale}/resources`
      : anchor === "news"
        ? `/${locale}/news`
        : anchor === "watchlist"
          ? `/${locale}/dashboard`
          : onHome
            ? `#${anchor}`
            : `/${locale}/#${anchor}`;

  /** 语言切换（桌面端平铺 + 移动端菜单内各渲染一份） */
  const langSwitch = (
    <div
      role="group"
      aria-label={t.nav.switchLang}
      className="flex w-max items-center rounded-full border border-line p-0.5 text-xs"
    >
      <Link
        href={`/zh${switchPath}`}
        onClick={locale === "zh" ? undefined : onSwitch}
        aria-current={locale === "zh" ? "true" : undefined}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          locale === "zh"
            ? "bg-accent font-medium text-white"
            : "text-muted hover:text-heading"
        }`}
      >
        中
      </Link>
      <Link
        href={`/en${switchPath}`}
        onClick={locale === "en" ? undefined : onSwitch}
        aria-current={locale === "en" ? "true" : undefined}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          locale === "en"
            ? "bg-accent font-medium text-white"
            : "text-muted hover:text-heading"
        }`}
      >
        EN
      </Link>
    </div>
  );

  return (
    <header className="relative z-50 bg-paper">
      <Container className="flex h-16 items-center justify-between gap-3">
        {/* Logo：个人头像 + 站点名 */}
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={t.nav.homeAria}
        >
          <Image
            src="/avatar.png"
            alt="Crypto Zen avatar"
            width={32}
            height={32}
            priority
            className="rounded-full border border-line"
          />
          <span className="text-[15px] font-bold tracking-tight text-heading">
            {siteConfig.title}
          </span>
        </Link>

        {/* 桌面端右侧 */}
        <div className="hidden items-center gap-3 lg:flex">
          <PriceTicker ariaLabel={t.ticker.aria} />

          {/* Daily Alpha · 每日好运签 */}
          <Link
            href={`/${locale}/alpha`}
            className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-card px-3 py-1.5 text-[13px] font-medium text-heading transition-all duration-200 hover:border-accent/60 hover:shadow-[0_0_14px_rgba(37,99,235,0.2)]"
          >
            <span aria-hidden="true">🎐</span>
            {t.fortune.button}
          </Link>

          {langSwitch}

          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-4 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={navHref(item.anchor)}
                    className={`underline-offset-4 transition-colors duration-200 hover:text-heading hover:underline ${
                      onHome ? "font-medium text-heading" : "text-muted"
                    }`}
                  >
                    {t.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ThemeToggle labels={t.theme} />
        </div>

        {/* 移动端右侧：好运签 + 主题 + 汉堡 */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <Link
            href={`/${locale}/alpha`}
            aria-label={t.fortune.button}
            className="flex items-center gap-1 rounded-full border border-accent/30 bg-card px-2.5 py-1.5 text-[13px] font-medium text-heading"
          >
            <span aria-hidden="true">🎐</span>
            <span className="hidden min-[400px]:inline">{t.fortune.button}</span>
          </Link>
          <ThemeToggle labels={t.theme} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : t.nav.menu}
            className="rounded-lg p-2 text-heading transition-colors hover:bg-line"
          >
            {/* 汉堡 ↔ 关闭 动画图标 */}
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-5 rounded bg-current transition-all duration-200 ${
                  open ? "top-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current transition-all duration-200 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-3 block h-0.5 w-5 rounded bg-current transition-all duration-200 ${
                  open ? "top-1.5 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </Container>

      {/* 遮罩 */}
      <div
        className={`fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* 移动端下拉菜单 */}
      <div
        className={`absolute inset-x-0 top-16 z-50 origin-top border-b border-line bg-paper shadow-xl transition-all duration-200 lg:hidden ${
          open
            ? "visible scale-y-100 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <Container className="py-3">
          <nav aria-label="Main navigation">
            <ul className="divide-y divide-line/60">
              {NAV_ITEMS.map((item, i) => (
                <li key={item.key}>
                  <Link
                    href={navHref(item.anchor)}
                    className="flex items-center justify-between px-2 py-3.5 text-[15px] font-medium text-heading transition-colors active:text-accent"
                  >
                    {t.nav[item.key]}
                    <span
                      aria-hidden="true"
                      className="text-xs text-muted/60"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-4">
            {langSwitch}
            <span className="min-w-0 overflow-hidden [&>div]:gap-2.5 [&>div]:text-[10.5px]">
              <PriceTicker ariaLabel={t.ticker.aria} always />
            </span>
          </div>
        </Container>
      </div>
    </header>
  );
}

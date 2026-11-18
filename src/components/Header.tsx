"use client";

/**
 * Header.tsx —— 顶部导航（2026-11 改版：方案 C · 内容优先）
 *
 * 桌面端（lg+）：纯导航单行 —— logo + 好运签(文字链) + 锚点导航 + 语言 + 主题；
 * 行情已迁至首页 Hero 胶囊芯片（PriceTicker variant="chips"）。
 * 移动端（<lg）：汉堡展开下拉菜单；底部仅语言切换（行情同样只在 Hero 可见）。
 *
 * 当前页高亮：看板/文章/方程式新闻/推荐 按路径前缀匹配。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import type { Dictionary, Locale } from "@/lib/i18n";
import Container from "@/components/Container";
import ThemeToggle from "@/components/ThemeToggle";

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
          : anchor === "about"
          ? `/${locale}/about`
          : onHome
            ? `#${anchor}`
            : `/${locale}/#${anchor}`;

  /** 当前页高亮：独立页按路径前缀匹配；首页锚点不高亮 */
  const isActive = (anchor: string): boolean => {
    if (anchor === "watchlist") return pathname.startsWith(`/${locale}/dashboard`);
    if (anchor === "news") return pathname.startsWith(`/${locale}/news`);
    if (anchor === "links") return pathname.startsWith(`/${locale}/resources`);
    if (anchor === "articles") return pathname.startsWith(`/${locale}/writing`);
    return false;
  };

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

  const linkCls = (active: boolean) =>
    `transition-colors duration-200 hover:text-heading ${
      active ? "font-semibold text-heading" : "text-muted"
    }`;

  return (
    <header className="relative z-50 border-b border-line bg-paper">
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

        {/* 桌面端：纯导航单行 */}
        <div className="hidden items-center gap-6 lg:flex">
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-6 text-sm">
              <li>
                <Link
                  href={`/${locale}/alpha`}
                  className="font-medium text-accent transition-colors duration-200 hover:text-accent-deep dark:hover:text-accent-mint"
                >
                  🎐 {t.fortune.button}
                </Link>
              </li>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.anchor);
                return (
                  <li key={item.key}>
                    <Link
                      href={navHref(item.anchor)}
                      aria-current={active ? "page" : undefined}
                      className={linkCls(active)}
                    >
                      {t.nav[item.key]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {langSwitch}
          <ThemeToggle labels={t.theme} />
        </div>

        {/* 移动端：主题 + 汉堡 */}
        <div className="flex items-center gap-1.5 lg:hidden">
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
        className={`absolute inset-x-0 top-16 z-50 border-b border-line bg-paper shadow-xl transition-all duration-200 lg:hidden ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <Container className="py-3">
          <nav aria-label="Main navigation">
            <ul className="divide-y divide-line/60">
              <li>
                <Link
                  href={`/${locale}/alpha`}
                  className="flex items-center justify-between px-2 py-3.5 text-[15px] font-medium text-accent dark:text-accent-mint"
                >
                  🎐 {t.fortune.button}
                  <span aria-hidden="true" className="text-xs text-muted/60">00</span>
                </Link>
              </li>
              {NAV_ITEMS.map((item, i) => {
                const active = isActive(item.anchor);
                return (
                  <li key={item.key}>
                    <Link
                      href={navHref(item.anchor)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between px-2 py-3.5 text-[15px] ${
                        active ? "font-semibold text-heading" : "font-medium text-heading"
                      } transition-colors active:text-accent`}
                    >
                      {t.nav[item.key]}
                      <span
                        aria-hidden="true"
                        className={`text-xs ${active ? "text-accent" : "text-muted/60"}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-3 border-t border-line pt-4">
            {langSwitch}
          </div>
        </Container>
      </div>
    </header>
  );
}

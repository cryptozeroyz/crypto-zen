"use client";

/**
 * Header.tsx —— 顶部导航
 * 左侧头像 + 站点名，右侧：语言切换（中/EN）、导航、主题切换。
 * 后台入口不对外展示，通过直接输入 /admin 访问。
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import type { Dictionary, Locale } from "@/lib/i18n";
import Container from "@/components/Container";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { key: "writing", path: "/writing" },
  { key: "watchlist", path: "/watchlist" },
  { key: "about", path: "/about" },
] as const;

interface HeaderProps {
  locale: Locale;
  t: Dictionary;
}

export default function Header({ locale, t }: HeaderProps) {
  const pathname = usePathname();
  const otherLocale: Locale = locale === "zh" ? "en" : "zh";

  // 切换语言：替换路径前缀，并写入 cookie 供下次访问默认
  const switchHref = (pathname.startsWith(`/${locale}`)
    ? pathname.slice(locale.length + 1)
    : pathname) || "/";
  const onSwitch = () => {
    try {
      document.cookie = `cz_locale=${otherLocale};path=/;max-age=31536000`;
    } catch {
      /* 忽略 */
    }
  };

  return (
    <header className="border-b border-line bg-paper">
      <Container className="flex h-16 items-center justify-between gap-4">
        {/* Logo：个人头像 + 站点名 */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5" aria-label={t.nav.homeAria}>
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

        <div className="flex items-center gap-3 sm:gap-5">
          {/* 语言切换 */}
          <div
            role="group"
            aria-label={t.nav.switchLang}
            className="flex items-center rounded-full border border-line p-0.5 text-xs"
          >
            <Link
              href={`/zh${switchHref}`}
              onClick={locale === "zh" ? undefined : onSwitch}
              aria-current={locale === "zh" ? "true" : undefined}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "zh"
                  ? "bg-accent font-medium text-white"
                  : "text-muted hover:text-heading"
              }`}
            >
              中
            </Link>
            <Link
              href={`/en${switchHref}`}
              onClick={locale === "en" ? undefined : onSwitch}
              aria-current={locale === "en" ? "true" : undefined}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "en"
                  ? "bg-accent font-medium text-white"
                  : "text-muted hover:text-heading"
              }`}
            >
              EN
            </Link>
          </div>

          {/* 主导航 */}
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-4 text-sm sm:gap-5">
              {NAV_ITEMS.map((item) => {
                const href = `/${locale}${item.path}`;
                const active = pathname.startsWith(href);
                return (
                  <li key={item.key}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`underline-offset-4 transition-colors duration-200 hover:text-heading hover:underline ${
                        active
                          ? "font-medium text-heading underline decoration-accent"
                          : "text-muted"
                      }`}
                    >
                      {t.nav[item.key]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <ThemeToggle
            toDarkLabel={t.theme.toDark}
            toLightLabel={t.theme.toLight}
          />
        </div>
      </Container>
    </header>
  );
}

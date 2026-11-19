"use client";

/**
 * RedesignRail.tsx —— 改版第一批：全局外壳
 * 右侧深紫轨道（头像/汉堡/社交）+ 珊瑚橙滑出菜单 + 纸感噪点层。
 * 菜单接管全站导航；旧 Header 暂留，后续批次替换。
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";

const ITEMS = [
  { zh: "首页", en: "Home", href: "" },
  { zh: "投研成绩单", en: "Track Record", href: "/dashboard" },
  { zh: "文章", en: "Writing", href: "/#articles" },
  { zh: "方程式新闻", en: "News", href: "/news" },
  { zh: "好运签", en: "Daily Alpha", href: "/alpha" },
  { zh: "关于", en: "About", href: "/about" },
] as const;

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23p)' opacity='.55'/%3E%3C/svg%3E")`;

export default function RedesignRail({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <div className={`rail-mask ${open ? "show" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <nav className={`rail-menu ${open ? "open" : ""}`} aria-hidden={!open}>
        {ITEMS.map((it, i) => (
          <Link key={it.href || "home"} href={`/${locale}${it.href}`} style={{ "--d": `${0.08 + i * 0.06}s` } as React.CSSProperties} tabIndex={open ? 0 : -1}>
            {locale === "zh" ? it.zh : it.en}
            <span className="en">{locale === "zh" ? it.en : it.zh}</span>
          </Link>
        ))}
      </nav>

      <aside className="rail">
        <Link href={`/${locale}`} aria-label="Crypto Zen home" className="ava-link">
          <Image src="/avatar.png" alt="Crypto Zen" width={44} height={44} className="ava" priority />
        </Link>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <i />
        </button>
        <span className="arrow" aria-hidden="true">⇣</span>
        <div className="soc">
          <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" aria-label="X">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.9 2.1h3.7l-8.1 9.3 9.5 12.5h-7.5l-5.9-7.7-6.7 7.7H.2l8.7-9.9L0 2.1h7.7l5.3 7 5.9-7z" /></svg>
          </a>
          <a href={siteConfig.social.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M21.9 4.6L2.7 11.8c-.9.3-.9 1.6.1 1.9l4.8 1.5 1.9 5.7c.3.8 1.2 1 1.8.4l2.6-2.5 4.9 3.6c.7.4 1.6.1 1.8-.7l3.2-15.3c.2-.9-.6-1.6-1.5-1.3z" /></svg>
          </a>
        </div>
      </aside>
    </>
  );
}

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
      <style jsx>{`
        .noise { position: fixed; inset: 0; z-index: 4; pointer-events: none; opacity: 0.03; background-image: ${NOISE}; }
        .rail { position: fixed; right: 0; top: 0; bottom: 0; width: 72px; z-index: 55; display: flex; flex-direction: column; align-items: center; padding: 24px 0; background: #5c2a52; }
        .ava { border-radius: 50%; border: 2px solid rgba(255,255,255,.75); object-fit: cover; }
        .burger { margin: auto 0; width: 44px; height: 116px; background: #ff5b3a; border: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; border-radius: 2px; }
        .burger i, .burger i::before, .burger i::after { content: ""; position: absolute; width: 20px; height: 2px; background: #fff; left: 12px; transition: 0.3s; }
        .burger i { top: 56px; }
        .burger i::before { top: -6px; }
        .burger i::after { top: 6px; }
        .burger[aria-expanded="true"] i { background: transparent; }
        .burger[aria-expanded="true"] i::before { top: 0; transform: rotate(45deg); }
        .burger[aria-expanded="true"] i::after { top: 0; transform: rotate(-45deg); }
        .arrow { color: #fff; font-size: 17px; animation: bob 1.6s infinite; }
        @keyframes bob { 50% { transform: translateY(6px); } }
        .soc { display: flex; flex-direction: column; gap: 16px; margin-top: 18px; }
        .soc a { opacity: .9; transition: .2s; }
        .soc a:hover { opacity: 1; transform: scale(1.12); }
        .menu { position: fixed; right: 72px; top: 0; bottom: 0; width: min(320px, calc(100vw - 72px)); background: #ff5b3a; z-index: 54; transform: translateX(105%); transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.25, 1); padding: 100px 40px; overflow-y: auto; }
        .menu.open { transform: none; }
        .menu a { display: block; color: #fff; text-decoration: none; font-size: 19px; margin: 24px 0; letter-spacing: 0.05em; opacity: 0; transform: translateX(18px); transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.25, 1) var(--d), opacity 0.5s var(--d), color 0.2s; }
        .menu.open a { opacity: 1; transform: none; }
        .menu a:hover { color: #5c2a52; }
        .menu .en { display: block; font-size: 11px; opacity: 0.75; letter-spacing: 0.2em; }
        .mask { position: fixed; inset: 0; z-index: 53; background: rgba(30, 15, 30, 0.35); opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .mask.show { opacity: 1; pointer-events: auto; }
        @media (max-width: 640px) {
          .rail { width: 56px; }
          .menu { right: 56px; width: calc(100vw - 56px); }
          .soc { gap: 12px; }
        }
      `}</style>

      <div className="noise" aria-hidden="true" />
      <div className={`mask ${open ? "show" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <nav className={`menu ${open ? "open" : ""}`} aria-hidden={!open}>
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

"use client";

/**
 * AboutClient.tsx —— Crypto Zen 品牌定位页（v2）
 * Operator · Trader · Observer。交互：滚动进度条 / 逐词显现 / 视差光晕 /
 * 入场编排 / 幽灵序号 / 胶片颗粒，全部尊重 prefers-reduced-motion。
 */

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";

const COPY = {
  zh: {
    eyebrow: "CRYPTO ZEN · PERSONAL BRAND",
    title: "Crypto Zen.",
    roles: ["An Operator.", "A Trader.", "An Observer."],
    zhLine: "一个建设过产品、参与过市场，也持续观察 Crypto 世界的人。",
    bio: "我参与过不同类型的 Web3 产品建设——钱包、稳定币、公链生态、DID、NFT 和 Memecoin 交易平台。做过产品运营、用户增长、社区建设、商业化，也经历过从 0 到 1 的创业过程。我习惯站在产品和市场两个角度看待 Crypto。",
    scroll: "SCROLL ↓",
    sec1: "Background",
    builder: { en: "Builder", zh: "产品建设", p: "关注一个产品如何诞生、如何获得用户、如何在激烈竞争中找到真正的价值。" },
    operator: { en: "Operator", zh: "运营增长", p: "从 0 到 1 搭建运营与增长体系，理解用户、社区与商业化的真实逻辑。" },
    trader: { en: "Trader", zh: "市场参与", p: "关注资金流向、叙事变化与 Meme 文化。赚过钱，也交过不少学费。" },
    sec2: "What I Write About",
    writes: [
      { ico: "📈", en: "Market Insights", p: "市场行情、资金流向、周期与情绪观察" },
      { ico: "🐸", en: "Meme Culture", p: "Memecoin、互联网文化、叙事与社区" },
      { ico: "📓", en: "Trading Journal", p: "交易思考、策略、复盘与值得记住的错误" },
      { ico: "🧭", en: "Product & Growth", p: "Web3 产品、运营增长与商业模式" },
    ],
    wfoot: "有时也会写一些不那么严肃的想法和段子——毕竟 Crypto 已经够疯狂了。如果你不能笑着面对这个市场，你迟早会被它气死。",
    philoEyebrow: "PHILOSOPHY",
    big: ["Stay curious.", "Stay skeptical."],
    bigZh: "保持好奇，保持怀疑。相信数据，但不迷信数据；尊重叙事，但不盲从叙事。",
    quote: "在一个信息过载、情绪容易被放大的市场里，独立思考或许比追逐每一个热点更重要。我希望多年以后回头看，这里留下的不只有行情观点，还有一个普通 Crypto 参与者对这个行业的真实记录。",
    sec3: "No Financial Advice",
    rules: [
      { ok: false, b: "No Token Launches", p: "不发币，不为任何代币背书" },
      { ok: false, b: "No Paid Signals", p: "不提供付费带单或收益承诺" },
      { ok: false, b: "No Sponsored Shilling", p: "不接受付费软文和商业喊单" },
      { ok: true, b: "Independent Opinions", p: "所有内容仅代表个人观点" },
    ],
    motto: "Stay curious. Stay skeptical. Stay in the game.",
    who: "— Crypto Zen",
    back: "← 返回首页",
  },
  en: {
    eyebrow: "CRYPTO ZEN · PERSONAL BRAND",
    title: "Crypto Zen.",
    roles: ["An Operator.", "A Trader.", "An Observer."],
    zhLine: "Someone who has built products, traded the market, and keeps observing the crypto world.",
    bio: "I've helped build different kinds of Web3 products — wallets, stablecoins, layer-1 ecosystems, DID, NFTs and memecoin trading platforms. I've done product ops, growth, community and monetization, including 0-to-1 startups. I tend to look at crypto from both the product and the market side.",
    scroll: "SCROLL ↓",
    sec1: "Background",
    builder: { en: "Builder", zh: "Product", p: "How a product is born, wins users, and finds real value in brutal competition." },
    operator: { en: "Operator", zh: "Growth", p: "Building ops and growth systems from zero — users, community, monetization." },
    trader: { en: "Trader", zh: "Market", p: "Watching capital flows, narratives and meme culture. Made money, paid tuition too." },
    sec2: "What I Write About",
    writes: [
      { ico: "📈", en: "Market Insights", p: "Market moves, capital flows, cycles and sentiment" },
      { ico: "🐸", en: "Meme Culture", p: "Memecoins, internet culture, narratives and community" },
      { ico: "📓", en: "Trading Journal", p: "Strategy, reviews, and mistakes worth remembering" },
      { ico: "🧭", en: "Product & Growth", p: "Web3 products, growth and business models" },
    ],
    wfoot: "Sometimes I write less serious thoughts and jokes — crypto is crazy enough already. If you can't laugh at this market, it will eventually kill you.",
    philoEyebrow: "PHILOSOPHY",
    big: ["Stay curious.", "Stay skeptical."],
    bigZh: "Trust data, but don't worship it. Respect narratives, but don't blindly follow them.",
    quote: "In a market overloaded with information and amplified emotion, independent thinking matters more than chasing every hot narrative. Years from now, I hope what's left here isn't just market calls, but an honest record of an ordinary crypto participant.",
    sec3: "No Financial Advice",
    rules: [
      { ok: false, b: "No Token Launches", p: "No coins launched, no tokens endorsed" },
      { ok: false, b: "No Paid Signals", p: "No paid calls, no return promises" },
      { ok: false, b: "No Sponsored Shilling", p: "No paid shills or sponsored pumps" },
      { ok: true, b: "Independent Opinions", p: "All content is personal opinion only" },
    ],
    motto: "Stay curious. Stay skeptical. Stay in the game.",
    who: "— Crypto Zen",
    back: "← Back to home",
  },
};

export default function AboutClient({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [glow, setGlow] = useState({ x: 80, y: 20 });
  const heroRef = useRef<HTMLDivElement>(null);

  /* 逐词显现 */
  useEffect(() => {
    if (!reduced) setMounted(true);
    else setMounted(true);
  }, [reduced]);

  /* 滚动进度条 */
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* 视差光晕 */
  const onMove = (e: React.MouseEvent) => {
    if (reduced || !heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  /* 入场编排 */
  useEffect(() => {
    if (reduced) return;
    const els = document.querySelectorAll("[data-rv]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            (en.target as HTMLElement).style.opacity = "1";
            (en.target as HTMLElement).style.transform = "none";
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  const rv = (d = 0): React.CSSProperties =>
    reduced
      ? {}
      : { opacity: 0, transform: "translateY(26px)", transition: `opacity .7s ease ${d}ms, transform .7s cubic-bezier(.2,.7,.3,1) ${d}ms` };

  return (
    <div onMouseMove={onMove} ref={heroRef}>
      {/* 颗粒 + 进度条 */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")` }} />
      <div aria-hidden="true" className="fixed left-0 top-0 z-[60] h-[2px] bg-accent transition-[width] duration-100 dark:bg-accent-mint" style={{ width: `${progress}%` }} />

      {/* 01 HERO */}
      <header className="relative flex min-h-[88vh] flex-col justify-center overflow-hidden border-b border-line">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(55% 45% at ${glow.x}% ${glow.y}%, rgba(37,99,235,.10), transparent)` }} />
        <div className="mx-auto w-full max-w-[860px] px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-accent-mint">{c.eyebrow}</div>
          <h1 data-rv className="font-serif mt-5 text-[clamp(52px,9vw,96px)] font-bold leading-[1.05] tracking-[-0.03em] text-heading" style={rv(0)}>
            {c.title}
          </h1>
          <div className="font-serif mt-5 text-[clamp(17px,2.6vw,25px)] italic text-accent dark:text-accent-mint" aria-label={c.roles.join(" ")}>
            {c.roles.map((w, i) => (
              <span
                key={w}
                className="mr-3 inline-block"
                style={reduced ? {} : { opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)", transition: `opacity .6s ease ${300 + i * 180}ms, transform .6s ease ${300 + i * 180}ms` }}
              >
                {w}
              </span>
            ))}
          </div>
          <p data-rv className="mt-4 text-[15px] text-muted" style={rv(700)}>{c.zhLine}</p>
          <p data-rv className="mt-7 max-w-[560px] text-[15px] leading-[1.9] text-text" style={rv(850)}>{c.bio}</p>
        </div>
        <span className="absolute bottom-7 left-6 text-[11px] tracking-[0.2em] text-muted">{c.scroll}</span>
      </header>

      {/* 02 BACKGROUND */}
      <section className="mx-auto w-full max-w-[860px] px-6 py-20">
        <div data-rv style={rv()} className="relative mb-10 flex items-baseline gap-4">
          <span aria-hidden="true" className="font-serif pointer-events-none absolute -top-10 -left-2 select-none text-[110px] font-bold leading-none" style={{ color: "var(--heading)", opacity: 0.05 }}>01</span>
          <h2 className="font-serif text-[clamp(24px,4vw,34px)] font-bold tracking-[-0.02em] text-heading">{c.sec1}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[c.builder, c.operator, c.trader].map((b, i) => (
            <div key={b.en} data-rv style={rv(i * 120)} className="group rounded-2xl border border-line bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-lg">
              <div className="font-serif text-[22px] font-bold text-heading">{b.en}</div>
              <div className="mt-1 text-[13px] font-semibold text-accent dark:text-accent-mint">{b.zh}</div>
              <p className="mt-3 text-[13.5px] leading-[1.8] text-muted">{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 03 WHAT I WRITE */}
      <section className="mx-auto w-full max-w-[860px] border-t border-line px-6 py-20">
        <div data-rv style={rv()} className="relative mb-10 flex items-baseline gap-4">
          <span aria-hidden="true" className="font-serif pointer-events-none absolute -top-10 -left-2 select-none text-[110px] font-bold leading-none" style={{ color: "var(--heading)", opacity: 0.05 }}>02</span>
          <h2 className="font-serif text-[clamp(24px,4vw,34px)] font-bold tracking-[-0.02em] text-heading">{c.sec2}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {c.writes.map((w, i) => (
            <div key={w.en} data-rv style={rv(i * 90)} className="group flex gap-4 rounded-2xl border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg">
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-mint text-[19px] text-white transition-transform duration-300 group-hover:scale-110">{w.ico}</span>
              <div>
                <h3 className="font-serif text-[17px] font-bold text-heading">{w.en}</h3>
                <p className="mt-1 text-[13px] text-muted">{w.p}</p>
              </div>
            </div>
          ))}
        </div>
        <p data-rv style={rv(200)} className="mt-7 border-l-2 border-accent pl-4 text-[13.5px] text-muted dark:border-accent-mint">{c.wfoot}</p>
      </section>

      {/* 04 PHILOSOPHY */}
      <section className="border-t border-line py-24 text-center">
        <div data-rv style={rv()} className="mx-auto w-full max-w-[860px] px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-accent-mint">{c.philoEyebrow}</div>
          <p className="font-serif mt-6 text-[clamp(30px,5.5vw,52px)] font-bold leading-[1.25] tracking-[-0.02em] text-heading">
            {c.big[0]}
            <br />
            {c.big[1]}
          </p>
          <p className="mt-5 text-[15px] text-muted">{c.bigZh}</p>
          <blockquote data-rv style={rv(150)} className="font-serif mx-auto mt-12 max-w-[520px] border-t border-line pt-8 text-[16px] italic leading-[1.9] text-text">
            “{c.quote}”
          </blockquote>
        </div>
      </section>

      {/* 05 DISCLAIMER */}
      <section className="mx-auto w-full max-w-[860px] border-t border-line px-6 py-20">
        <div data-rv style={rv()} className="relative mb-10 flex items-baseline gap-4">
          <span aria-hidden="true" className="font-serif pointer-events-none absolute -top-10 -left-2 select-none text-[110px] font-bold leading-none" style={{ color: "var(--heading)", opacity: 0.05 }}>03</span>
          <h2 className="font-serif text-[clamp(24px,4vw,34px)] font-bold tracking-[-0.02em] text-heading">{c.sec3}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {c.rules.map((r, i) => (
            <div key={r.b} data-rv style={rv(i * 80)} className="flex gap-3 rounded-xl border border-line bg-card px-5 py-4 text-[14px] text-text">
              <span className={`mt-0.5 font-bold ${r.ok ? "text-emerald-500" : "text-accent"}`}>{r.ok ? "✓" : "✕"}</span>
              <span><b className="block text-heading">{r.b}</b><span className="mt-0.5 block text-[13px] text-muted">{r.p}</span></span>
            </div>
          ))}
        </div>

        <div data-rv style={rv(150)} className="mt-16 text-center">
          <p className="font-serif text-[clamp(19px,3vw,27px)] font-bold text-heading">{c.motto}</p>
          <p className="mt-3 text-[13px] italic text-muted">{c.who}</p>
          <div className="mt-7 flex justify-center gap-7 text-[13px]">
            <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-accent">𝕏 {siteConfig.social.twitterHandle}</a>
            <a href={siteConfig.social.telegram} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-accent">Telegram</a>
            <a href={`/${locale}`} className="text-muted transition-colors hover:text-accent">{c.back}</a>
          </div>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-[11.5px] leading-[1.75] text-muted">
          Disclaimer: All content on this website is for informational and educational purposes only. Nothing here constitutes financial or investment advice, a recommendation to buy or sell any asset, or a promise of returns. Cryptocurrency markets involve substantial risks. Always do your own research and take responsibility for your own decisions.
        </p>
      </section>
    </div>
  );
}

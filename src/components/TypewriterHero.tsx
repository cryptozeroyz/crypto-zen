"use client";

/**
 * TypewriterHero.tsx —— 改版第二批：打字机首屏
 * 逐字打出自我介绍，@0CryptoZero 带链接，角落括号框，respects reduced-motion。
 */

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const LINES = {
  zh: [
    ["Hey there! My name is", ""],
    ["CRYPTOZEN", "nm"],
    ["or you can find me at", ""],
    ["X (Twitter)", "link"],
    ["I am an Operator, a Trader", ""],
    ["and an Observer in Meme World,", "hl"],
    ["Crypto Researcher", ""],
    ["... and just a degen", "hl"],
  ] as Array<[string, string]>,
  en: [
    ["Hey there! My name is", ""],
    ["CRYPTOZEN", "nm"],
    ["or you can find me at", ""],
    ["X (Twitter)", "link"],
    ["I am an Operator, a Trader", ""],
    ["and an Observer in Meme World,", "hl"],
    ["Crypto Researcher", ""],
    ["... and just a degen", "hl"],
  ] as Array<[string, string]>,
};

export default function TypewriterHero({ locale }: { locale: Locale }) {
  const lines = LINES[locale] ?? LINES.zh;
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(lines.map(([t, c]) => renderLine(t, c, t)).join("<br>"));
      setDone(true);
      return;
    }
    if (li >= lines.length) {
      setDone(true);
      return;
    }
    const [txt] = lines[li];
    if (ci < txt.length) {
      const t = setTimeout(() => setCi((v) => v + 1), 45 + Math.random() * 55);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setOut((o) => o + renderLine(txt, lines[li][1], txt) + "<br>");
      setLi((v) => v + 1);
      setCi(0);
    }, txt.length > 12 ? 420 : 260);
    return () => clearTimeout(t);
  }, [li, ci, lines]);

  const cur = li < lines.length ? renderLine(lines[li][0], lines[li][1], lines[li][0].slice(0, ci)) : "";

  return (
    <section className="tw-hero" aria-label="Intro">
      {/* 无 JS 抓取/爬虫兜底：静态 H1 + 主题介绍（有 JS 时打字机 h1 呈现） */}
      <noscript>
        <h1>CryptoZen — Memecoin 研究与链上分析 | Memecoin Research & On-chain Analysis</h1>
        <p>每一次判断、更新与复盘全部留痕，可查可验。Every call, update and post-mortem is on the record.</p>
      </noscript>
      <style>{`
        .tw-hero{min-height:82vh;display:flex;align-items:center;background:#f6f3ee;border-bottom:2px solid #2a2230;position:relative;overflow:hidden}
        .tw-grid{display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:48px;align-items:center;max-width:860px;margin:0 auto;padding:0 40px;width:100%}
        .tw-frame{position:relative;padding:44px 40px;width:100%}
        .tw-frame::before,.tw-frame::after{content:"";position:absolute;width:34px;height:34px;border:3px solid #ff5b3a}
        .tw-frame::before{top:-3px;left:-3px;border-right:0;border-bottom:0}
        .tw-frame::after{bottom:-3px;right:-3px;border-left:0;border-top:0}
        .tw-text{font-family:var(--font-mono,ui-monospace,"Courier New",monospace);font-size:14.5px;letter-spacing:.04em;line-height:2.1;color:#2a2230;min-height:300px;white-space:pre-wrap}
        .tw-text .nm{font-family:var(--font-serif,"Iowan Old Style",Palatino,Georgia,"Songti SC",serif);font-size:clamp(26px,3.6vw,38px);color:#5c2a52;font-weight:700;letter-spacing:.02em;margin:0;line-height:1.35}
        .tw-text .hl{color:#ff5b3a;font-weight:700}
        .tw-text a.nm{text-decoration:underline;text-decoration-color:#ff5b3a;text-underline-offset:6px}
        .tw-caret{display:inline-block;width:9px;height:1.1em;background:#ff5b3a;vertical-align:-2px;animation:twblink .8s steps(1) infinite}
        @keyframes twblink{50%{opacity:0}}
        /* 移动端：单列、去简笔画、收紧留白 */
        @media(max-width:820px){
          .tw-hero{min-height:calc(100svh - 60px)}
          .tw-grid{grid-template-columns:1fr;gap:0;padding:0 16px}
          .tw-sketch{display:none}
          .tw-frame{padding:36px 12px}
          .tw-text{font-size:13.5px;line-height:2;min-height:250px}
        }
      `}</style>
      <div className="tw-grid">
        <div className="tw-sketch" aria-hidden="true" style={{transform:"rotate(-2deg)"}}>
          <svg viewBox="0 0 200 260" fill="none" stroke="#2a2230" strokeWidth="2" strokeLinecap="round" style={{width:"100%",height:"auto"}}>
            <path d="M60 40 Q100 5 140 40 Q175 70 165 130 Q185 160 160 210 Q120 250 75 235 Q30 215 35 150 Q20 95 60 40Z" fill="#fff" opacity=".7"/>
            <circle cx="80" cy="105" r="7"/><circle cx="128" cy="100" r="7"/>
            <path d="M70 90 q10 -8 20 -2 M118 84 q12 -6 22 0"/>
            <path d="M104 112 q-4 18 -10 24 q6 5 14 2"/>
            <path d="M78 165 q26 18 52 -4" strokeWidth="3"/>
            <path d="M60 190 q40 26 84 0" opacity=".4"/>
          </svg>
        </div>
        <div className="tw-frame">
        <div className="tw-text">
          <span dangerouslySetInnerHTML={{ __html: out + cur }} />
          {!done && <span className="tw-caret" />}
        </div>
        </div>
      </div>
    </section>
  );
}

function renderLine(txt: string, cls: string, part: string): string {
  if (cls === "link")
    return `<a class="nm" href="https://x.com/0CryptoZero" target="_blank" rel="noopener noreferrer">${part}</a>`;
  /* 品牌名一行输出为 H1（首页语义主标题） */
  if (cls === "nm") return `<h1 class="nm">${part}</h1>`;
  if (cls === "hl") return `<span class="hl">${part}</span>`;
  return part;
}

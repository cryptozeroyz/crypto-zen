/**
 * MemeHeroArt.tsx —— Hero 右侧的 meme 币漂浮元素
 * 优先展示 CoinGecko 官方币 logo（构建期抓取的图片地址），
 * 抓不到时回退为字母圆片。星芒水印垫底，纯 CSS 漂浮动画。
 */

import type { HeroLogo } from "@/lib/coin-images";

interface Slot {
  id: string;
  sym: string;
  bg: string;
  fg: string;
  size: number;
  className: string;
  delay: string;
}

const SLOTS: Slot[] = [
  { id: "bitcoin", sym: "₿", bg: "#f7931a", fg: "#fff", size: 60, className: "left-8 top-0", delay: "0s" },
  { id: "ethereum", sym: "Ξ", bg: "#627eea", fg: "#fff", size: 50, className: "right-2 top-10", delay: "0.8s" },
  { id: "solana", sym: "◎", bg: "#9945ff", fg: "#fff", size: 46, className: "left-20 bottom-2", delay: "1.6s" },
  { id: "pepe", sym: "P", bg: "#3d8130", fg: "#fff", size: 54, className: "right-14 bottom-4", delay: "0.4s" },
  { id: "bonk", sym: "B", bg: "#f2a900", fg: "#fff", size: 48, className: "left-0 bottom-20", delay: "1.2s" },
  { id: "dogwifcoin", sym: "W", bg: "#e8734a", fg: "#fff", size: 42, className: "right-0 top-28", delay: "2s" },
  { id: "dogecoin", sym: "Ð", bg: "#c2a633", fg: "#fff", size: 44, className: "left-2 top-24", delay: "2.6s" },
];

export default function MemeHeroArt({
  logos = [],
  className = "",
}: {
  logos?: HeroLogo[];
  className?: string;
}) {
  const byId = new Map(logos.map((l) => [l.id, l]));

  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      {/* 星芒水印（弱化垫底） */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 m-auto h-56 w-56 text-accent opacity-[0.12] dark:text-accent-mint"
      >
        <g
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          transform="translate(100,100)"
        >
          <line y1="-78" y2="78" />
          <line y1="-78" y2="78" transform="rotate(36)" opacity="0.55" />
          <line y1="-78" y2="78" transform="rotate(72)" />
          <line y1="-78" y2="78" transform="rotate(108)" opacity="0.55" />
          <line y1="-78" y2="78" transform="rotate(144)" />
        </g>
      </svg>

      {/* 漂浮币片（logo 优先，字母兜底） */}
      {SLOTS.map((s) => {
        const logo = byId.get(s.id);
        return (
          <span
            key={s.id}
            title={s.id}
            className={`absolute flex items-center justify-center overflow-hidden rounded-full font-bold shadow-lg ${s.className}`}
            style={{
              width: s.size,
              height: s.size,
              background: logo ? "#ffffff" : s.bg,
              color: s.fg,
              fontSize: s.size * 0.46,
              animation: "float-y 5.5s ease-in-out infinite",
              animationDelay: s.delay,
              border: logo ? "1px solid var(--line)" : "none",
              padding: logo ? s.size * 0.16 : 0,
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.image}
                alt=""
                loading="lazy"
                className="h-full w-full rounded-full object-contain"
              />
            ) : (
              s.sym
            )}
          </span>
        );
      })}
    </div>
  );
}

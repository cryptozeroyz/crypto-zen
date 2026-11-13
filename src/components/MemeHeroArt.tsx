/**
 * MemeHeroArt.tsx —— Hero 右侧的 meme 币漂浮元素
 * 星芒水印 + 6 枚主流/ Meme 币圆片缓慢上下漂浮。
 * 纯 CSS 动画，尊重 prefers-reduced-motion。
 */

const COINS: Array<{
  sym: string;
  bg: string;
  fg: string;
  size: number;
  className: string;
  delay: string;
}> = [
  // BTC 稳居中心偏上
  { sym: "₿", bg: "#f7931a", fg: "#ffffff", size: 64, className: "left-6 top-2", delay: "0s" },
  // ETH
  { sym: "Ξ", bg: "#627eea", fg: "#ffffff", size: 52, className: "right-4 top-8", delay: "0.8s" },
  // SOL
  { sym: "◎", bg: "#9945ff", fg: "#ffffff", size: 48, className: "left-16 bottom-6", delay: "1.6s" },
  // PEPE
  { sym: "$PEPE", bg: "#3d8130", fg: "#ffffff", size: 56, className: "right-12 bottom-2", delay: "0.4s" },
  // BONK
  { sym: "$BONK", bg: "#f2a900", fg: "#ffffff", size: 50, className: "left-0 bottom-16", delay: "1.2s" },
  // WIF
  { sym: "$WIF", bg: "#e8734a", fg: "#ffffff", size: 44, className: "right-0 top-24", delay: "2s" },
];

export default function MemeHeroArt({ className = "" }: { className?: string }) {
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

      {/* 漂浮币片 */}
      {COINS.map((c) => (
        <span
          key={c.sym}
          className={`absolute flex items-center justify-center rounded-full font-bold shadow-lg ${c.className}`}
          style={{
            width: c.size,
            height: c.size,
            background: c.bg,
            color: c.fg,
            fontSize: c.sym.length > 1 ? c.size * 0.22 : c.size * 0.48,
            animation: `float-y 5.5s ease-in-out infinite`,
            animationDelay: c.delay,
          }}
        >
          {c.sym}
        </span>
      ))}
    </div>
  );
}

/**
 * MemeTape.tsx —— Hero 底部的币名滚动带
 * 主流币 + 热门 Meme 币组成的跑马灯，纯 CSS 动画，
 * 首尾复制一份实现无缝循环；尊重 prefers-reduced-motion。
 */

const COINS = [
  "BITCOIN",
  "ETHEREUM",
  "SOLANA",
  "$PEPE",
  "$BONK",
  "$WIF",
  "$DOGE",
  "$SHIB",
  "$FLOKI",
  "$NEIRO",
  "$POPCAT",
  "$MOODENG",
];

export default function MemeTape() {
  const row = [...COINS, ...COINS];
  return (
    <div
      aria-hidden="true"
      className="relative mt-10 overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap font-mono text-[11px] tracking-[0.2em] text-muted/70">
        {row.map((c, i) => (
          <span key={`${c}-${i}`} className="flex items-center gap-8">
            <span>{c}</span>
            <span className="text-accent/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

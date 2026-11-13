/**
 * MemeTape.tsx —— Hero 底部的动物 Emoji 滚动带
 * 纯 CSS 无缝跑马灯，首尾复制一份；尊重 prefers-reduced-motion。
 */

const ANIMALS = ["🐸", "🐶", "🐱", "🐹", "🐐", "🐧", "🦆", "🐼", "🐷", "🦍"];

export default function MemeTape() {
  const row = [...ANIMALS, ...ANIMALS];
  return (
    <div
      aria-hidden="true"
      className="relative mt-8 overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap text-xl">
        {row.map((e, i) => (
          <span key={i} className="flex items-center gap-10">
            <span>{e}</span>
            <span className="text-[9px] text-accent/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

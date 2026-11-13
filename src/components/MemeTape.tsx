/**
 * MemeTape.tsx —— Hero 底部的动物 Emoji 滚动带
 * 每个单元（emoji + 分隔符）自带内边距、轨道无 gap，
 * translateX(-50%) 才能精确无缝；尊重 prefers-reduced-motion。
 */

const ANIMALS = ["🐸", "🐶", "🐱", "🐹", "🐐", "🐧", "🦆", "🐼", "🐷", "🦍"];

export default function MemeTape() {
  const row = [...ANIMALS, ...ANIMALS];
  return (
    <div
      aria-hidden="true"
      className="relative mt-8 overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="marquee-track flex w-max items-center whitespace-nowrap text-xl">
        {row.map((e, i) => (
          <span key={i} className="flex items-center">
            <span className="px-7">{e}</span>
            <span className="text-[9px] text-accent/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

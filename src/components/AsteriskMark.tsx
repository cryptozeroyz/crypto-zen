/**
 * AsteriskMark.tsx —— 品牌星芒装饰图形（呼应参考站的放射状标志）
 * 5 条穿过圆心的辐射线（10 个芒），带薄荷色光晕，极慢旋转。
 * 纯装饰，对辅助技术隐藏。
 */

export default function AsteriskMark({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      {/* 光晕 */}
      <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(129,216,208,0.3),transparent_65%)]" />
      {/* 星芒本体 */}
      <svg
        viewBox="0 0 200 200"
        className="relative h-full w-full animate-spin-slow text-accent-mint"
      >
        <g
          stroke="currentColor"
          strokeWidth="13"
          strokeLinecap="round"
          transform="translate(100,100)"
        >
          <line y1="-78" y2="78" />
          <line y1="-78" y2="78" transform="rotate(36)" opacity="0.5" />
          <line y1="-78" y2="78" transform="rotate(72)" />
          <line y1="-78" y2="78" transform="rotate(108)" opacity="0.5" />
          <line y1="-78" y2="78" transform="rotate(144)" />
        </g>
      </svg>
      {/* 周围的加号点缀 */}
      <span className="absolute -left-8 top-4 text-lg font-light text-accent/50 dark:text-accent-mint/50">
        +
      </span>
      <span className="absolute -right-6 bottom-10 text-base font-light text-accent/40 dark:text-accent-mint/40">
        +
      </span>
      <span className="absolute right-10 -top-6 text-sm font-light text-accent/30 dark:text-accent-mint/30">
        +
      </span>
    </div>
  );
}

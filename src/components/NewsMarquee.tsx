/**
 * NewsMarquee.tsx —— Hero 下方的快讯跑马灯（服务端渲染 + 纯 CSS 滚动）
 * 取最新几条标题无缝横滚，点击整条跳转 /news。
 */

import Link from "next/link";
import type { EqnItem } from "@/lib/eqn";

export default function NewsMarquee({
  items,
  href,
}: {
  items: EqnItem[];
  href: string;
}) {
  if (items.length === 0) return null;
  const picks = items.slice(0, 6);
  const row = [...picks, ...picks];

  return (
    <Link
      href={href}
      className="group relative mt-8 block overflow-hidden py-1.5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      aria-label="链上快讯"
    >
      <div className="marquee-track flex w-max items-center whitespace-nowrap text-[13px]">
        {row.map((item, i) => (
          <span key={`${item.url}-${i}`} className="flex items-center">
            <span className="px-6 text-muted transition-colors group-hover:text-heading">
              <span className="mr-2 text-accent" aria-hidden="true">
                ⚡
              </span>
              {item.title}
            </span>
            <span className="text-[9px] text-accent/40" aria-hidden="true">
              ◆
            </span>
          </span>
        ))}
      </div>
    </Link>
  );
}

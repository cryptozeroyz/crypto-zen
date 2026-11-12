/**
 * Disclosure.tsx —— 文章顶部的免责声明组件
 * 文案来自多语言字典（i18n.ts）。
 */

import type { Dictionary } from "@/lib/i18n";

export default function Disclosure({ t }: { t: Dictionary }) {
  return (
    <aside className="my-6 rounded-xl border border-line bg-card p-4">
      <p className="text-[13px] font-semibold text-heading">
        {t.disclosure.title}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        {t.disclosure.content}
      </p>
    </aside>
  );
}

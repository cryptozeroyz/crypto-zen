"use client";

/**
 * CopyCaButton.tsx —— 详情页币名旁的复制 CA 小按钮
 */
import { useState } from "react";

export default function CopyCaButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      title="复制合约地址"
      aria-live="polite"
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] transition-all duration-200 ${
        copied
          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-line text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {copied ? "✓ 已复制 CA" : "📋 CA"}
    </button>
  );
}

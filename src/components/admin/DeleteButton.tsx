"use client";

/**
 * DeleteButton.tsx —— 后台文章删除按钮（带二次确认）
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  const onClick = async () => {
    if (!window.confirm(`确定要删除「${slug}.md」吗？此操作不可恢复。`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "删除失败");
    } catch {
      setError("网络错误，删除失败");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="text-sm text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        删除
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </>
  );
}

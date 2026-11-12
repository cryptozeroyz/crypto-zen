"use client";

/**
 * LogoutButton.tsx —— 后台退出登录按钮
 */

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-lg border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-heading hover:text-heading disabled:opacity-60"
    >
      退出登录
    </button>
  );
}

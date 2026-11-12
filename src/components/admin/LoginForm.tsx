"use client";

/**
 * LoginForm.tsx —— 后台登录表单
 * 成功后整页跳转 /admin（让服务端组件重新鉴权）。
 */

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/admin";
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "登录失败，请重试");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm text-muted">
          管理密码
        </label>
        <input
          id="admin-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入后台密码"
          className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {loading ? "登录中…" : "登录"}
      </button>
    </form>
  );
}

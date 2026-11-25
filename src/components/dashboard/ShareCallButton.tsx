"use client";

/**
 * ShareCallButton.tsx —— Track Record 分享按钮
 * 点击弹出预览：服务端生成 1080×1350 PNG（/api/market?type=share），
 * 支持「下载图片」和「复制图片」（ClipboardItem，不支持时降级为下载）。
 */
import { useEffect, useState } from "react";

export default function ShareCallButton({
  id,
  symbol,
  compact = false,
}: {
  id: string;
  symbol: string;
  /** 紧凑模式：仅图标（卡片底部用） */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);

  /* 打开时拉取 PNG（顺便当预览） */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBlobUrl(null);
    setError(null);
    fetch(`/api/market?type=share&id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "生成失败");
        return r.blob();
      })
      .then((b) => {
        if (!cancelled) setBlobUrl(URL.createObjectURL(b));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "生成失败"));
    return () => {
      cancelled = true;
      setBlobUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
    };
  }, [open, id]);

  const fetchBlob = async (): Promise<Blob | null> => {
    try {
      const r = await fetch(`/api/market?type=share&id=${encodeURIComponent(id)}`);
      if (!r.ok) return null;
      return await r.blob();
    } catch {
      return null;
    }
  };

  const download = async () => {
    setBusy("download");
    try {
      const blob = await fetchBlob();
      if (!blob) throw new Error("下载失败");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${symbol.toLowerCase()}-track-record.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    setBusy("copy");
    setCopied(false);
    try {
      const blob = await fetchBlob();
      if (!blob) throw new Error("复制失败");
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 剪贴板 API 不可用（非 HTTPS/权限）时降级为下载 */
      await download();
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="生成分享图"
        aria-label="生成分享图"
        className={
          compact
            ? "rounded-[6px_10px_6px_12px] border-[1.5px] border-dashed border-[#2a2230]/60 px-2.5 py-1.5 font-mono text-[11px] text-[#2a2230]/80 transition-all duration-200 hover:border-solid hover:border-[#ff5b3a] hover:text-[#ff5b3a]"
            : "rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-muted transition-all duration-200 hover:border-accent hover:text-accent"
        }
      >
        📤 {compact ? "分享" : "分享"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="modal-pop pointer-events-auto flex max-h-[90vh] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h3 className="text-sm font-semibold text-heading">
                  📤 分享 {symbol} 的 Track Record
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-muted transition-colors hover:text-heading"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
              {/* 固定比例容器：加载前后占位一致，图片不跳动 */}
              <div className="flex-1 overflow-y-auto p-4">
                {error ? (
                  <p className="py-10 text-center text-xs text-red-600 dark:text-red-400">{error}</p>
                ) : (
                  <div className="relative aspect-[1080/1350] w-full overflow-hidden rounded-lg border border-line bg-codebg">
                    {blobUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={blobUrl}
                        alt={`${symbol} Track Record 分享图预览`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 animate-pulse" aria-hidden="true" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-line px-4 py-3">
                <button
                  type="button"
                  onClick={() => void download()}
                  disabled={!!busy}
                  className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-50"
                >
                  {busy === "download" ? "下载中…" : "⬇ 下载图片"}
                </button>
                <button
                  type="button"
                  onClick={() => void copy()}
                  disabled={!!busy}
                  className="flex-1 rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {busy === "copy" ? "复制中…" : copied ? "✓ 已复制" : "📋 复制图片"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

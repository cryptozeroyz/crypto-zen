"use client";

/**
 * ShareCallButton.tsx —— Track Record 分享按钮
 * 流程：点击 → 先拉取服务端生成的 1080×1350 PNG → 弹窗（Portal 挂到 body，
 * 避免卡片 transform 祖先导致 fixed 弹窗抖动）→ 下载 / 复制复用同一份 blob。
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ShareCallButton({
  id,
  symbol,
  compact = false,
}: {
  id: string;
  symbol: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const makeUrl = (b: Blob) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(b);
    blobUrlRef.current = url;
    return url;
  };

  /* 点击：先取图，成功后开弹窗（图片已就绪，无骨架跳动） */
  const openShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/market?type=share&id=${encodeURIComponent(id)}`);
      if (!r.ok) throw new Error("分享图生成失败");
      const b = await r.blob();
      setBlob(b);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分享图生成失败");
      setOpen(true); // 失败也开弹窗展示错误
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    []
  );

  const download = () => {
    if (!blob) return;
    setBusy("download");
    try {
      const url = makeUrl(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${symbol.toLowerCase()}-track-record.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!blob) return;
    setBusy("copy");
    setCopied(false);
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      download(); // 剪贴板不可用时降级下载
    } finally {
      setBusy(null);
    }
  };

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => void openShare(e)}
        disabled={loading}
        title="生成分享图"
        aria-label="生成分享图"
        className={
          compact
            ? "rounded-[6px_10px_6px_12px] border-[1.5px] border-dashed border-[#2a2230]/60 px-2.5 py-1.5 font-mono text-[11px] text-[#2a2230]/80 transition-all duration-200 hover:border-solid hover:border-[#ff5b3a] hover:text-[#ff5b3a] disabled:opacity-60"
            : "rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-muted transition-all duration-200 hover:border-accent hover:text-accent disabled:opacity-60"
        }
      >
        {loading ? "⏳ 生成中…" : "📤 分享"}
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
              onClick={close}
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
                    onClick={close}
                    className="text-muted transition-colors hover:text-heading"
                    aria-label="关闭"
                  >
                    ✕
                  </button>
                </div>
                {/* 固定比例容器：图片已预取，直接呈现，无跳动 */}
                <div className="flex-1 overflow-y-auto p-4">
                  {error ? (
                    <p className="py-10 text-center text-xs text-red-600 dark:text-red-400">{error}</p>
                  ) : blob ? (
                    <div className="relative aspect-[1080/1350] w-full overflow-hidden rounded-lg border border-line bg-codebg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={makeUrl(blob)}
                        alt={`${symbol} Track Record 分享图预览`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2 border-t border-line px-4 py-3">
                  <button
                    type="button"
                    onClick={download}
                    disabled={!!busy || !blob}
                    className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-50"
                  >
                    {busy === "download" ? "下载中…" : "⬇ 下载图片"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copy()}
                    disabled={!!busy || !blob}
                    className="flex-1 rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    {busy === "copy" ? "复制中…" : copied ? "✓ 已复制" : "📋 复制图片"}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

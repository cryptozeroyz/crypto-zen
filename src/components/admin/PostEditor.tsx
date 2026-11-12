"use client";

/**
 * PostEditor.tsx —— 后台文章编辑器（新建 / 编辑共用）
 *
 * 正文使用 @uiw/react-md-editor（Markdown 双栏编辑器）：
 * - 工具栏带「上传图片」按钮（上传到 /api/admin/upload 后插入链接）
 * - 右上角小 / 标准 / 大三档字体切换
 * 研究报告类型额外提供：封面图直接上传（不再是填路径）、DexScreener 链接。
 * 编辑模式传入 initialMarkdown，用 frontmatter.ts 解析出各字段；
 * 保存时重新组装 frontmatter + 正文，整体提交给 API。
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseMarkdown,
  buildMarkdown,
  isValidSlug,
  type FrontmatterFields,
} from "@/lib/frontmatter";

const MarkdownEditor = dynamic(() => import("@/components/admin/MarkdownEditor"), {
  ssr: false,
});

const inputClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent";

const labelClass = "mb-1.5 block text-sm text-muted";

/** 上传图片到后台接口，返回可访问路径 */
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "上传失败，请重试");
  return data.url as string;
}

/* 正文编辑器（Vditor，含图片上传与 Word 导入）与封面上传共用上传接口 */

const FONT_SIZES = [
  { value: 13, label: "小" },
  { value: 14, label: "标准" },
  { value: 16, label: "大" },
] as const;

interface PostEditorProps {
  /** 编辑模式传入原始 Markdown；新建模式不传 */
  initialMarkdown?: string;
  /** 编辑模式的文章 slug（不可改）；新建模式由用户填写 */
  initialSlug?: string;
  /** 编辑模式：是否已存在英文版（决定翻译开关的初始状态） */
  hasEn?: boolean;
}

export default function PostEditor({
  initialMarkdown,
  initialSlug,
  hasEn = false,
}: PostEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(initialSlug);

  const initial = useMemo(
    () => (initialMarkdown ? parseMarkdown(initialMarkdown) : null),
    [initialMarkdown]
  );

  const [slug, setSlug] = useState(initialSlug ?? "");
  const [fields, setFields] = useState<FrontmatterFields>(
    initial?.fields ?? {
      title: "",
      date: new Date().toISOString().slice(0, 10),
      updated: "",
      category: "essay",
      excerpt: "",
      tags: [],
      cover: "",
      dexScreener: "",
      draft: false,
    }
  );
  const [tagsInput, setTagsInput] = useState(
    (initial?.fields.tags ?? []).join(", ")
  );
  const [body, setBody] = useState(initial?.body ?? "");
  const [fontSize, setFontSize] = useState<(typeof FONT_SIZES)[number]["value"]>(14);
  const [coverUploading, setCoverUploading] = useState(false);
  const [dark, setDark] = useState(false);
  const [translate, setTranslate] = useState(hasEn);
  const [translateMsg, setTranslateMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // 跟随全站亮暗主题
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setDark(html.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const set = <K extends keyof FrontmatterFields>(
    key: K,
    value: FrontmatterFields[K]
  ) => setFields((f) => ({ ...f, [key]: value }));

  const onCoverSelect = async (file: File | undefined) => {
    if (!file) return;
    setCoverUploading(true);
    setError("");
    try {
      const url = await uploadFile(file);
      set("cover", url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "封面上传失败");
    } finally {
      setCoverUploading(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanSlug = slug.trim();
    if (!isEdit && !isValidSlug(cleanSlug)) {
      setError("slug 只能包含小写字母、数字和连字符（如 pepe-report）");
      return;
    }
    if (!fields.title.trim()) {
      setError("请填写标题");
      return;
    }
    if (!fields.date) {
      setError("请填写日期");
      return;
    }

    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const markdown = buildMarkdown({ ...fields, tags }, body);
    setSaving(true);
    try {
      const res = isEdit
        ? await fetch(`/api/admin/posts/${initialSlug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markdown }),
          })
        : await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: cleanSlug, markdown }),
          });

      if (res.ok) {
        // 保存成功：按需自动翻译英文版
        if (translate) {
          setTranslateMsg("正在生成英文版（自动翻译）…");
          try {
            const tRes = await fetch("/api/admin/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: isEdit ? initialSlug : cleanSlug }),
            });
            const tData = await tRes.json().catch(() => null);
            if (!tRes.ok) {
              // 中文已保存，但翻译失败：留在编辑器展示原因
              setError(
                `中文已保存，但英文翻译失败：${tData?.message ?? "未知错误"}`
              );
              setTranslateMsg("");
              setSaving(false);
              return;
            }
          } catch {
            setError("中文已保存，但英文翻译请求失败，请稍后重试");
            setTranslateMsg("");
            setSaving(false);
            return;
          }
        }
        router.push("/admin");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "保存失败，请重试");
    } catch {
      setError("网络错误，保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSave} className="space-y-5">
      {/* slug：新建可编辑，编辑模式锁定 */}
      <div>
        <label htmlFor="pe-slug" className={labelClass}>
          Slug（文件名，创建后不可修改）
        </label>
        <input
          id="pe-slug"
          type="text"
          required
          disabled={isEdit}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="例如 pepe-holder-analysis"
          className={`${inputClass} font-mono disabled:opacity-60`}
        />
      </div>

      <div>
        <label htmlFor="pe-title" className={labelClass}>
          标题
        </label>
        <input
          id="pe-title"
          type="text"
          required
          value={fields.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="文章标题"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-category" className={labelClass}>
            分类
          </label>
          <select
            id="pe-category"
            value={fields.category}
            onChange={(e) => {
              const v = e.target.value;
              set("category", v === "research" || v === "ops" ? v : "essay");
            }}
            className={inputClass}
          >
            <option value="essay">个人随笔</option>
            <option value="research">研究报告</option>
            <option value="ops">产品运营</option>
          </select>
        </div>
        <div>
          <label htmlFor="pe-date" className={labelClass}>
            发布日期
          </label>
          <input
            id="pe-date"
            type="date"
            required
            value={fields.date}
            onChange={(e) => set("date", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pe-updated" className={labelClass}>
            更新日期（可选，显示在文章页）
          </label>
          <input
            id="pe-updated"
            type="date"
            value={fields.updated}
            onChange={(e) => set("updated", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="pe-tags" className={labelClass}>
            标签（用逗号分隔）
          </label>
          <input
            id="pe-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="链上分析, 筹码结构"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pe-excerpt" className={labelClass}>
          摘要（列表页 / SEO 描述）
        </label>
        <textarea
          id="pe-excerpt"
          rows={2}
          value={fields.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          placeholder="一两句话概括这篇文章"
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* 封面上传（仅研究报告） */}
      {fields.category === "research" && (
        <>
          <div>
            <span className={labelClass}>
              封面图（可选：不上传则按标题自动生成品牌封面）
            </span>
            <div className="flex items-start gap-4">
              <label
                htmlFor="pe-cover"
                className={`group relative block aspect-[16/9] w-full max-w-sm cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                  fields.cover
                    ? "border-line"
                    : "border-line hover:border-accent"
                }`}
              >
                {fields.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fields.cover}
                    alt="封面预览"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-6 w-6">
                      <rect x="3" y="5" width="18" height="14" rx="2.5" />
                      <circle cx="8.5" cy="10" r="1.5" />
                      <path d="m5 17 5-4 3.5 3L17 12l3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs">
                      {coverUploading ? "上传中…" : "点击上传封面图"}
                    </span>
                  </span>
                )}
                <input
                  id="pe-cover"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  className="sr-only"
                  disabled={coverUploading}
                  onChange={(e) => onCoverSelect(e.target.files?.[0])}
                />
              </label>
              {fields.cover && (
                <button
                  type="button"
                  onClick={() => set("cover", "")}
                  className="mt-1 text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  移除封面
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="pe-dex" className={labelClass}>
              DexScreener 交易对链接（研报页嵌入 K 线）
            </label>
            <input
              id="pe-dex"
              type="text"
              value={fields.dexScreener}
              onChange={(e) => set("dexScreener", e.target.value)}
              placeholder="https://dexscreener.com/ethereum/0x…"
              className={`${inputClass} font-mono`}
            />
          </div>
        </>
      )}

      {/* 正文：Vditor 编辑器（支持图片上传、Word 导入） */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span id="pe-body" className="text-sm text-muted">
            正文（Markdown，支持工具栏上传图片 / 导入 Word）
          </span>
          {/* 字号切换 */}
          <div className="flex items-center gap-1 rounded-full border border-line p-0.5" role="group" aria-label="编辑器字号">
            {FONT_SIZES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFontSize(f.value)}
                aria-pressed={fontSize === f.value}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  fontSize === f.value
                    ? "bg-accent font-medium text-white"
                    : "text-muted hover:text-heading"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className={`mdfs-${fontSize} overflow-hidden rounded-xl border border-line`}>
          <MarkdownEditor initialValue={body} onChange={setBody} dark={dark} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={translate}
            onChange={(e) => setTranslate(e.target.checked)}
            className="h-4 w-4 accent-[#176f68]"
          />
          同时生成英文版（保存后自动翻译，存为 content/posts-en）
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={fields.draft}
            onChange={(e) => set("draft", e.target.checked)}
            className="h-4 w-4 accent-[#176f68]"
          />
          存为草稿（不会在网站上显示）
        </label>
      </div>

      {translateMsg && (
        <p className="text-sm text-accent dark:text-accent-mint">{translateMsg}</p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {saving ? "保存中…" : isEdit ? "保存修改" : "创建文章"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-lg border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
        >
          取消
        </button>
      </div>
    </form>
  );
}

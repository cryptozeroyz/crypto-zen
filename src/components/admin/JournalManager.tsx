"use client";

/**
 * JournalManager.tsx —— 研究日志后台
 * 碎片研究记录：选币 → 打主题标签 → 写正文（可选判断/风险）。
 * 与 why-tags 独立：这是主题标签（筹码/鲸鱼/情绪…），自由输入逗号分隔。
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface JournalRow {
  id: string;
  date: string;
  tokens: string[];
  tags: string[];
  title: string;
  body: string;
  thesis?: string;
  risks?: string;
}

const inputCls =
  "w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:border-accent";

export default function JournalManager({
  entries,
  coins,
}: {
  entries: JournalRow[];
  coins: Array<{ symbol?: string; address: string; name?: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tokens, setTokens] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [thesis, setThesis] = useState("");
  const [risks, setRisks] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setId("");
    setDate(new Date().toISOString().slice(0, 10));
    setTokens([]);
    setTagsInput("");
    setTitle("");
    setBody("");
    setThesis("");
    setRisks("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id || undefined,
          date,
          tokens,
          tags: tagsInput.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          title,
          body,
          thesis,
          risks,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "保存失败");
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setBusy(false);
    }
  };

  const edit = (j: JournalRow) => {
    setId(j.id);
    setDate(j.date);
    setTokens(j.tokens);
    setTagsInput(j.tags.join(", "));
    setTitle(j.title);
    setBody(j.body);
    setThesis(j.thesis ?? "");
    setRisks(j.risks ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (jid: string) => {
    if (!window.confirm("删除这条研究日志？")) return;
    setError("");
    try {
      const res = await fetch("/api/admin/journal", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jid }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => null))?.message ?? "删除失败");
        return;
      }
      if (id === jid) reset();
      router.refresh();
    } catch {
      setError("网络错误");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="grid gap-3.5 rounded-xl border border-line bg-paper p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-heading outline-none focus:border-accent"
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs text-muted">短标题（可空）</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="一句话概括这条观察" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">关联代币（点选，会出现在该币的时间线）</label>
          <div className="flex flex-wrap gap-1.5">
            {coins.map((c) => (
              <button
                key={c.address}
                type="button"
                onClick={() =>
                  setTokens((ts) =>
                    ts.includes(c.symbol ?? c.address)
                      ? ts.filter((x) => x !== (c.symbol ?? c.address))
                      : [...ts, c.symbol ?? c.address]
                  )
                }
                aria-pressed={tokens.includes(c.symbol ?? c.address)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  tokens.includes(c.symbol ?? c.address)
                    ? "border-accent bg-accent/10 font-medium text-accent dark:text-accent-mint"
                    : "border-line text-muted hover:border-heading hover:text-heading"
                }`}
              >
                {c.symbol ?? c.address.slice(0, 6)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">主题标签（逗号分隔）</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="筹码, 鲸鱼, 情绪" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:col-span-1">
            <div>
              <label className="mb-1 block text-xs text-muted">判断（可选）</label>
              <input value={thesis} onChange={(e) => setThesis(e.target.value)} placeholder="我的判断" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">风险（可选）</label>
              <input value={risks} onChange={(e) => setRisks(e.target.value)} placeholder="主要风险" className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">正文（Markdown）</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder={"碎片观察、待验证假设、链上数据速记…\n例：前 10 地址持仓占比 61%，其中 3 个地址过去 48h 净流入"}
            className={`${inputCls} resize-y`}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {id && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-heading hover:text-heading"
            >
              取消编辑
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
          >
            {busy ? "保存中…" : id ? "保存修改" : "＋ 记一条"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="space-y-2.5">
        {entries.map((j) => (
          <article key={j.id} className="rounded-2xl border border-line bg-card px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="tabular-nums">{j.date}</span>
              {j.tokens.map((t) => (
                <span key={t} className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent dark:text-accent-mint">${t}</span>
              ))}
              {j.tags.map((t) => (
                <span key={t} className="rounded-full bg-codebg px-2 py-0.5">{t}</span>
              ))}
              <span className="ml-auto flex gap-3">
                <button type="button" onClick={() => edit(j)} className="text-accent hover:underline dark:text-accent-mint">编辑</button>
                <button type="button" onClick={() => void remove(j.id)} className="text-red-600 hover:underline dark:text-red-400">删除</button>
              </span>
            </div>
            {j.title && <h3 className="mt-1.5 font-semibold text-heading">{j.title}</h3>}
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{j.body}</p>
            {(j.thesis || j.risks) && (
              <p className="mt-2 text-xs text-muted">
                {j.thesis && <span><b className="text-heading">判断：</b>{j.thesis}　</span>}
                {j.risks && <span><b className="text-heading">风险：</b>{j.risks}</span>}
              </p>
            )}
          </article>
        ))}
        {entries.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            还没有研究日志。碎片想法先记下来，攒够了再写成研报。
          </p>
        )}
      </div>
    </div>
  );
}

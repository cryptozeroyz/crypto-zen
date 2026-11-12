"use client";

/**
 * MarkdownEditor.tsx —— 基于 Vditor 的所见即所得 Markdown 编辑器
 *
 * - IR（即时渲染）模式，写作体验接近飞书/语雀
 * - 工具栏自带图片上传（走 /api/admin/upload）
 * - 工具栏「导入 Word」：.docx 自动解析为 Markdown，
 *   内嵌图片自动上传到网站并替换为链接
 * - 跟随全站亮暗主题
 */

import { useEffect, useRef, useState } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import mammoth from "mammoth/mammoth.browser";
import TurndownService from "turndown";

interface MarkdownEditorProps {
  /** 初始 Markdown（编辑模式传入） */
  initialValue?: string;
  /** 内容变化回调（用于保存） */
  onChange: (markdown: string) => void;
  dark: boolean;
}

const WORD_ICON =
  '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 2a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm9 0v3h3l-3-3ZM5 8.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm1.5 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm1-.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm1.5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm.5-1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm.5 1.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/></svg>';

export default function MarkdownEditor({
  initialValue,
  onChange,
  dark,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const vditorRef = useRef<Vditor | null>(null);
  const onChangeRef = useRef(onChange);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  onChangeRef.current = onChange;

  /* 初始化 Vditor（仅一次） */
  useEffect(() => {
    if (!hostRef.current) return;

    const vditor = new Vditor(hostRef.current, {
      lang: "zh_CN",
      mode: "ir",
      height: 420,
      minHeight: 280,
      value: initialValue ?? "",
      theme: dark ? "dark" : "classic",
      preview: {
        theme: { current: dark ? "dark" : "light" },
      },
      cache: { enable: false },
      placeholder: "用 Markdown 写作，或点击工具栏右侧的「导入 Word」…",
      toolbar: [
        "emoji",
        "headings",
        "bold",
        "italic",
        "strike",
        "|",
        "list",
        "ordered-list",
        "check",
        "quote",
        "code",
        "inline-code",
        "|",
        "upload",
        "link",
        "table",
        "|",
        "undo",
        "redo",
        "|",
        "edit-mode",
        "preview",
        "fullscreen",
        "outline",
        "|",
        {
          name: "word-import",
          tip: "导入 Word 文档（.docx）",
          icon: WORD_ICON,
          click: () => fileRef.current?.click(),
        },
      ],
      /* 图片上传：把本站接口的返回格式转成 Vditor 期望的格式 */
      upload: {
        url: "/api/admin/upload",
        fieldName: "file",
        accept: "image/*",
        format: (_files, responseText) => {
          try {
            const res = JSON.parse(responseText);
            if (res.ok) {
              const name = String(res.url).split("/").pop() ?? "image";
              return JSON.stringify({
                code: 0,
                msg: "",
                data: { errFiles: [], succMap: { [name]: res.url } },
              });
            }
            return JSON.stringify({
              code: 1,
              msg: res.message ?? "上传失败",
              data: { errFiles: [], succMap: {} },
            });
          } catch {
            return JSON.stringify({
              code: 1,
              msg: "上传响应解析失败",
              data: { errFiles: [], succMap: {} },
            });
          }
        },
      },
      input: (value) => onChangeRef.current(value),
      after: () => {
        vditorRef.current = vditor;
      },
    });

    return () => {
      vditorRef.current = null;
      try {
        vditor.destroy();
      } catch {
        /* 已销毁时忽略 */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 跟随主题 */
  useEffect(() => {
    vditorRef.current?.setTheme(
      dark ? "dark" : "classic",
      dark ? "dark" : "light",
      dark ? "dracula" : "github"
    );
  }, [dark]);

  /* 导入 Word：docx → HTML → Markdown，内嵌图片自动上传 */
  const importWord = async (file: File) => {
    const vditor = vditorRef.current;
    if (!vditor) return;

    const current = vditor.getValue().trim();
    if (
      current &&
      !window.confirm("导入会覆盖当前正文内容（可先手动复制备份），确定继续吗？")
    ) {
      return;
    }

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            try {
              const base64 = await image.readAsBase64String();
              const res = await fetch("/api/admin/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  dataBase64: base64,
                  contentType: image.contentType || "image/png",
                }),
              });
              const data = await res.json();
              if (data.ok) return { src: data.url };
            } catch {
              /* 单张图失败不阻塞整体导入 */
            }
            return { src: "" };
          }),
        }
      );

      const turndown = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
      });
      const markdown = turndown
        .turndown(result.value)
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      vditor.setValue(markdown);
      onChangeRef.current(markdown);
    } catch (e) {
      window.alert(
        `Word 文档解析失败：${e instanceof Error ? e.message : e}\n请确认上传的是 .docx 格式（旧版 .doc 请先另存为 .docx）`
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="relative">
      {/* Word 文件选择（由工具栏按钮触发） */}
      <input
        ref={fileRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        disabled={importing}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void importWord(f);
        }}
      />
      <div ref={hostRef} />
      {importing && (
        <p className="mt-2 text-xs text-accent dark:text-accent-mint">
          正在解析 Word 文档（内嵌图片会自动上传）…
        </p>
      )}
    </div>
  );
}

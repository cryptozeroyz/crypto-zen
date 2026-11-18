/**
 * FlowerFloat.tsx —— 「送一朵花」浮动小部件
 *
 * 固定在页面右下角的胶囊浮标：🌸 + 全局鲜花计数。
 * 点击后触发一小簇烟花 + 一朵飘起的小花，计数 +1（可无限次点）。
 *
 * 计数策略（乐观 UI + 批量持久化）：
 * - 点击立即在本地 +1 并播放动效，不等待网络；
 * - 攒够 3 朵或 45 秒后用 POST /api/flowers 一次性上报
 *   （服务端写 GitHub = 一次提交 = 一次部署，必须批量）；
 * - 页面隐藏/关闭时用 sendBeacon 兜底上报剩余的数量；
 * - 上报失败不清零，下个周期带着累计数量重试。
 *
 * 动效：一个全屏 pointer-events-none 的 canvas 画粒子烟花，
 * 外加一个 DOM 元素做 🌸 上浮动画。prefers-reduced-motion 时只加计数。
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface FlowerFloatProps {
  sendLabel: string;
  receivedLabel: string;
}

/* ---------------- 烟花粒子 ---------------- */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
  decay: number;
  size: number;
  color: string;
}

const SPARK_COLORS = ["#3B82F6", "#22D3EE", "#D8B56D", "#F472B6", "#93C5FD"];

function spawnBurst(canvas: HTMLCanvasElement, cx: number, cy: number): Particle[] {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.scale(dpr, dpr);

  const parts: Particle[] = [];
  const n = 12 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const speed = 1.6 + Math.random() * 2.2;
    parts.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.6,
      life: 1,
      decay: 0.02 + Math.random() * 0.015,
      size: 1.5 + Math.random() * 2,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    });
  }
  return parts;
}

function startFirework(canvas: HTMLCanvasElement, x: number, y: number): void {
  let particles = spawnBurst(canvas, x, y);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((p) => p.life > 0);
    if (particles.length === 0) return;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045; // 轻微重力
      p.vx *= 0.985;
      p.life -= p.decay;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------------- 组件 ---------------- */

export default function FlowerFloat({ sendLabel, receivedLabel }: FlowerFloatProps) {
  const [serverCount, setServerCount] = useState(0);
  const [pending, setPending] = useState(0);
  const [burst, setBurst] = useState(0); // 自增触发按钮脉冲动画
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floatLayerRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(0); // 供 interval / pagehide 闭包读取最新值
  const flushingRef = useRef(false);

  const total = serverCount + pending;

  /* 上报 accumulated 数量；成功后服务端总数为准 */
  const flush = useCallback(async () => {
    const add = pendingRef.current;
    if (add <= 0 || flushingRef.current) return;
    flushingRef.current = true;
    try {
      const res = await fetch("/api/flowers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add }),
      });
      if (res.ok) {
        const data = (await res.json()) as { count: number };
        pendingRef.current = 0;
        setPending(0);
        setServerCount(data.count);
      }
    } catch {
      /* 网络失败：保留 pending，下轮重试 */
    } finally {
      flushingRef.current = false;
    }
  }, []);

  /* 初始读取 + 定时兜底上报 + 关闭页面 sendBeacon 兜底 */
  useEffect(() => {
    fetch("/api/flowers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { count: number }) => setServerCount(d.count))
      .catch(() => {});

    const timer = setInterval(() => {
      if (pendingRef.current > 0) void flush();
    }, 45_000);

    const onHide = () => {
      const add = pendingRef.current;
      if (add > 0) {
        navigator.sendBeacon?.(
          "/api/flowers",
          new Blob([JSON.stringify({ add })], { type: "application/json" })
        );
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flush]);

  /* 点击：本地 +1、烟花、飘花，攒够 3 朵即上报 */
  const onClick = () => {
    (window as unknown as { umami?: { track: (e: string) => void } }).umami?.track("送花");
    pendingRef.current += 1;
    setPending(pendingRef.current);
    setBurst((b) => b + 1);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const btn = btnRef.current;
    if (!reduced && btn) {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      if (canvasRef.current) startFirework(canvasRef.current, cx, cy);

      // 一朵 🌸 从按钮处上浮消散
      const layer = floatLayerRef.current;
      if (layer) {
        const petal = document.createElement("span");
        petal.textContent = "🌸";
        petal.setAttribute("aria-hidden", "true");
        petal.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;font-size:18px;pointer-events:none;transform:translate(-50%,-50%);`;
        layer.appendChild(petal);
        petal.animate(
          [
            { transform: "translate(-50%,-50%) scale(0.6)", opacity: 1 },
            { transform: "translate(-50%,-160%) scale(1.15)", opacity: 0 },
          ],
          { duration: 900, easing: "cubic-bezier(.2,.7,.3,1)" }
        ).onfinish = () => petal.remove();
      }
    }

    if (pendingRef.current >= 3) void flush();
  };

  return (
    <>
      {/* 烟花画布：全屏覆盖但完全不挡交互 */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[70] h-full w-full print:hidden"
      />
      {/* 🌸 上浮动画层 */}
      <div
        ref={floatLayerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[70] print:hidden"
      />

      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        aria-label={`${receivedLabel} ${total}，${sendLabel}`}
        title={`${receivedLabel} ${total} · ${sendLabel}`}
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-1.5 rounded-full border border-accent/30 bg-card/90 px-3.5 py-2 text-sm shadow-lg backdrop-blur transition-all duration-200 hover:border-accent/60 hover:shadow-[0_0_16px_rgba(37,99,235,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg print:hidden motion-safe:animate-[float-y-soft_3.5s_ease-in-out_infinite]"
      >
        <span aria-hidden="true" className="text-base transition-transform duration-200 group-hover:scale-125">
          🌸
        </span>
        <span className="font-medium tabular-nums text-heading">{total}</span>
        <span className="sr-only">{sendLabel}</span>
        {/* 点击脉冲反馈：key 变化重放动画 */}
        {burst > 0 && (
          <span
            key={burst}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border border-accent/60 motion-safe:animate-[flower-ping_0.5s_ease-out_forwards]"
          />
        )}
      </button>
    </>
  );
}

"use client";

/**
 * NowPlaying.tsx —— 「最近在听 / 现在在做什么」
 *
 * 两种数据源（纯前端 + 60 秒定时刷新）：
 * 1. Last.fm：siteConfig.lastfm 配置了 user + apiKey 时，
 *    拉取最近曲目（@attr.nowplaying 区分「正在听」）；
 * 2. 回退：读取 /status.json（public 目录下的静态文件，
 *    直接在 GitHub 上编辑该文件即可更新状态，约 1 分钟上线）。
 *
 * 两者都不可用时整个组件不渲染。
 */

import { useEffect, useState } from "react";

interface NowPlayingProps {
  lastfm?: { user: string; apiKey: string };
  labels: { listening: string; recent: string; now: string };
}

type State =
  | { kind: "track"; track: string; artist: string; url?: string; live: boolean }
  | { kind: "status"; text: string; updatedAt?: string }
  | null;

function Equalizer({ className = "h-3" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex items-end gap-[2px] ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-sm bg-accent dark:bg-accent-mint"
          style={{ animationDelay: `${i * 0.22}s` }}
        />
      ))}
    </span>
  );
}

export default function NowPlaying({ lastfm, labels }: NowPlayingProps) {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/status.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return false;
        const json = (await res.json()) as { text?: string; updatedAt?: string };
        if (!json.text) return false;
        if (!cancelled) setState({ kind: "status", text: json.text, updatedAt: json.updatedAt });
        return true;
      } catch {
        return false;
      }
    };

    const loadLastfm = async (): Promise<boolean> => {
      if (!lastfm?.user || !lastfm?.apiKey) return false;
      try {
        const url =
          "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
          `&user=${encodeURIComponent(lastfm.user)}&api_key=${lastfm.apiKey}` +
          "&format=json&limit=1";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return false;
        const json = (await res.json()) as {
          recenttracks?: { track?: Array<{
            name?: string;
            artist?: { "#text"?: string };
            url?: string;
            "@attr"?: { nowplaying?: string };
          }> };
        };
        const track = json.recenttracks?.track?.[0];
        if (!track?.name) return false;
        if (!cancelled)
          setState({
            kind: "track",
            track: track.name,
            artist: track.artist?.["#text"] ?? "",
            url: track.url,
            live: track["@attr"]?.nowplaying === "true",
          });
        return true;
      } catch {
        return false;
      }
    };

    const load = async () => {
      const ok = await loadLastfm();
      if (!ok) await loadStatus();
    };

    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [lastfm?.user, lastfm?.apiKey]);

  if (!state) return null;

  if (state.kind === "status") {
    return (
      <p className="mt-5 flex items-center gap-2 text-sm text-muted">
        <span aria-hidden="true">💬</span>
        <span>
          <span className="mr-1.5 font-medium text-heading">{labels.now}</span>
          {state.text}
        </span>
      </p>
    );
  }

  const inner = (
    <>
      {state.live ? <Equalizer /> : <span aria-hidden="true">🎧</span>}
      <span className="truncate">
        <span className="mr-1.5 font-medium text-heading">
          {state.live ? labels.listening : labels.recent}
        </span>
        {state.track}
        {state.artist && <span className="text-muted"> — {state.artist}</span>}
      </span>
    </>
  );

  return (
    <p className="mt-5 flex min-w-0 items-center gap-2 text-sm text-muted">
      {state.url ? (
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2 transition-colors hover:text-heading"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </p>
  );
}

/**
 * [locale]/page.tsx —— 首页（sabanna 手绘风单页）
 * 打字机 Hero → 方程式跑马灯 → 01/Track Record 关注卡 → 02/Writing 文章
 * → 03/Resources 推荐 → 好运签 CTA → 理念区。
 */

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import NewsMarquee from "@/components/NewsMarquee";
import HomeWatchlist from "@/components/dashboard/HomeWatchlist";
import ArticlesSection from "@/components/ArticlesSection";
import TypewriterHero from "@/components/TypewriterHero";
import { getAllPosts } from "@/lib/posts";
import { getLinks } from "@/lib/links";
import { fetchWatchlistWithData } from "@/lib/watchlist";
import { getJournal } from "@/lib/journal";
import { fetchEqnNews } from "@/lib/eqn";
import { fetchGeckoOhlcv } from "@/lib/gecko";
import { HERO_LOGOS } from "@/lib/coin-images";
import { siteConfig } from "@/lib/siteConfig";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  const posts = getAllPosts(locale);
  const links = getLinks();
  const [wl, news] = await Promise.all([
    fetchWatchlistWithData(),
    fetchEqnNews(3),
  ]);
  const coins = wl.coins;

  /* 投研活跃度：日志 + 关联研报 + 时间线后续事件（首页优先展示有动态更新的币） */
  const journal = getJournal();
  const allPosts = getAllPosts(locale);
  const activities: Record<string, { latest: string; newCount: number }> = {};
  /** 每个币最新一条研究日志（卡片上展示） */
  const logs: Record<string, { date: string; title: string; body: string } | null> = {};
  const matchTokens = (c: (typeof coins)[number], tks: string[]) =>
    tks.some((t) => {
      const s = t.trim().toLowerCase();
      return (
        s.length > 0 &&
        (s === (c.symbol ?? "").toLowerCase() || s === c.address.toLowerCase())
      );
    });
  for (const c of coins) {
    if (c.status === "exited") continue;
    const j = journal.filter((e) => matchTokens(c, e.tokens));
    const p = allPosts.filter((pt) => matchTokens(c, pt.tokens ?? []));
    const laterEvents = (c.events ?? []).slice(1);
    const newCount = j.length + p.length + laterEvents.length;
    /* 最近动态日期：建立关注本身就是一次动态，新币据此优先展示 */
    const latest = [
      c.addedAt,
      ...j.map((x) => x.date),
      ...p.map((x) => x.date),
      ...laterEvents.map((e) => e.date),
    ].sort().pop() as string;
    activities[c.address] = { latest, newCount };
    const newest = j[0] ?? null; // journal 已按日期倒序
    logs[c.address] = newest
      ? { date: newest.date, title: newest.title, body: newest.body }
      : null;
  }

  /* 首页只展示最近有动态的前 2 个币，并预取 24H 走势（收盘序列，时间正序） */
  const topCoins = coins
    .filter((c) => c.data)
    .sort(
      (a, b) =>
        (activities[b.address]?.latest ?? "").localeCompare(
          activities[a.address]?.latest ?? ""
        )
    )
    .slice(0, 2);
  const sparks: Record<string, number[]> = {};
  await Promise.all(
    topCoins.map(async (c) => {
      if (!c.data?.pairAddress) return;
      sparks[c.address] = await fetchGeckoOhlcv(
        c.data.chainId,
        c.data.pairAddress,
        "24H"
      ).catch(() => []);
    })
  );

  return (
    <div className="home-paper">
      <TypewriterHero locale={locale} />
        {/* 快讯跑马灯（点击进入 /news） */}
        <Container>
          <NewsMarquee items={news} href={`/${locale}/news`} />
        </Container>

      {/* ============ Track Record（最近 2 个关注 + 看板入口，完整看板见 /dashboard） ============ */}
      {topCoins.length > 0 && (
        <section id="watchlist" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <div className="home-sh"><span className="no">01 / </span>Track Record</div>
            <div className="mt-5">
              <HomeWatchlist coins={topCoins} locale={locale} t={t} activities={activities} logs={logs} sparks={sparks} />
            </div>
          </Container>
        </section>
      )}


      {/* ============ 文章 ============ */}
      <section id="articles" className="scroll-mt-24">
        <Container className="py-7 sm:py-8">
          <div className="home-sh"><span className="no">02 / </span>Writing</div>
          <div className="mt-5">
            <ArticlesSection posts={posts.slice(0, 2)} locale={locale} t={t} />
          <div className="mt-6 flex justify-center gap-4">
            <a href={`/${locale}/writing`} className="rounded-full border-2 border-dashed border-[#2a2230] bg-white px-6 py-2.5 font-mono text-[13px] text-[#2a2230] transition-all hover:border-solid hover:border-[#ff5b3a] hover:text-[#ff5b3a]">More writings →</a>
          </div>
          </div>
        </Container>
      </section>

      {/* ============ 好物精选（首页 3+1，全集见 /resources） ============ */}
      {links.length > 0 && (
        <section id="links" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <div className="home-sh"><span className="no">03 / </span>Resources</div>
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {links.slice(0, 3).map((l) => (
                <Link
                  key={l.url}
                  href={`/${locale}/resources`}
                  className="group flex flex-col overflow-hidden rounded-[4px_18px_4px_22px] border-[1.5px] border-dashed border-[#2a2230] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
                >
                  <div className="flex aspect-[16/9] items-center justify-center bg-codebg px-4">
                    <span className="min-w-0 truncate text-sm font-semibold text-heading transition-colors group-hover:text-accent dark:group-hover:text-accent-mint">
                      {l.type === "file" ? "📄 " : l.type === "book" ? "📖 " : l.type === "goods" ? "🎒 " : "🔧 "}
                      {l.title}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">
                      {l.comment}
                    </p>
                  </div>
                </Link>
              ))}

              {/* 第 4 张：查看全部（Track Record 3+1 同款入口卡） */}
              <Link
                href={`/${locale}/resources`}
                className="group flex min-h-[180px] flex-col rounded-[16px_20px_14px_22px] border-[1.5px] border-dashed border-[#5c2a52] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]"
              >
                <div className="font-serif text-[17px] font-bold text-[#5c2a52]">
                  {locale === "zh" ? "好物推荐" : "Resources"}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {locale === "zh"
                    ? "读过的书、用过的工具、踩过的坑。"
                    : "Books, tools and hard-earned lessons."}
                </p>
                <div className="mt-auto w-full border-t border-dashed border-[#2a2230]/25 pt-3">
                  <span className="inline-block font-mono text-[12px] text-[#ff5b3a] transition-transform duration-200 group-hover:translate-x-1">
                    {locale === "zh" ? "查看全部" : "View all"} →
                  </span>
                </div>
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* ============ 关于我 ============ */}

      <section className="home-philo"><div className="mx-auto max-w-[860px] px-6 py-20 text-center"><div className="font-serif text-[clamp(30px,5vw,48px)] font-bold leading-[1.3] text-[#5c2a52]">Stay curious.<br/>Stay skeptical.</div><p className="mt-5 text-[13px] tracking-[.1em] text-[#2a2230]/70">保持好奇 · 保持怀疑 · An Operator. A Trader. An Observer.</p></div></section>
    </div>
  );
}

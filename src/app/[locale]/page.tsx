/**
 * [locale]/page.tsx —— 首页（单页架构）
 * Hero（+实时行情/最近在听）→ 关注列表 → 文章 → 继续阅读 → 好物精选
 * → 关于我 → 找到我。
 */

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import MemeHeroArt from "@/components/MemeHeroArt";
import SectionHead from "@/components/SectionHead";
import NewsMarquee from "@/components/NewsMarquee";
import NewsList from "@/components/NewsList";
import SocialLinks from "@/components/SocialLinks";
import HomeWatchlist from "@/components/dashboard/HomeWatchlist";
import ArticlesSection from "@/components/ArticlesSection";
import RandomPostButton from "@/components/RandomPostButton";
import NowPlaying from "@/components/NowPlaying";
import PriceTicker from "@/components/PriceTicker";
import TypewriterHero from "@/components/TypewriterHero";
import { getAllPosts } from "@/lib/posts";
import { getLinks } from "@/lib/links";
import { fetchWatchlistWithData } from "@/lib/watchlist";
import { getJournal } from "@/lib/journal";
import { fetchEqnNews } from "@/lib/eqn";
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
  for (const c of coins) {
    if (c.status === "exited") continue;
    const sym = (c.symbol ?? "").toLowerCase();
    const addr = c.address.toLowerCase();
    const match = (tks: string[]) =>
      tks.some((t) => {
        const s = t.trim().toLowerCase();
        return s.length > 0 && (s === sym || s === addr);
      });
    const j = journal.filter((e) => match(e.tokens));
    const p = allPosts.filter((pt) => match(pt.tokens ?? []));
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
  }

  return (
    <div className="home-paper">
      <TypewriterHero locale={locale} />
        {/* 快讯跑马灯（点击进入 /news） */}
        <Container>
          <NewsMarquee items={news} href={`/${locale}/news`} />
        </Container>

      {/* ============ 关注列表（精简 Top4，完整看板见 /dashboard） ============ */}
      {coins.length > 0 && (
        <section id="watchlist" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <div className="home-sh"><span className="no">01 / </span>Track Record</div>
            <div className="mt-5">
              <HomeWatchlist coins={coins} locale={locale} t={t} activities={activities} />
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

      {/* ============ 好物精选（全集见 /resources） ============ */}
      {links.length > 0 && (
        <section id="links" className="scroll-mt-24">
          <Container className="py-7 sm:py-8">
            <div className="home-sh"><span className="no">03 / </span>Resources</div>
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {links.slice(0, 4).map((l) => (
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
            </div>
          </Container>
        </section>
      )}

      {/* ============ 关于我 ============ */}

      <section className="mx-auto w-full max-w-[860px] px-6 pb-4">
        <a href={`/${locale}/alpha`} className="block rounded-[14px_18px_12px_20px] border-[1.5px] border-dashed border-[#5c2a52] bg-white px-6 py-8 text-center transition-all hover:-translate-y-1 hover:border-solid hover:border-[#ff5b3a] hover:shadow-[6px_8px_0_rgba(92,42,82,.12)]">
          <div className="font-serif text-[22px] font-bold text-[#5c2a52]">🎐 Daily Alpha · 每日好运签</div>
          <div className="mt-1 font-mono text-[12px] text-[#ff5b3a]">一天一签 · 抽取今日份 Crypto 好运 →</div>
        </a>
      </section>
      <section className="home-philo"><div className="mx-auto max-w-[860px] px-6 py-20 text-center"><div className="font-serif text-[clamp(30px,5vw,48px)] font-bold leading-[1.3] text-[#5c2a52]">Stay curious.<br/>Stay skeptical.</div><p className="mt-5 text-[13px] tracking-[.1em] text-[#2a2230]/70">保持好奇 · 保持怀疑 · An Operator. A Trader. An Observer.</p><p className="mx-auto mt-10 max-w-[460px] rotate-[-1deg] rounded-[16px_4px_16px_4px] border-[1.5px] border-dashed border-[#ff5b3a] px-5 py-4 font-serif text-[13px] italic text-[#2a2230]">“如果你不能笑着面对这个市场，你迟早会被它气死。”</p></div></section>
    </div>
  );
}

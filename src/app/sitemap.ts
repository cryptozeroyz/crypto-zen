/**
 * sitemap.ts —— 自动生成 sitemap.xml（含中英 alternates 互指）
 */

import fs from "fs";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { getAllPosts } from "@/lib/posts";
import { safeTokenSlug } from "@/lib/coin-format";

/* 不收录：/news（noindex 聚合页）、/bookmarks（私人收藏）、/admin（后台） */
const PAGES = ["", "/dashboard", "/writing", "/topics", "/alpha", "/resources", "/about"];

/** 代币 symbol 与叙事主题（构建期读取 calls.json，缺失则不包含） */
function callMeta(): { symbols: string[]; topics: string[] } {
  try {
    const raw = fs.readFileSync("content/calls.json", "utf8");
    const list = JSON.parse(raw) as Array<{ call?: { symbol?: string; narrativeType?: string } }>;
    return {
      symbols: [...new Set(list.map((r) => (r?.call?.symbol ? safeTokenSlug(r.call.symbol) : null)).filter((x): x is string => Boolean(x)))],
      topics: [...new Set(list.map((r) => r?.call?.narrativeType).filter((x): x is string => Boolean(x)))],
    };
  } catch {
    return { symbols: [], topics: [] };
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const zhPosts = getAllPosts("zh");
  const enPosts = getAllPosts("en");

  const pageEntries: MetadataRoute.Sitemap = PAGES.flatMap((p) => [
    {
      url: `${siteConfig.url}/zh${p}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: p === "" ? 1 : 0.7,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh${p}`,
          en: `${siteConfig.url}/en${p}`,
          "x-default": `${siteConfig.url}/zh${p}`,
        },
      },
    },
    {
      url: `${siteConfig.url}/en${p}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: p === "" ? 1 : 0.7,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh${p}`,
          en: `${siteConfig.url}/en${p}`,
          "x-default": `${siteConfig.url}/zh${p}`,
        },
      },
    },
  ]);

  const postEntries: MetadataRoute.Sitemap = [
    ...zhPosts.map((post) => ({
      url: `${siteConfig.url}/zh/writing/${post.slug}`,
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/writing/${post.slug}`,
          en: `${siteConfig.url}/en/writing/${post.slug}`,
        },
      },
    })),
    ...enPosts.map((post) => ({
      url: `${siteConfig.url}/en/writing/${post.slug}`,
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/writing/${post.slug}`,
          en: `${siteConfig.url}/en/writing/${post.slug}`,
        },
      },
    })),
  ];

  const { symbols, topics } = callMeta();
  const tokenEntries: MetadataRoute.Sitemap = symbols.flatMap((slug) => [
    {
      url: `${siteConfig.url}/zh/token/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/token/${slug}`,
          en: `${siteConfig.url}/en/token/${slug}`,
          "x-default": `${siteConfig.url}/zh/token/${slug}`,
        },
      },
    },
    {
      url: `${siteConfig.url}/en/token/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/token/${slug}`,
          en: `${siteConfig.url}/en/token/${slug}`,
          "x-default": `${siteConfig.url}/zh/token/${slug}`,
        },
      },
    },
  ]);

  const topicEntries: MetadataRoute.Sitemap = topics.flatMap((topic) => [
    {
      url: `${siteConfig.url}/zh/topics/${topic}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/topics/${topic}`,
          en: `${siteConfig.url}/en/topics/${topic}`,
          "x-default": `${siteConfig.url}/zh/topics/${topic}`,
        },
      },
    },
    {
      url: `${siteConfig.url}/en/topics/${topic}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/topics/${topic}`,
          en: `${siteConfig.url}/en/topics/${topic}`,
          "x-default": `${siteConfig.url}/zh/topics/${topic}`,
        },
      },
    },
  ]);

  return [...pageEntries, ...postEntries, ...tokenEntries, ...topicEntries];
}

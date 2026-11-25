/**
 * sitemap.ts —— 自动生成 sitemap.xml（含中英 alternates 互指）
 */

import fs from "fs";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { getAllPosts } from "@/lib/posts";

const PAGES = ["", "/dashboard", "/writing", "/news", "/alpha", "/resources", "/about", "/bookmarks"];

/** Track Record 详情 id（构建期读取 calls.json，缺失则不包含） */
function callIds(): string[] {
  try {
    const raw = fs.readFileSync("content/calls.json", "utf8");
    const list = JSON.parse(raw) as Array<{ call?: { id?: string } }>;
    return list.map((r) => r?.call?.id).filter((x): x is string => Boolean(x));
  } catch {
    return [];
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
      lastModified: new Date(post.date),
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
      lastModified: new Date(post.date),
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

  const callEntries: MetadataRoute.Sitemap = callIds().flatMap((id) => [
    {
      url: `${siteConfig.url}/zh/dashboard/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/dashboard/${id}`,
          en: `${siteConfig.url}/en/dashboard/${id}`,
          "x-default": `${siteConfig.url}/zh/dashboard/${id}`,
        },
      },
    },
    {
      url: `${siteConfig.url}/en/dashboard/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          zh: `${siteConfig.url}/zh/dashboard/${id}`,
          en: `${siteConfig.url}/en/dashboard/${id}`,
          "x-default": `${siteConfig.url}/zh/dashboard/${id}`,
        },
      },
    },
  ]);

  return [...pageEntries, ...postEntries, ...callEntries];
}

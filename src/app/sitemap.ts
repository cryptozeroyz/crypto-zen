/**
 * sitemap.ts —— 自动生成 sitemap.xml（含中英 alternates 互指）
 */

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { getAllPosts } from "@/lib/posts";

const PAGES = ["", "/dashboard", "/news", "/alpha", "/resources", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  const zhPosts = getAllPosts("zh");
  const enPosts = getAllPosts("en");

  const pageEntries: MetadataRoute.Sitemap = PAGES.flatMap((p) => [
    {
      url: `${siteConfig.url}/zh${p}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: p === "" ? 1 : 0.7,
      alternates: { languages: { zh: `${siteConfig.url}/zh${p}`, en: `${siteConfig.url}/en${p}` } },
    },
    {
      url: `${siteConfig.url}/en${p}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: p === "" ? 1 : 0.7,
      alternates: { languages: { zh: `${siteConfig.url}/zh${p}`, en: `${siteConfig.url}/en${p}` } },
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

  return [...pageEntries, ...postEntries];
}

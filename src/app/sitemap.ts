/**
 * sitemap.ts —— 自动生成 sitemap.xml（Next.js 约定式文件）
 * 中英文两个语言前缀都列出；英文只包含已翻译的文章。
 */

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { getAllPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const zhPosts = getAllPosts("zh");
  const enPosts = getAllPosts("en");
  const enSlugs = new Set(enPosts.map((p) => p.slug));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteConfig.url}/zh`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/zh/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/en/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const postEntries: MetadataRoute.Sitemap = [
    ...zhPosts.map((post) => ({
      url: `${siteConfig.url}/zh/writing/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...enPosts
      .filter((post) => enSlugs.has(post.slug))
      .map((post) => ({
        url: `${siteConfig.url}/en/writing/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];

  return [...staticPages, ...postEntries];
}

/**
 * [locale]/about/page.tsx —— 关于页
 * 自我介绍文案在多语言字典（i18n.ts）中维护。
 */

import type { Metadata } from "next";
import Image from "next/image";
import Container from "@/components/Container";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

interface AboutPageProps {
  params: { locale: string };
}

export function generateMetadata({ params }: AboutPageProps): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);
  return {
    title: t.about.title,
    description: t.meta.description,
    alternates: { canonical: `/${locale}/about` },
  };
}

export default function AboutPage({ params }: AboutPageProps) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "zh";
  const t = getDictionary(locale);

  return (
    <Container size="content" className="py-12 sm:py-16">
      <div className="flex items-center gap-4">
        <Image
          src="/avatar.png"
          alt="Crypto Zen avatar"
          width={64}
          height={64}
          priority
          className="rounded-2xl border border-line"
        />
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          {t.about.title}
        </h1>
      </div>

      <div className="prose mt-8">
        {t.about.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </Container>
  );
}

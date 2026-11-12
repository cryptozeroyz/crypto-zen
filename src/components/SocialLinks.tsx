/**
 * SocialLinks.tsx —— 联系方式（仅 X 和 Telegram）
 * 描边胶囊按钮，图标为内联 SVG。
 */

import type { Dictionary } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M21.94 4.36 18.9 19.03c-.23 1.03-.84 1.28-1.7.8l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.95.46l.34-4.8L18.4 6.6c.38-.34-.08-.53-.6-.19L7.83 13.2l-4.63-1.45c-1.01-.31-1.03-1.01.21-1.49l18.1-6.97c.84-.31 1.57.19 1.43 1.26Z" />
    </svg>
  );
}

export default function SocialLinks({ t }: { t: Dictionary }) {
  const LINKS = [
    {
      href: siteConfig.social.twitter,
      label: t.social.x,
      handle: t.social.xHandle,
      Icon: XIcon,
    },
    {
      href: siteConfig.social.telegram,
      label: t.social.telegram,
      handle: t.social.tgHandle,
      Icon: TelegramIcon,
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {LINKS.map(({ href, label, handle, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium text-heading transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent dark:hover:border-accent-mint dark:hover:text-accent-mint"
        >
          <Icon />
          {label}
          <span className="text-xs font-normal text-muted">{handle}</span>
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}

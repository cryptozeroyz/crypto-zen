/**
 * Footer.tsx —— 极简页脚：细分隔线 + 版权（左）+ 签名（右）
 */

import type { Dictionary } from "@/lib/i18n";
import { siteConfig } from "@/lib/siteConfig";
import Container from "@/components/Container";

export default function Footer({ t }: { t: Dictionary }) {
  return (
    <footer className="mt-10 py-8">
      <Container className="flex flex-col gap-1.5 font-sans text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t.footer.rights
            .replace("{year}", String(new Date().getFullYear()))
            .replace("{name}", siteConfig.footer.copyrightName)}
        </p>
        <p className="font-serif">{siteConfig.footer.signature}</p>
      </Container>
    </footer>
  );
}

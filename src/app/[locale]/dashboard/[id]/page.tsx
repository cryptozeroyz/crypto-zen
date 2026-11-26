/**
 * [locale]/dashboard/[id] —— 旧详情页路由，308 永久跳转到 /token/[symbol]
 * （稳定 URL 累积权重；判断数据本身不变）
 */

import { notFound, permanentRedirect } from "next/navigation";
import { readCallRecords } from "@/lib/calls-store";
import { safeTokenSlug } from "@/lib/coin-format";
import { isLocale } from "@/lib/i18n";

export const revalidate = 300;

export default async function LegacyCallPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const records = await readCallRecords();
  const record = records.find((r) => r.call.id === params.id);
  if (!record) notFound();
  permanentRedirect(`/${params.locale}/token/${safeTokenSlug(record.call.symbol)}`);
}

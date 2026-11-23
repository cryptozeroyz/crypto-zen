# CLAUDE.md — Crypto Zen 个人网站

个人主页 + 写作空间 + Track Record 投研看板。Next.js 14 (App Router) + TypeScript + Tailwind，文章存本地 Markdown，部署 GitHub → VPS（GitHub Actions 自动部署）+ Vercel（备用，函数已满 12/12，新 API 必须并入既有路由）。

## 常用命令

```bash
npm run dev          # 本地开发
npm run build        # 生产构建
npm run typecheck    # tsc --noEmit
npm run lint         # next lint（0 错误门槛）
npm run test         # vitest run（28 用例）
npx tsx scripts/migrate-calls.ts           # 迁移 dry-run
npx tsx scripts/migrate-calls.ts --execute # 迁移执行（按 call.id 幂等 upsert + 单调合并）
```

推送即部署：push 到 main → GitHub Actions 构建 standalone → rsync(--delete，排除 .env 与 content/flowers.json) → pm2 restart。

## Track Record 数据结构（content/calls.json）

**唯一数据源**：`src/lib/calls.ts` 的 Zod schema（类型全部推导）。记录 = `{ call, updates[], outcome|null }`。

- **Call（发布后锁定）**：id(`YYYY-MM-DD-slug`)、chain/tokenName/symbol/contractAddress、calledAt（ISO 精确到分钟）、stance、priceAtCall/mcapAtCall（priceSource: auto|manual）、narrative/thesis/catalysts/risks、narrativeType、horizon、**invalidation 必填**、target/stopMcap、**disclosure 必填**（position/sponsored/referral；`unknown` 仅限 isHistorical）、relatedReports、isHistorical。
- **Update（只追加）**：note / thesis-change / position-change / closed。
- **Outcome（一次）**：verdict、returnAtClose（数据层自动算，不可手填）、max/minMcap、maxDrawdown、invalidationTriggered、lessons、mistakeType。

**不可变性规则**（`src/lib/calls-store.ts`，有测试覆盖）：
- 修改 `LOCKED_CALL_FIELDS`（17 个字段）→ 抛 `ImmutableCallError`；
- 写入 Outcome 后记录冻结（拒绝新 Update/重复复盘）；
- 演进只能 appendUpdate。一切写入走 `applyCreateCall / applyAppendUpdate / applyCloseCall` 纯函数。

**派生指标**（`src/lib/calls-stats.ts`）：status=open/closed/expired（超 horizon 待复盘）；胜率=correct÷已结束（unresolved 不计）；涨跌幅/回撤一律**中位数**；`<5` 已复盘显示小样本提示。

## 录入流程（后台）

`/admin` → 投研工作台（关注/日志/判断三页合一，以币为中心）：
1. **定位/新建**：顶部粘 CA 回车——已有则定位，没有则带行情打开「新建判断」（⚡ 自动抓取记 pool 与 priceSource）。
2. **判断子面板**：快照只读 + 证伪条件常显；「追加更新」（note/thesis-change/position-change/closed）；「复盘关闭」（⚡ 现价 + ⚡ 从 K 线计算 max/min 市值）；复盘后冻结。
3. **快记子面板**：即写即存，自动关联当前币（tokens 写 symbol+CA），会出现在前台该币时间线。
4. **持仓子面板**：改披露（position/entryPrice/sizeTier/sponsored/referral）→ `/api/admin/calls/disclosure`（锁定字段原样校验）；持仓变动留 position-change 更新。
5. **未关联日志**：列表底部入口，游离日志可「挂到某币」（journal upsert by id）或删除。

## 关键约定

- 文案 i18n 全在 `src/lib/i18n.ts`（zh + `en: typeof zh`，缺 key 编译报错）；Track Record 在 `dictionary.trackRecord`；**词典必须可序列化**（禁止函数字段，server→client 传参会崩——曾经踩过）。
- 枚举值英文存储，显示层翻译（`src/components/dashboard/tr.ts`）。
- 公开 API 限流：`/api/market` 令牌桶 60/min/IP（`src/lib/rate-limit.ts`）。
- 文章/封面/OG 图中文字体：构建期下载到 `standalone/fonts/`（VPS 访问 Google Fonts 不稳），运行时本地优先、Google 回退（`src/lib/og-fonts.ts`）。
- 历史迁移数据（isHistorical=true）必须显示「历史记录，非事前判断」，不得伪装成事前判断。

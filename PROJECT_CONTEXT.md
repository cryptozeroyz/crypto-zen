# CryptoZen — PROJECT CONTEXT

> Personal Crypto Research Hub · Next.js 14 + TypeScript + Tailwind
> 本文档是工程的单一事实来源（single source of truth）。
> 最后更新：2026-11-17（Phase 0 工程基线）

---

## 1. 系统架构

```
访客浏览器
   │  https://cryptozen.fun（Cloudflare 无，直连）
   ▼
阿里云轻量·首尔 VPS（8.220.221.249，Ubuntu 24.04）
   ├─ Caddy :443/:80   反代 + 自动 HTTPS（Let's Encrypt）
   ├─ PM2（crypto 用户）Next.js standalone server.js :3000
   │     └─ .env 提供 ADMIN_PASSWORD / ADMIN_SECRET / GITHUB_TOKEN / GITHUB_REPO
   └─ fail2ban（SSH 防爆破）+ ufw（22/80/443/3000）
   │
   ├─► GitHub API（内容读写：文章/关注列表/鲜花计数）——storage.ts
   ├─► DexScreener API（代币行情/头像）——watchlist.ts
   ├─► GeckTerminal API（K 线 OHLCV）——api/market
   └─► EquationNews MCP（15 频道快讯）——api/market type=eqn

备份链路：GitHub push → Vercel 自动部署（crypto-zen.vercel.app，Hobby 12 函数上限）
主部署链路：GitHub push main → GitHub Actions（.github/workflows/deploy.yml）
            构建 standalone → rsync → PM2 delete+start（显式 source .env）
```

**关键约束**：Vercel Hobby = 12 Serverless Function 上限（当前 12/12 满额）。
新增服务端能力必须合并进现有路由（`/api/admin/[...path]` catch-all 或 `/api/market` 多类型），禁止新增独立路由文件。

## 2. 目录地图

```
content/            数据层（GitHub 同步的真实来源）
  posts/            中文文章（Markdown + frontmatter）
  posts-en/         英文文章（自动翻译生成）
  watchlist.json    关注列表（CA/评价/持仓/关注时价格）
  links.json        好物推荐
  flowers.json      送花计数
src/
  app/[locale]/     公开页面（zh/en 双语，静态/ISR）
    dashboard/      代币看板（静态壳 + 客户端轮询）
    news/           方程式新闻 15 频道（静态壳 + 客户端）
    alpha/          每日好运签（静态）
    writing/[slug]/ 文章页（SSG + ISR）
    resources/ about/
  app/admin/        后台（5 个 force-dynamic 页面 + 1 个 catch-all API）
  app/api/market/   公共代理：ticker / img / watchlist / ohlcv / eqn（一个函数五种用途）
  lib/
    auth.ts              会话认证（fail-closed 生产配置，见 §4）
    loginRateLimit.ts    登录限流（内存级）
    adminHandlers.ts     全部后台 API 处理器（唯一需要鉴权的入口）
    storage.ts           GitHub Contents API 适配层（local/github 双模式）
    watchlist.ts / posts.ts / eqn.ts / links.ts   各数据层
tests/              node:test + tsx 单元测试（npm test）
.deploy/            本地部署工具（SSH 密钥/脚本，gitignore，勿入库）
.github/workflows/  deploy.yml（main 推送自动部署到 VPS）
prototype/          产品原型 HTML（dashboard.html 为看板原型）
```

## 3. 数据流与身份

- **文章**：后台编辑 → admin API → storage.ts → GitHub commit → 双站自动部署上线。
- **关注列表**：`ca`（合约地址）为当前唯一身份；`followPrice/followMcap` 在首次添加时自动快照，取关再关注不重置。
- **送花**：客户端批量上报 → `/api/flowers` → GitHub flowers.json（Vercel/VPS 共享计数；workflow paths-ignore 该文件避免触发部署）。
- **行情/K线**：DexScreener 按 CA 取全部交易对 → `pairs[0]`（⚠️ 已知改进点：应加流动性优先选池规则，见 Phase 1 规划）。

## 4. 安全基线（Phase 0 整改后）

| 项 | 现状 |
|---|---|
| 后台密码 | 环境变量 `ADMIN_PASSWORD`，生产缺失或 <8 位 → **登录直接 500 拒绝**（无默认值） |
| 会话密钥 | 环境变量 `ADMIN_SECRET`，≥16 位且必须独立于密码，生产缺失 → 拒绝 |
| 登录限流 | 同 IP 10 分钟失败 5 次 → 锁定 10 分钟（429 + Retry-After）；内存级，多实例不共享 |
| 会话 Cookie | `HttpOnly; SameSite=lax; Secure(HTTPS 自动)`；有效期 **24h** |
| 紧急吊销 | 轮换 `ADMIN_SECRET` → 全部已签发会话立即失效 |
| 上传 | 仅 PNG/JPG/WebP/GIF（SVG 已禁，防存储型 XSS）；5MB 上限；**魔数校验**文件头 |
| admin API | 全部 handler 鉴权（login 公有设计除外）；POST/PUT/DELETE 方法白名单 |
| Token 使用 | `GITHUB_TOKEN` 仅 storage.ts 服务端使用；CI 用 SSH 部署密钥（DEPLOY_KEY），无 PAT |
| Git 历史 | 已扫描（密码/token/密钥 8 组字符串），干净；`.env`/`.deploy/` 从未入库 |

**服务器 `.env` 必备**：`ADMIN_PASSWORD`（≥8位）、`ADMIN_SECRET`（≥16位随机 hex）、`GITHUB_TOKEN`（fine-grained，Contents 读写，限本仓库）、`GITHUB_REPO=cryptozeroyz/crypto-zen`。

## 5. 开发流程（Git 分支规范）

```
main                    受保护，唯一可部署分支（push 即自动部署 VPS+Vercel）
  │
  ├─ chore/*            工程/杂务（如此 Phase 0）
  ├─ fix/*              bug 修复
  ├─ feat/*             新功能
  └─ refactor/*         重构
```

**流程**：
1. 从 main 切分支：`git checkout -b feat/xxx`
2. 本地跑通：`npm run typecheck && npm test && npm run build`（三步全绿才算完）
3. 推分支 + 提 PR → 验收后合并 main → Actions 自动部署（约 4 分钟）
4. **严禁直接 push main**（紧急热修除外，但需事后补 PR 记录）

## 6. 回滚方案

| 场景 | 操作 | RTO |
|---|---|---|
| 代码级回滚（最常见） | `git revert <坏commit> && git push main` → Actions 自动重新部署 | ~5 分钟 |
| 快速回滚到上一版本 | GitHub Actions 页面 → 上一个成功 workflow run → **Re-run**（重新部署旧产物） | ~4 分钟 |
| Vercel 侧回滚 | Vercel 控制台 → Deployments → 选旧版本 → **Promote** | ~1 分钟 |
| 数据回滚（内容被改坏） | 文章/JSON 均在 Git 历史中：`git log -p content/xxx` 找回旧版 → 后台重新粘贴或 revert commit | 分钟级 |
| 灾难恢复（VPS 全丢） | 阿里云快照/重装 → 跑 `.deploy/bootstrap.sh` + `start.sh`（需重建 .env）→ DNS 无需动 | ~30 分钟 |

**注意**：回滚代码不影响已提交到 GitHub 的内容数据（两者独立演进）。

## 7. 环境与密钥（本地开发）

- 本地 `.env.local` 可选；缺省时 auth 走开发兜底（admin123/密码即密钥），**仅限 NODE_ENV≠production**。
- 海外 API 抓取需代理：`NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:7897`。
- 服务器 SSH：`ssh -i .deploy/deploy_key root@8.220.221.249`；常用：`pm2 status|logs crypto-zen|restart crypto-zen`。

## 8. 已知风险与技术债（按优先级）

1. **Next.js 14.2.x CVEs**（npm audit 4 项，含图片优化 RCE 理论风险）——升级到 Next 15 可解，breaking change，需专项排期。
2. **选池规则**：`fetchCoinData` 取 `pairs[0]`，未按流动性择优；多池代币行情可能不准（Phase 1 已规划 chain+address 身份模型 + 智能选池 + 手动切换）。
3. **登录限流内存级**：Vercel 多实例不共享计数（VPS 单实例无此问题）。
4. **无 E2E 测试**：当前仅单元测试覆盖纯函数；API 级测试需引入 supertest/playwright，待排期。
5. **会话 24h + 无状态**：被盗 cookie 暴露窗口 24h；已有 ADMIN_SECRET 轮换作为吊销手段。

## 9. Phase 规划

- **Phase 0（本分支）**：工程基线 = 安全检查 + 上传加固 + typecheck/test/build 三件套 + 本文档 ✅
- **Phase 1（待启动）**：watchlist 身份模型升级（chain+address、智能选池、后台手动切池）——设计已就绪
- **Phase 2（候选）**：UI/UX 细节打磨（衬线标题、滚动动效、当前导航高亮等清单已出）

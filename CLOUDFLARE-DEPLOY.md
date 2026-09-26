# qiyi71w 个人主页：Cloudflare Workers 免费版部署

此版本提供个人简介、LizzieYzy Next 项目、Steam 在线和游戏状态、服务监控、深浅色切换与动画。联系方式和状态集成由 `lib/site-config.ts` 配置。

## 当前状态

- 这是源码包，首次发布前运行 `pnpm build` 生成 `dist/client`。
- `cloudflare/worker.ts` 只处理 `/api/presence` 和 `/api/services`，复用已有状态读取逻辑。
- 不使用 D1、KV、R2、付费绑定、定时任务或 Steam API Key。
- 发布前在 `lib/site-config.ts` 填写允许公开的资料；个人字段默认留空，Steam 和监控未配置时不会发出上游请求。
- `workers.dev` 网址默认公开访问；如需访问控制，应单独配置 Cloudflare Access。

## 从源码构建并发布

需要 Node.js 22.13 或更新版本，以及 pnpm。进入解压后的项目目录：

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm exec wrangler login
pnpm exec wrangler whoami
pnpm run deploy:check
pnpm deploy
```

`wrangler login` 会打开 Cloudflare 官方授权页，不要把密码或 API Token 粘贴到聊天中。

部署前在 Cloudflare 控制台确认目标账户使用 **Workers Free**。域名的 Free 计划和 Workers 的计费计划是两回事。如果你有多个 Cloudflare 账户，选择使用 Workers Free 的账户。此项目本身不会订阅或升级套餐，但配置文件不能替你把已有付费账户切换成免费账户。

如果你有多个 Cloudflare 账户，发布时通过本地 `CLOUDFLARE_ACCOUNT_ID` 环境变量选择账户；不要在公开源码中保存个人部署标识或凭据。

默认 Worker 名称是 `qiyi71w-home`。如果同名 Worker 已有其他网站，请先修改名称，避免覆盖。发布成功后 Wrangler 会输出真实的 `https://...workers.dev` 地址。

## 修改页面后重新发布

```sh
pnpm build
pnpm run deploy:check
pnpm deploy
```

`pnpm build` 在构建时生成主页。不要部署 `dist/server/wrangler.json`，那是页面生成过程的中间配置。正确部署命令已固定使用项目根目录的 `wrangler.jsonc`。

## 绑定自己的域名

发布完成后，打开对应 Worker 的 Settings → Domains & Routes → Add → Custom Domain，填写你自己的域名，例如 `home.example.com`。该域名所属区域需要已在你的 Cloudflare 账户正常接入。已有同名 DNS 记录时应先检查其用途并处理冲突，不要修改其他子域名或邮件记录。

Uptime Kuma 状态站的根地址与页面标识分别通过 `lib/site-config.ts` 的 `statusBaseUrl` 和 `statusPageSlug` 配置。主页只读取公开状态接口，不自动修改状态站或 DNS。

## 免费版用量

静态页面和资源通过 Cloudflare 静态资源服务提供。动态 API 请求仍受 Workers Free 配额和 CPU 限制约束。每个处于前台的网页大约每分钟各请求一次 Steam 和服务状态接口。可以在控制台观察实际 CPU 和请求用量；本地检查不能保证所有线上请求始终处于限额内。

核对日期：2026-09-26。官方参考：

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

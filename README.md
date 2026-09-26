# <img src="public/favicon.svg" width="28" height="28" alt=""> qiyi-home

我的个人主页，展示开源项目、Steam 在线与游戏状态及服务监控，支持深浅色主题，部署于 Cloudflare Workers。

## 功能

- 个人简介与 LizzieYzy Next 项目展示
- Steam 在线状态和正在运行的游戏，无需 Steam API Key
- Uptime Kuma 服务状态、近期监测记录与可用率
- 深浅色主题、轻量动画、响应式布局与邮箱链接

## 本地开发

需要 Node.js 22.13 或更新版本，以及 pnpm。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## 个人配置

统一编辑 [`lib/site-config.ts`](./lib/site-config.ts)：

| 字段 | 用途 | 默认值 |
| --- | --- | --- |
| `email` | 页脚邮箱链接 | 空，隐藏链接 |
| `location` | 地区 | 空，隐藏该项 |
| `education` | 学校或教育信息 | 空，隐藏该项 |
| `steamId` | Steam 64 位账号 ID | 空，不请求 Steam |
| `statusBaseUrl` | Uptime Kuma 公开状态站根地址，如 `https://status.example.com` | 空，不请求状态站 |
| `statusPageSlug` | Uptime Kuma 公开状态页标识 | `public` |

未配置 Steam 或状态站时，页面明确显示未配置提示。填写对应字段后重新构建，即可启用真实状态读取。

> [!IMPORTANT]
> 这些配置会进入生成的页面、JavaScript 或 API 响应，只能填写允许公开的信息。不要放密码、Token 或 API Key；提交前检查个人配置是否仍需脱敏。

项目截图使用已遮盖对局者姓名、清除元数据的 WebP，头像使用通用品牌图标。

## 构建与部署

这是源码包，不包含 dist 或 node_modules。首次部署必须先构建：

```sh
pnpm build
pnpm run deploy:check
pnpm start # 本地预览构建结果；结束后再运行发布命令
pnpm exec wrangler login
pnpm deploy
```

构建会预先生成主页，Cloudflare 静态资源服务提供页面，轻量 Worker 处理实时状态接口。部署使用根目录的 wrangler.jsonc。

完整步骤见 [Cloudflare 部署说明](./CLOUDFLARE-DEPLOY.md)。

## 主要文件

| 文件 | 用途 |
| --- | --- |
| app/page.tsx | 个人简介、项目展示、联系方式 |
| app/globals.css | 布局、主题颜色、动画 |
| app/theme.tsx | 深浅色切换 |
| app/status.tsx | Steam 和服务监控界面 |
| lib/status-server.ts | 状态读取、解析与缓存 |
| lib/site-config.ts | 公开个人配置与状态页链接 |
| cloudflare/worker.ts | Cloudflare API 入口 |
| public/images | 页面图片 |
| wrangler.jsonc | Worker 名称与部署配置 |

页面内容、GitHub 和项目链接在 `app/page.tsx`；个人联系方式和状态集成统一在 `lib/site-config.ts` 配置。

## 域名

部署后可在 Worker 的设置 → 域和路由 → 自定义域中绑定你自己的域名。源码没有自动修改任何 DNS 记录；绑定前检查同名记录用途，避免影响已有服务。

项目采用 [MIT 许可证](./LICENSE)，第三方许可文件保留在各自目录中。

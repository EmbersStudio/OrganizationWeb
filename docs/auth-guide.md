# Better Auth 认证指南（Cloudflare D1）

本项目使用 [Better Auth](https://www.better-auth.com) 提供完整的用户认证能力，
数据库选用 Cloudflare **D1**（通过 Drizzle ORM 接入），运行在 Next.js App Router +
OpenNext（Cloudflare Workers）之上。

## 一、认证架构简介

请求流程：

1. 浏览器（前端 React 组件）调用 Better Auth 客户端 `authClient`；
2. 请求发送到同源 `/api/auth/*`；
3. `src/app/api/auth/[...all]/route.ts` 的 catch-all 路由从
   `getCloudflareContext()` 拿到 D1 绑定后创建 Better Auth 实例并转发给
   `auth(env).handler()`；
4. Better Auth 通过 Drizzle 适配器读写 D1 中的 user / session / account / verification 表；
5. 登录成功后写入安全的 HttpOnly Cookie，服务端会话记录保存在 session 表；
6. 服务端组件通过 `getServerSession()`（Cookie → session 表）校验登录态。

主要文件：

| 文件                                 | 作用                                              |
| ------------------------------------ | ------------------------------------------------- |
| `src/lib/auth.ts`                    | Better Auth 服务端实例工厂（D1 + Drizzle 适配器） |
| `src/lib/auth-client.ts`             | 浏览器端认证客户端（better-auth/react）           |
| `src/lib/session.ts`                 | 服务端会话读取辅助                                |
| `src/db/schema.ts`                   | D1 表结构（Drizzle schema）                       |
| `src/app/api/auth/[...all]/route.ts` | /api/auth/* 全部标准端点挂载                      |
| `src/app/login/page.tsx`             | 登录页                                            |
| `src/app/register/page.tsx`          | 注册页                                            |
| `src/app/dashboard/page.tsx`         | 受保护页（未登录重定向到 /login）                 |

## 二、环境变量说明

敏感信息一律通过环境变量注入，禁止硬编码。

| 变量                          | 必填 | 说明                                                       |
| ----------------------------- | ---- | ---------------------------------------------------------- |
| `BETTER_AUTH_SECRET`          | 是   | 会话 / 令牌加密密钥。生成：`openssl rand -base64 32`       |
| `BETTER_AUTH_URL`             | 建议 | 站点公开地址，用于回调与邮件链接（不填则按请求 Host 推导） |
| `BETTER_AUTH_TRUSTED_ORIGINS` | 否   | 额外受信任来源，逗号分隔（同源部署无需配置）               |
| `GITHUB_CLIENT_ID`            | 否   | GitHub OAuth Client ID（配置后启用 GitHub 登录）           |
| `GITHUB_CLIENT_SECRET`        | 否   | GitHub OAuth Client Secret                                 |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | 否   | 前端指向的服务端地址（同源部署无需配置）                   |

本地开发：

- 将 `.dev.vars.example` 复制为 `.dev.vars` 并填写；
- 或写入 `.env.local`（已被 .gitignore 忽略）。

部署环境：在 Cloudflare Dashboard → Workers & Pages → 设置 → 变量与机密中，
将 `BETTER_AUTH_SECRET`（以及可选的 OAuth 变量）配置为**机密变量**。

## 三、路由端点（/api/auth/*）

Better Auth 通过 catch-all 路由提供标准端点，常用如下：

| 端点                         | 方法       | 用途                                          |
| ---------------------------- | ---------- | --------------------------------------------- |
| `/api/auth/sign-up/email`    | POST       | 邮箱密码注册（body: name / email / password） |
| `/api/auth/sign-in/email`    | POST       | 邮箱密码登录                                  |
| `/api/auth/sign-out`         | POST       | 登出（删除 Cookie 与服务端会话）              |
| `/api/auth/get-session`      | GET / POST | 读取当前会话                                  |
| `/api/auth/verify-email`     | GET        | 点击验证邮件链接后校验邮箱                    |
| `/api/auth/forget-password`  | POST       | 申请密码重置邮件                              |
| `/api/auth/reset-password`   | POST       | 携带令牌重置密码                              |
| `/api/auth/authorize/github` | GET        | 发起 GitHub OAuth 授权                        |
| `/api/auth/callback/github`  | GET        | GitHub OAuth 回调                             |
| `/api/auth/error`            | GET        | 统一错误页/错误信息                           |

> 所有端点都不需要额外中间件：Better Auth 内置了 CSRF/Origin 校验、
> 会话校验与限流（生产环境默认开启）。

## 四、前端集成示例

客户端单例（`src/lib/auth-client.ts`）：

```ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export type AuthSession = typeof authClient.$Infer.Session;
```

注册：

```ts
const { data, error } = await authClient.signUp.email({
  name: '张三',
  email: 'user@example.com',
  password: 'strong-password',
});
if (error) {
  // 展示 error.message / error.code
}
```

登录：

```ts
const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'strong-password',
});
```

登出：

```ts
await authClient.signOut();
```

读取会话（客户端）：

```ts
const { data: session } = await authClient.getSession();
```

服务端组件读取会话（`src/lib/session.ts`）：

```ts
import { getServerSession } from '@/lib/session';

export default async function Page() {
  const session = await getServerSession();
  if (!session) {
    // 未登录
  }
  // session.user / session.session
}
```

## 五、数据库表结构（D1）

迁移文件位于 `migrations/`（drizzle-kit 生成），包含四张表：

| 表             | 说明               | 关键字段                                                        |
| -------------- | ------------------ | --------------------------------------------------------------- |
| `user`         | 用户               | id、name、email（唯一）、emailVerified、image                   |
| `session`      | 会话（服务端存储） | id、userId、token、expiresAt、ipAddress、userAgent              |
| `account`      | 登录账户           | userId、accountId、providerId、password、issuer、accessToken 等 |
| `verification` | 验证数据           | identifier、value、expiresAt（邮箱验证 / 重置令牌）             |

时间字段统一存储为 Unix 时间戳（Drizzle `mode: "timestamp"`），
外键均带 `ON DELETE CASCADE`。

## 六、本地开发与验证

```bash
# 1. 安装依赖
npm install

# 2. 准备本地变量
cp .dev.vars.example .dev.vars   # Windows: copy .dev.vars.example .dev.vars
# 填写 BETTER_AUTH_SECRET（任意足够长的随机串）

# 3. 把迁移应用到本地 D1
npm run db:migrate:local

# 4. 启动（next dev 已通过 initOpenNextCloudflareForDev 加载本地 D1）
npm run dev

# 5. 浏览器访问
#    http://localhost:3000/register  注册
#    http://localhost:3000/login     登录
#    http://localhost:3000/dashboard 受保护页
```

验证要点：

- 注册成功自动登录并进入 /dashboard；
- 刷新页面会话保持（Cookie + session 表）；
- 点击“退出登录”后访问 /dashboard 会 307 重定向到 /login；
- 注册时若开启邮箱验证（默认 `emailVerification.sendOnSignUp = true`），
  验证链接会输出到终端日志（示例实现），点击链接即可完成验证。

## 七、部署注意事项（Cloudflare）

1. **构建与部署**

```bash
npm run build:opennext
npm run deploy
```

2. **远程迁移**（首次部署必须执行）

```bash
npm run db:migrate:remote
```

3. **配置机密变量**：`BETTER_AUTH_SECRET` 等通过 Cloudflare Dashboard
   以机密变量形式配置，避免出现在 wrangler.toml / 仓库中。

4. **自定义域名**：设置 `BETTER_AUTH_URL` 为正式域名；
   如有额外的预览域名（如 `*.workers.dev`），将其加入
   `BETTER_AUTH_TRUSTED_ORIGINS`。

5. **邮箱服务**：当前 `sendVerificationEmail` / `sendResetPassword`
   为示例实现（输出到日志）。生产环境请在 `src/lib/auth.ts` 中接入
   Resend、SendGrid 等邮件服务，把验证/重置链接真正发送到用户邮箱。

## 八、GitHub OAuth（可选）

1. 在 GitHub → Settings → Developer settings → OAuth Apps 创建应用：
   - Homepage URL：站点地址；
   - Authorization callback URL：`https://<your-domain>/api/auth/callback/github`；
2. 配置环境变量 `GITHUB_CLIENT_ID` 与 `GITHUB_CLIENT_SECRET`；
3. 登录页“使用 GitHub 登录”按钮即会生效（服务端 socialProviders 自动启用）。

## 九、常见问题

- **Missing or null Origin（403）**：非浏览器请求需带 `Origin` 头；
  浏览器同源 POST 会自动携带，无需处理。
- **The field "issuer" does not exist in the "account" Drizzle schema**：
  说明 D1 尚未执行 `0001_add_account_issuer` 迁移，运行
  `npm run db:migrate:local`（或远程）即可。
- **生产环境缺少 secret 报错**：确认已配置 `BETTER_AUTH_SECRET`。

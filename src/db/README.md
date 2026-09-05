# 数据库目录（src/db）

D1 数据库（Cloudflare）相关的 Drizzle 表结构与类型。

| 文件        | 说明                                                              |
| ----------- | ----------------------------------------------------------------- |
| `schema.ts` | Better Auth 所需的四张表：user / session / account / verification |

## schema.ts

- 时间字段使用 Unix 时间戳存储（Drizzle `mode: "timestamp"`）；
- 外键（session/account.userId → user.id）均带 `ON DELETE CASCADE`；
- 表结构与 Better Auth 默认模型一一对应，**请勿随意改名/删列**。

## 迁移（migrations/）

- 迁移文件位于仓库根目录 `migrations/`（drizzle-kit 生成），配置见 `drizzle.config.ts`；
- 本地开发：`npm run db:migrate:local`；
- 部署：`npm run db:migrate:remote`；
- 修改 `schema.ts` 后运行 `npx drizzle-kit generate` 生成新的迁移文件。

> 认证相关说明见 [docs/auth-guide.md](../../docs/auth-guide.md)。

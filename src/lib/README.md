# 核心库说明（src/lib）

| 文件               | 作用                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `kv.ts`            | KV 操作封装：Cloudflare 环境使用真实 KV，本地开发自动切换内存模拟 |
| `cache-manager.ts` | 缓存优先（cache-first）逻辑：命中返回缓存，未命中抓取并写缓存     |
| `auth.ts`          | Better Auth 服务端实例工厂（D1 + Drizzle 适配器）                 |
| `auth-client.ts`   | Better Auth 浏览器客户端（better-auth/react）                     |
| `session.ts`       | 服务端会话读取辅助（Server Components / Route Handlers）          |

## kv.ts

- `kvGet(key): Promise<string | null>` / `kvSet(key, value, ttlSeconds?): Promise<void>`
- 通过 `getCloudflareContext()` 解析 `DATA_CACHE` 绑定；
- 无 Cloudflare 环境（`npm run dev`）时自动使用进程内内存 Map 模拟，无需账号即可开发；
- 日志前缀 `[KV]`。

## cache-manager.ts

- `getCachedOrFetch<T>(key, fetchLive, ttlSeconds?): Promise<{ source, data }>`
- `source` 为 `'cache' | 'live'`，便于日志与调试；
- 缓存开关读取 `config/cache.ts`（环境变量 `USE_CACHE=false` 禁用）；
- 缓存内容损坏时自动降级为实时抓取。

## auth.ts / auth-client.ts / session.ts

- `auth.ts`：根据请求环境（含 D1 绑定）创建 Better Auth 实例，导出 `auth(env)` 与 `Auth` 类型；
- `auth-client.ts`：浏览器端单例 `authClient`，提供 `signUp.email` / `signIn.email` / `signOut` / `getSession`；
- `session.ts`：服务端 `getServerSession()`，基于请求 Cookie 读取会话（未登录返回 null）；
- 认证相关的端点、环境变量与部署说明见仓库根目录 `docs/auth-guide.md`。

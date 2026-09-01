# 核心库说明（src/lib）

| 文件               | 作用                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `kv.ts`            | KV 操作封装：Cloudflare 环境使用真实 KV，本地开发自动切换内存模拟 |
| `cache-manager.ts` | 缓存优先（cache-first）逻辑：命中返回缓存，未命中抓取并写缓存     |

> 迁移说明：原 `html-loader.ts`（HTML 页面加载器）已随「纯 TypeScript + TSX 组件」迁移移除，
> 页面内容现由 `src/views/**` 的 TSX 组件直接渲染。

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

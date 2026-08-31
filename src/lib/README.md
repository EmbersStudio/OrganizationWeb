# 核心库说明（src/lib）

| 文件               | 作用                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `html-loader.ts`   | 服务端加载页面 HTML（本地读文件系统，Cloudflare 环境读构建期清单） |
| `kv.ts`            | KV 操作封装：Cloudflare 环境使用真实 KV，本地开发自动切换内存模拟  |
| `cache-manager.ts` | 缓存优先（cache-first）逻辑：命中返回缓存，未命中抓取并写缓存      |

## html-loader.ts

- `loadPageHTML(pageName): Promise<string>`
- 优先从 `src/content/pages/<name>.html` 读取；
- Worker 环境文件不可读时，回退到构建期生成的 `src/content/pages.generated.ts` 清单；
- 页面名做合法性校验（`/^[a-z0-9_-]+$/i`），防止路径穿越。

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

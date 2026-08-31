# 全局配置说明（config）

| 文件         | 作用                   |
| ------------ | ---------------------- |
| `cache.ts`   | 缓存配置（开关 / TTL） |
| `scripts.ts` | 爬虫脚本注册表         |

## cache.ts

```ts
export const cacheConfig = {
  enabled: process.env.USE_CACHE !== "false", // 默认启用
  ttl: 3600, // 秒
};
```

- `enabled=true`：缓存优先模式；`false`（设置 `USE_CACHE=false`）：实时抓取模式。
- TTL 单位为秒，作用于 KV 的 expirationTtl。

## scripts.ts

所有爬虫脚本在此注册：

```ts
export const scripts: ScraperScript[] = [exampleScraper];
```

新增脚本时在数组末尾追加即可（详见 `src/scripts/README.md`）。

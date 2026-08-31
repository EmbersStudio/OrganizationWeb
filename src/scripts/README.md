# 爬虫脚本模块说明（src/scripts）

提供可扩展的数据抓取脚本框架。每个脚本实现统一的 `ScraperScript` 接口，
注册到 `config/scripts.ts` 后，即可通过 **GET /api/data?script=<name>** 调用。

## 目录结构

```
src/scripts/
├── base-scraper.ts     # ScraperScript 接口与 ScraperResult 类型
├── example-scraper.ts  # 示例脚本（返回模拟数据，不抓取真实网站）
├── index.ts            # 统一导出（类型 + 全部脚本）
└── README.md
config/scripts.ts       # 脚本注册表（新增脚本时在此注册）
```

## 接口定义

```ts
interface ScraperScript {
  name: string; // 脚本唯一名称，如 'example'
  enabled: boolean; // 是否启用；false 时接口返回 403
  description?: string; // 用途描述
  scrape(): Promise<ScraperResult>; // 返回任意 JSON 可序列化数据
}
```

## 如何新增脚本

1. 在 `src/scripts/` 下新建 `my-scraper.ts`：

   ```ts
   import type { ScraperScript } from "./base-scraper";

   export const myScraper: ScraperScript = {
     name: "my",
     enabled: true,
     description: "我的脚本：抓取某网站数据",
     async scrape() {
       // 示例：使用 axios + cheerio 抓取（需先 npm install axios cheerio）
       // const { default: axios } = await import('axios');
       // const { load } = await import('cheerio');
       // const { data: html } = await axios.get('https://example.com');
       // const $ = load(html);
       return { title: "抓取结果", url: "https://example.com" };
     },
   };
   ```

2. 注册到 `config/scripts.ts`：

   ```ts
   import { exampleScraper } from "@/scripts/example-scraper";
   import { myScraper } from "@/scripts/my-scraper";

   export const scripts = [exampleScraper, myScraper];
   ```

3. （可选）在 `src/scripts/index.ts` 中补充导出。

4. 重启服务后调用：`GET /api/data?script=my`。

## 启用 / 禁用脚本

- 将脚本的 `enabled` 设为 `false` 即可临时下线（接口返回 403），无需删除代码。

## 与缓存的关系

- 接口默认“缓存优先”：命中 KV 缓存直接返回，未命中才执行 `scrape()`。
- 设置环境变量 `USE_CACHE=false` 可切换为“实时抓取模式”。
- 缓存 TTL 在 `config/cache.ts` 中配置（默认 3600 秒）。
- 日志统一使用 `[Scraper]` 前缀。

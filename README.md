# Organization Web

基于 **Next.js (App Router) + TypeScript + OpenNext** 的全栈网站，
前端页面内容由独立 HTML 文件驱动，后端提供可扩展的数据抓取脚本框架，
并通过 **Cloudflare KV** 实现可切换的缓存机制，最终部署到 **Cloudflare Workers/Pages**。

## 技术栈

| 领域     | 技术                                                                 |
| -------- | -------------------------------------------------------------------- |
| 前端     | Next.js 16 (App Router)、React 19、TypeScript                        |
| 后端     | Next.js Route Handlers（/api/data）、axios + cheerio（脚本框架示例） |
| 缓存     | Cloudflare KV（本地开发使用内存模拟）                                |
| 部署     | OpenNext（@opennextjs/cloudflare）+ Wrangler                         |
| 代码规范 | Prettier、JSDoc、约定式提交（Conventional Commits）                  |

> 本项目兼容 Next.js 14+ 的 App Router 写法；当前使用 Next.js 16.3.3
> （OpenNext 官方支持的版本范围：>=15.5.24 <16 或 >=16.3.3）。

## 目录结构

```
.
├── .vscode/
│   └── settings.json           # VS Code 默认格式化（Prettier）
├── config/
│   ├── cache.ts                # 缓存配置（USE_CACHE / TTL）
│   ├── scripts.ts              # 爬虫脚本注册表
│   └── README.md
├── public/                     # 静态资源（图片、字体、公共/页面级 JS 与 CSS）
│   ├── scripts/
│   │   ├── global.js           # 全局脚本（所有页面加载）
│   │   └── pages/              # 页面级 JS（仅对应页面加载）
│   ├── styles/
│   │   └── pages/              # 页面级 CSS（仅对应页面加载）
│   └── README.md
├── scripts/
│   └── generate-pages-manifest.mjs  # 构建期生成页面 HTML 清单
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 全局布局（引入公共 CSS/JS）
│   │   ├── page.tsx            # 首页 → content/pages/home.html
│   │   ├── about/page.tsx      # 关于页 → content/pages/about.html
│   │   ├── api/data/route.ts   # 数据接口（缓存优先 + 爬虫）
│   │   └── README.md
│   ├── components/
│   │   └── html-page.tsx       # 通用 HTML 页面渲染组件（挂载页面级 CSS/JS）
│   ├── content/
│   │   ├── pages/              # 页面 HTML 文件（唯一内容源）
│   │   │   ├── home.html
│   │   │   └── about.html
│   │   ├── pages.generated.ts  # 构建期生成的 HTML 清单（勿手动编辑）
│   │   └── README.md
│   ├── lib/
│   │   ├── html-loader.ts      # 服务端加载页面 HTML
│   │   ├── kv.ts               # KV 操作封装（含内存模拟）
│   │   ├── cache-manager.ts    # 缓存优先逻辑
│   │   └── README.md
│   ├── scripts/                # 爬虫脚本框架
│   │   ├── base-scraper.ts     # ScraperScript 接口
│   │   ├── example-scraper.ts  # 示例脚本（模拟数据）
│   │   ├── index.ts
│   │   └── README.md
│   └── styles/                 # 全局/自定义样式
│       ├── globals.css
│       ├── custom/theme.css
│       └── README.md
├── open-next.config.ts         # OpenNext 配置
├── wrangler.toml               # Cloudflare 配置（KV 绑定等）
├── next.config.ts
├── .prettierrc / .prettierignore
├── package.json
└── README.md
```

## 快速开始

环境要求：Node.js 20+（推荐 22/24）、npm 10+。

```bash
# 1. 安装依赖
npm install

# 2. 本地开发（http://localhost:3000）
npm run dev

# 3. 代码检查
npm run typecheck   # TypeScript 类型检查
npm run format:check  # Prettier 格式检查
npm run format      # Prettier 自动格式化
```

本地开发无需 Cloudflare 账号：KV 自动使用进程内内存模拟，页面 HTML 直接读取文件系统。

## 常用脚本

| 命令                              | 说明                                               |
| --------------------------------- | -------------------------------------------------- |
| `npm run dev`                     | 启动 Next.js 开发服务器                            |
| `npm run build`                   | Next.js 生产构建（OpenNext 内部调用）              |
| `npm run build:opennext`          | OpenNext 完整构建（生成 `.open-next/worker.js`）   |
| `npm run preview`                 | Wrangler 本地预览（模拟 Cloudflare 环境）          |
| `npm run deploy`                  | 部署到 Cloudflare Workers                          |
| `npm run generate:pages`          | 重新生成页面 HTML 清单（predev/prebuild 自动执行） |
| `npm run format` / `format:check` | Prettier 格式化 / 检查                             |
| `npm run typecheck`               | TypeScript 类型检查                                |

## 前端：如何添加新页面

1. 在 `src/content/pages/` 新建 `your-page.html`（只写内容片段，不要包含 `<html>/<body>`）。
2. 新建路由目录与组件，例如 `src/app/your-page/page.tsx`：

   ```tsx
   import type { Metadata } from 'next';
   import HtmlPage from '@/components/html-page';

   export const metadata: Metadata = { title: '你的页面' };

   export default function YourPage() {
     return <HtmlPage page="your-page" />;
   }
   ```

3. 访问 `/your-page` 即可。动态路由（如 `/posts/[slug]`）同理，在 `[slug]/page.tsx`
   中把路由参数传给 `HtmlPage`（loader 已做名称合法性校验）。

- **添加全局样式**：在 `src/styles/custom/` 新建 `*.css` 并在 `layout.tsx` 中 import。
- **添加公共 JS**：在 `public/scripts/` 新建 `*.js` 并在 `layout.tsx` 中用 `<Script>` 引入。

### 页面级 CSS / JS（按页加载）

除全局资源外，每个页面可以在自己的 HTML 顶部声明**专属资源**，只有访问该页面才会加载：

```html
<!-- src/content/pages/your-page.html -->
<link rel="stylesheet" href="/styles/pages/your-page.css" />
<script src="/scripts/pages/your-page.js"></script>
<!-- ...页面内容片段... -->
```

- CSS 放在 `public/styles/pages/<page>.css`，JS 放在 `public/scripts/pages/<page>.js`；
- 声明标签由 `src/lib/html-loader.ts` 自动提取，经 `HtmlPage` 挂载（JS 通过 Next `<Script>`
  保证执行），不会残留在渲染内容中；
- 示例：首页 `home.html` → `home.css`；关于页 `about.html` → `about.css` + `about.js`。

> 详细说明见 `src/app/README.md`。

## 后端：如何添加新爬虫脚本

1. 在 `src/scripts/` 新建 `my-scraper.ts`，实现 `ScraperScript` 接口：

   ```ts
   import type { ScraperScript } from './base-scraper';

   export const myScraper: ScraperScript = {
     name: 'my',
     enabled: true,
     description: '抓取示例网站',
     async scrape() {
       // 需要时安装 axios / cheerio 后使用
       // const { default: axios } = await import('axios');
       // const { load } = await import('cheerio');
       // const { data: html } = await axios.get('https://example.com');
       // const $ = load(html);
       return { title: '抓取结果' };
     },
   };
   ```

2. 注册到 `config/scripts.ts`：`export const scripts = [exampleScraper, myScraper];`
3. 调用：`GET /api/data?script=my`。将脚本 `enabled` 设为 `false` 可临时下线（返回 403）。

> 详细说明见 `src/scripts/README.md`。

## 缓存配置

配置位于 `config/cache.ts`：

```ts
export const cacheConfig = {
  enabled: process.env.USE_CACHE !== 'false', // 默认启用缓存
  ttl: 3600, // 缓存有效期（秒）
};
```

- **缓存优先模式（默认）**：`/api/data` 先查 KV，命中直接返回；未命中执行脚本并写缓存。
- **实时抓取模式**：启动时设置环境变量 `USE_CACHE=false`，接口始终实时执行脚本，不读写缓存。
- 本地开发无 KV 时自动使用内存模拟；部署后使用 `wrangler.toml` 绑定的真实 KV 命名空间。

## 代码规范

- **格式化**：Prettier（`.prettierrc`：singleQuote、trailingComma: 'all'、printWidth: 100 等）。
- **类型**：所有导出函数/类需带 JSDoc 注释。
- **日志**：统一带模块前缀，如 `[HTML Loader]`、`[KV]`、`[CacheManager]`、`[Scraper]`、`[API]`。
- **命名**：变量 camelCase，常量 UPPER_SNAKE_CASE。
- **Git 提交**：约定式提交（Conventional Commits），如
  `feat(init): 项目初始化`、`fix(api): 修复缓存键冲突`、`docs: 更新部署文档`。

## 部署到 Cloudflare

前置条件：已安装 Node.js、npm，并已登录 wrangler（`npx wrangler login`）。

### 0. 推荐：Cloudflare Workers Builds（Git 集成）一键部署

在 Cloudflare Dashboard 中创建 **Workers** 项目并连接 Git 仓库后，按以下设置：

| 配置项   | 值                       | 说明                                                               |
| -------- | ------------------------ | ------------------------------------------------------------------ |
| 根目录   | `/`（留空）              | **必须指向仓库根目录**（含 package.json 的位置），不是构建产物目录 |
| 构建命令 | `npm run build:opennext` | 生成 `.open-next/worker.js` 与静态资源                             |
| 部署命令 | `npx wrangler deploy`    | 读取 wrangler.toml，上传 Worker（含 assets 与 KV 绑定）            |
| 构建变量 | `NODE_VERSION=22`        | Next.js 16 要求 Node >= 20.9，推荐使用 22                          |

> ⚠️ 常见错误：把「根目录」填成 `.open-next` 会导致
> `Failed: root directory not found`。
> `.open-next` 是**构建产物**（已被 `.gitignore` 忽略），克隆仓库时并不存在，
> 所以 Cloudflare 在「克隆 → 定位根目录」阶段就会失败。
> 根目录必须指向源码目录（`/`）；构建命令执行成功后 `.open-next/` 才会生成，
> 供部署命令使用。

### 1. 创建 KV 命名空间并绑定

在 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → KV 创建命名空间，
将生成的 ID 填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "DATA_CACHE"
id = "你的真实KV命名空间ID"
```

### 2. 构建

```bash
npm run build:opennext
```

构建产物位于 `.open-next/`（`worker.js` + `assets`）。

### 3. 本地预览（可选）

```bash
npm run preview   # 访问 http://127.0.0.1:8787
```

### 4. 部署

```bash
npm run deploy
```

或使用 Cloudflare Pages CI（将项目接入 Pages 后，构建命令 `npm run build:opennext`，
输出目录 `.open-next`），详见 `@opennextjs/cloudflare` 官方文档。

### 5. 验证

- 访问部署后的域名，首页/关于页正常渲染；
- `GET /api/data?script=example` 首次返回 `source: "live"`，再次返回 `source: "cache"`；
- 查看 Worker 日志中的 `[API]`、`[KV]`、`[CacheManager]` 前缀输出确认缓存生效。

## 环境变量

参考 `.env.example`（已加入 git，可提交）：

| 变量        | 默认值       | 说明                                                   |
| ----------- | ------------ | ------------------------------------------------------ |
| `USE_CACHE` | `true`       | 缓存开关；设为 `false` 切换为实时抓取模式              |
| `CACHE_TTL` | `3600`（秒） | 缓存有效期（当前未接入，TTL 固定于 `config/cache.ts`） |

> `.env`、`.env.*` 已被 gitignore；仅 `.env.example` 会被提交。

## 已知注意事项

- **Windows**：OpenNext 官方提示与 Windows 存在部分兼容性问题，本地预览可能较慢；
  生产构建与部署不受影响，推荐在 CI（Linux）或 WSL 中执行构建。
- **HTML 渲染**：`dangerouslySetInnerHTML` 不做 XSS 过滤，页面 HTML 由项目自身维护，
  请勿注入不可信内容。
- **爬虫脚本**：当前仅含示例脚本（模拟数据），真实抓取目标由后续按需添加。

# Organization Web

> **目录**
>
> - [一、项目简介](#一项目简介)
> - [二、功能特性与技术栈](#二功能特性与技术栈)
> - [三、快速开始](#三快速开始)
> - [四、环境要求](#四环境要求)
> - [五、构建与部署](#五构建与部署)
> - [六、常用命令](#六常用命令)
> - [七、目录结构](#七目录结构)
> - [八、编码规范](#八编码规范)
> - [九、贡献指南](#九贡献指南)
> - [十、联系方式](#十联系方式)
> - [十一、许可证](#十一许可证)
> - [十二、截图](#十二截图)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![License: Unlicensed](https://img.shields.io/badge/License-Unlicensed-lightgrey?style=for-the-badge)

EmbersStudio（余烬工作室）组织官网，基于 **Next.js (App Router) + TypeScript + CSS Modules** 的全栈网站，
前端页面全部由 TSX 组件生成，后端提供可扩展的数据抓取脚本框架，并通过 **Cloudflare KV** 实现可切换的缓存机制，
最终部署到 **Cloudflare Workers**。

---

## 一、项目简介

本项目已迁移为 **纯 TypeScript 开发体系**：

- **前端**：React（Next.js App Router）+ TypeScript + CSS Modules；页面由 TSX 组件渲染，
  无 HTML 模板字符串、无内联/手动 `<script>` 标签（Cloudflare RUM 由边缘自动注入，仓库不手动干预）；
- **后端**：Next.js Route Handlers（`/api/data`）+ 可扩展爬虫脚本框架；
- **缓存**：Cloudflare KV（缓存优先模式，本地开发自动使用内存模拟）；
- **导航/交互**：页面互链 + 键盘快捷键（`h` 首页 / `a` 关于页），路径统一由路由注册表管理。

> 详细开发指南（页面创建、导航注册、按键绑定、目录规范等）请参阅 [BUILD_GUIDE.md](./BUILD_GUIDE.md)。

---

## 二、功能特性与技术栈

| 领域     | 技术                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 前端     | Next.js 16 (App Router)、React 19、TypeScript、CSS Modules                |
| 后端     | Next.js Route Handlers（`/api/data`）、爬虫脚本框架（ScraperScript 接口） |
| 缓存     | Cloudflare KV（缓存优先；`USE_CACHE=false` 切换实时抓取）                 |
| 部署     | OpenNext（`@opennextjs/cloudflare`）+ Wrangler                            |
| 代码规范 | ESLint、Prettier、JSDoc、约定式提交（Conventional Commits）               |

主要特性：

- **纯 TypeScript 页面组件**：`src/pages/` 下每个页面一个文件夹（TSX + CSS Module），路由注册表统一管理页面元信息；
- **缓存优先数据接口**：`GET /api/data?script=<name>` 先查 KV，命中直接返回；未命中执行脚本并写缓存；
- **爬虫脚本框架**：在 `src/scripts/` 实现 `ScraperScript` 并注册到 `config/scripts.ts` 即可扩展；
- **键盘快捷键**：`src/router/keymap.ts` 一处配置，全局监听跳转页面；
- **RUM**：Cloudflare Web Analytics 由边缘自动注入（`beacon.min.js` + `/cdn-cgi/rum`），仓库内不做任何手动干预。

---

## 三、快速开始

```bash
# 1. 安装依赖
npm install

# 2. 本地开发（http://localhost:3000）
npm run dev

# 3. 代码检查
npm run typecheck  # TypeScript 类型检查
npm run lint       # ESLint 检查
npm run format     # Prettier 格式化
```

本地开发无需 Cloudflare 账号：KV 自动使用进程内内存模拟。

---

## 四、环境要求

- **Node.js** ≥ 20.9（推荐 22 / 24）
- **npm** ≥ 10
- 部署需要 **Cloudflare 账号** 与 `wrangler` 登录（`npx wrangler login`）

---

## 五、构建与部署

### 1. 构建

```bash
npm run build:opennext
```

构建产物位于 `.open-next/`（`worker.js` + 静态资源）。

### 2. 本地预览（可选）

```bash
npm run preview   # 访问 http://127.0.0.1:8787
```

### 3. 部署

```bash
npm run deploy
```

或使用 Cloudflare Workers Builds（Git 集成）一键部署：

| 配置项   | 值                                 |
| -------- | ---------------------------------- |
| 根目录   | `/`（仓库根目录，含 package.json） |
| 构建命令 | `npm run build:opennext`           |
| 部署命令 | `npx wrangler deploy`              |
| 构建变量 | `NODE_VERSION=22`                  |

> ⚠️ 根目录必须指向源码目录（`/`），不是构建产物 `.open-next`（该目录已被 `.gitignore` 忽略）。

### 4. KV 命名空间

在 Cloudflare Dashboard → Workers & Pages → KV 创建命名空间，
将 ID 填入 `wrangler.toml` 的 `[[kv_namespaces]]`（binding 为 `DATA_CACHE`）。

### 5. 验证

```bash
# 首次请求返回 source: "live"，再次请求返回 source: "cache"
curl "https://<your-domain>/api/data?script=example"
```

---

## 六、常用命令

| 命令                              | 说明                            |
| --------------------------------- | ------------------------------- |
| `npm run dev`                     | 启动开发服务器                  |
| `npm run build`                   | Next.js 生产构建                |
| `npm run build:opennext`          | OpenNext 完整构建（Cloudflare） |
| `npm run start`                   | 本地运行生产构建                |
| `npm run preview`                 | Wrangler 本地预览               |
| `npm run deploy`                  | 部署到 Cloudflare Workers       |
| `npm run typecheck`               | TypeScript 类型检查             |
| `npm run lint` / `lint:fix`       | ESLint 检查 / 自动修复          |
| `npm run format` / `format:check` | Prettier 格式化 / 检查          |

---

## 七、目录结构

```
.
├── config/                # 全局配置（缓存、爬虫脚本注册表）
├── public/                # 静态资源（图片/字体/_headers）
├── src/
│   ├── app/               # Next.js App Router（page.tsx / layout.tsx / api/）
│   ├── pages/             # 页面组件（每个页面一个文件夹：TSX + CSS Module）
│   ├── components/        # 公共组件
│   ├── hooks/             # 自定义 Hooks
│   ├── utils/             # 工具函数
│   ├── router/            # 路由注册表 + 快捷键映射
│   ├── styles/            # 全局样式（globals.css / custom/theme.css）
│   ├── types/             # 共享类型定义
│   ├── lib/               # 核心库（KV、缓存管理器等）
│   └── scripts/           # 爬虫脚本框架
├── wrangler.toml          # Cloudflare 配置（KV 绑定等）
├── BUILD_GUIDE.md         # ★ 详细开发指南
└── package.json
```

> 各目录职责与新增文件的规范详见 [BUILD_GUIDE.md](./BUILD_GUIDE.md)。

---

## 八、编码规范

- **格式化**：Prettier（`.prettierrc`：singleQuote、trailingComma: all、printWidth: 120、CRLF）；
- **代码检查**：ESLint（`eslint.config.mjs`，基于 eslint-config-next + eslint-config-prettier）；
- **类型**：所有导出函数/类带 JSDoc 注释；变量 camelCase，常量 UPPER_SNAKE_CASE；
- **日志**：统一带模块前缀，如 `[KV]`、`[CacheManager]`、`[Scraper]`、`[API]`；
- **提交**：约定式提交（Conventional Commits），如 `feat(pages): ...`、`docs: ...`。

提交前请运行：`npm run format`、`npm run lint`、`npm run typecheck`。

---

## 九、贡献指南

欢迎社区贡献！

1. **查阅 Issues**：查看待办任务或提出新想法；
2. **Fork 仓库**：将项目 fork 到个人账户；
3. **创建分支**：`git checkout -b feat/your-feature`；
4. **提交代码**：遵循 ESLint + Prettier 规范，使用约定式提交；
5. **发起 Pull Request**：描述改动内容，等待 review。

---

## 十、联系方式

| 渠道                   | 地址                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| 📧 负责人邮箱          | [CrimsonSeraph.QwQ@gmail.com](mailto:CrimsonSeraph.QwQ@gmail.com)                                       |
| 🐦 负责人 X（Twitter） | [CrimSeraph_QwQ](https://x.com/CrimSeraph_QwQ)                                                          |
| 🌐 官网                | [embers-studio.crimsonseraph.top](https://embers-studio.crimsonseraph.top)                              |
| 💬 GitHub Issues       | [EmbersStudio/OrganizationWeb/issues](https://github.com/EmbersStudio/OrganizationWeb/issues)           |
| 💬 GitHub Discussions  | [EmbersStudio/OrganizationWeb/discussions](https://github.com/EmbersStudio/OrganizationWeb/discussions) |

---

## 十一、许可证

**本项目未选择任何开源许可证（Unlicensed）**，保留所有权利。

> 组织内其他项目可能采用不同许可证，请以各仓库的 `LICENSE` 文件为准。

---

## 十二、截图

**暂无截图。**

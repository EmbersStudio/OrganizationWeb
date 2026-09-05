# 前端模块说明（src/app）

本项目使用 **Next.js App Router** 组织页面路由；页面 UI 统一放在 `src/views/` 下，
由 **TSX 组件 + CSS Modules** 实现，路由与元信息通过 `src/router/routes.tsx` 注册表统一管理。

## 目录结构

```
src/app/
├── layout.tsx              # 全局布局（导入全局样式、挂载全局快捷键监听）
├── page.tsx                # 首页（/）→ 渲染 src/views/home/HomePage
├── about/
│   └── page.tsx            # 关于页（/about）→ 渲染 src/views/about/AboutPage
├── login/
│   └── page.tsx            # 登录页（/login）→ 渲染 src/views/auth/AuthView
├── register/
│   └── page.tsx            # 注册页（/register）→ 渲染 src/views/auth/AuthView
├── dashboard/
│   └── page.tsx            # 受保护页（/dashboard）→ 渲染 src/views/dashboard/DashboardView
└── api/
    ├── data/
    │   └── route.ts        # 数据接口（/api/data，缓存优先 + 爬虫脚本）
    └── auth/
        └── [...all]/
            └── route.ts    # Better Auth 认证端点（/api/auth/*）
src/views/                  # 页面组件（每个页面一个文件夹：TSX + CSS Module）
src/components/             # 公共组件（如 keyboard-navigator）
src/hooks/                  # 自定义 Hooks（如 use-key-navigation）
src/router/                 # 路由注册表 routes.tsx + 快捷键映射 keymap.ts
src/styles/                 # 全局样式（globals.css + custom/theme.css）
```

## 认证相关页面（/login /register /dashboard）

- 认证页面为**动态路由**（`export const dynamic = 'force-dynamic'`），通过
  `getServerSession()`（`src/lib/session.ts`）读取 Cookie 对应会话；
- 服务端组件会读取 Cloudflare 环境（`getCloudflareContext()`），本地开发时由
  `next.config.ts` 中的 `initOpenNextCloudflareForDev()` 提供本地 D1；
- `/dashboard` 未登录时 307 重定向到 `/login`；已登录访问 `/login`、`/register`
  时重定向到 `/dashboard`；
- 认证页面属于“会话驱动页面”，不会出现在顶部导航/快捷键中，因此**不注册到**
  `src/router/routes.tsx` 的 `PAGE_REGISTRY`（与首页/关于页不同）；
- 完整说明见仓库根目录 [docs/auth-guide.md](../../docs/auth-guide.md)。

## 页面渲染机制

- `src/app/<route>/page.tsx` 为**服务端组件**：导出 `metadata`，渲染对应页面组件；
- 页面组件（`src/views/**`）负责内容与交互，交互逻辑全部由 React（Hooks/事件）承载；
- 无任何 HTML 模板字符串、内联脚本或手动 `<script>` 标签；
- Cloudflare RUM 由边缘自动注入，仓库内不做手动干预。

## 如何添加新页面

1. 在 `src/views/` 新建文件夹（如 `projects/`），创建 `ProjectsPage.tsx` + `ProjectsPage.module.css`；
2. 在 `src/router/routes.tsx` 的 `PAGE_REGISTRY` 中注册（id / path / title / description）；
3. 新建路由目录与组件，例如 `src/app/projects/page.tsx`：

   ```tsx
   import type { Metadata } from 'next';
   import ProjectsPage from '@/views/projects/ProjectsPage';
   import { requirePageRoute } from '@/router/routes';

   const route = requirePageRoute('projects');

   export const metadata: Metadata = { title: route.title, description: route.description };

   export default function Projects() {
     return <ProjectsPage />;
   }
   ```

4. 访问 `/projects` 即可。页面间互链使用 `getPagePath('projects')` 获取路径。

> 详细流程与目录规范见 [BUILD_GUIDE.md](../../BUILD_GUIDE.md)。

## 如何添加全局/局部样式

- 全局样式：修改 `src/styles/globals.css`（基础样式）或 `src/styles/custom/theme.css`（设计变量）；
- 局部样式：在页面组件同目录创建 `*.module.css`（CSS Modules，类名 camelCase）并 import 使用。

## 如何添加交互/脚本

- 页面交互：直接在页面组件（客户端组件，文件顶部 `'use client';`）中用 Hooks/事件实现；
- 全局快捷键：修改 `src/router/keymap.ts` 映射，监听逻辑见 `src/hooks/use-key-navigation.ts`；
- 不需要也不能手动插入 `<script>` 标签（RUM 除外，由 Cloudflare 边缘自动注入）。

## 注意事项

- 页面保持服务端渲染（默认 RSC），HTML 直接可被爬虫抓取；不要在客户端组件中放置 `metadata`；
- `src/views/**` 中组件如无交互需求，保持为服务端组件（无需 `'use client'`）；
- 常规页面（出现在导航/快捷键中）务必在 `routes.tsx` 注册；会话驱动的认证页
  （login / register / dashboard）属于例外，无需注册导航，但需保持 `dynamic = 'force-dynamic'`。

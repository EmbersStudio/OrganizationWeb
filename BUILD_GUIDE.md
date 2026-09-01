# BUILD_GUIDE · 构建与开发指南

本项目已迁移为 **纯 TypeScript + React（Next.js App Router）+ CSS Modules** 开发体系：

- 所有页面由 **TSX 组件** 生成 DOM（不再有 HTML 模板字符串 / `dangerouslySetInnerHTML`）；
- 所有业务逻辑、事件绑定、路由、快捷键均由 **TypeScript** 编写并随构建产物打包；
- 全局基础样式在入口统一导入，页面/组件专属样式使用 **CSS Modules**（自动哈希隔离）；
- 仓库内**不再手动插入任何 `<script>` 标签**（Cloudflare RUM 由边缘自动注入，勿手动干预）。

---

## 一、目录结构规范

```
.
├── config/                    # 全局配置（缓存 cache.ts、爬虫脚本注册表 scripts.ts）
├── public/                    # 静态资源（图片/字体/_headers），不含任何脚本或页面样式
├── scripts/                   # 构建辅助脚本
├── src/
│   ├── app/                   # Next.js App Router 路由层（page.tsx / layout.tsx / api/）
│   ├── pages/                 # ★ 页面组件：每个页面一个文件夹
│   │   ├── home/
│   │   │   ├── HomePage.tsx          # 页面组件
│   │   │   └── HomePage.module.css   # 页面专属样式（CSS Modules）
│   │   └── about/
│   │       ├── AboutPage.tsx
│   │       ├── AboutPage.module.css
│   │       └── members.ts            # 页面私有数据/类型
│   ├── components/            # 公共组件（跨页面复用），如 keyboard-navigator.tsx
│   ├── hooks/                 # 自定义 Hooks，如 use-key-navigation.ts
│   ├── utils/                 # 纯函数工具（不含 React 依赖）
│   ├── router/                # 路由注册表 routes.tsx + 快捷键映射 keymap.ts
│   ├── styles/                # 全局样式（globals.css 基础样式、custom/theme.css 设计变量）
│   ├── types/                 # 跨模块共享类型定义
│   ├── lib/                   # 服务端/核心库（kv.ts、cache-manager.ts 等）
│   └── scripts/               # 爬虫脚本框架（base-scraper.ts 等）
├── next.config.ts / tsconfig.json / wrangler.toml
└── package.json
```

命名约定：

| 内容        | 命名规则                                      | 示例                    |
| ----------- | --------------------------------------------- | ----------------------- |
| 组件文件    | `PascalCase.tsx`                              | `HomePage.tsx`          |
| CSS Modules | 与组件同名 `*.module.css`，类名 **camelCase** | `AboutPage.module.css`  |
| Hooks       | `use-<name>.ts`                               | `use-key-navigation.ts` |
| 工具/常量   | kebab-case                                    | `format-date.ts`        |
| 路由注册 id | kebab-case 小写                               | `home`、`about`         |

> 入口说明：Next.js App Router 中 `src/app/layout.tsx` 等价于 Vite 项目的
> `main.tsx`——全局样式在此导入，根组件与全局监听（如快捷键）在此挂载。

---

## 二、如何创建新页面

以新增页面 `projects`（路径 `/projects`）为例：

### 1. 创建页面文件夹与组件

```bash
mkdir -p src/pages/projects
```

```tsx
// src/pages/projects/ProjectsPage.tsx
import styles from './ProjectsPage.module.css';

interface ProjectsPageProps {
  /** 例如：来自路由注册表的其他页面路径 */
  homeHref?: string;
}

export default function ProjectsPage({ homeHref = '/' }: ProjectsPageProps) {
  return (
    <main>
      <div className={styles.page}>
        <h1>项目</h1>
        <a href={homeHref}>← 返回首页</a>
      </div>
    </main>
  );
}
```

```css
/* src/pages/projects/ProjectsPage.module.css（类名 camelCase） */
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
}
```

### 2. 在路由注册表中注册

编辑 `src/router/routes.tsx`，在 `PAGE_REGISTRY` 末尾追加：

```ts
{
  id: 'projects',
  path: '/projects',
  title: '项目',
  description: 'EmbersStudio 项目页',
},
```

### 3. 创建 App Router 路由页

```bash
mkdir -p src/app/projects
```

```tsx
// src/app/projects/page.tsx
import type { Metadata } from 'next';

import ProjectsPage from '@/pages/projects/ProjectsPage';
import { getPagePath, requirePageRoute } from '@/router/routes';

const route = requirePageRoute('projects');

export const metadata: Metadata = {
  title: route.title,
  description: route.description,
};

export default function Projects() {
  return <ProjectsPage homeHref={getPagePath('home')} />;
}
```

### 4. 访问 `/projects` 即可

- 开发模式：`http://localhost:3000/projects`；
- 生产构建后由 Next.js 服务端/静态渲染，HTML 可直接被爬虫抓取。

> 若页面需要客户端交互（事件、state），在组件文件顶部加 `'use client';`，
> 元信息（metadata）仍写在 `src/app/**/page.tsx`（服务端）中。

---

## 三、如何在导航中注册页面

本项目为 MPA 风格的页面互链（首页 ↔ 关于页），导航链接统一从注册表取路径：

```ts
import { getPagePath } from '@/router/routes';

const aboutPath = getPagePath('about'); // → '/about'
```

- **服务端组件**（如 `HomePage`）通过 props 接收注册表路径：`<HomePage nextHref={getPagePath('about')} />`；
- **客户端组件**同理，由服务端路由页传入路径 prop；
- 若未来需要全局导航栏：在 `src/components/` 新建 `SiteNav.tsx`，遍历 `PAGE_REGISTRY`
  生成菜单（`<Link href={route.path}>{route.title}</Link>`），并挂载到 `src/app/layout.tsx`。

> 原则：页面路径只在 `routes.tsx` 写一次，其他位置一律通过 `getPagePath` 获取，
> 避免硬编码路径导致导航失同步。

---

## 四、如何为指定按键绑定页面

快捷键映射集中在 `src/router/keymap.ts`：

```ts
export const KEY_NAV_MAP: Readonly<Record<string, string>> = {
  h: 'home', // 按 h 跳转首页
  a: 'about', // 按 a 跳转关于页
  // p: 'projects', // 新增：按 p 跳转项目页
};
```

- 键值使用小写字母（Hook 内部会 `toLowerCase()`）；
- 值为注册表中的**页面 id**，路径由 `getPagePath` 解析；
- 全局监听器由 `src/hooks/use-key-navigation.ts` 提供（`useEffect` 注册/注销），
  已通过 `src/components/keyboard-navigator.tsx` 挂载于根布局，无需每个页面重复绑定；
- 自动忽略：带修饰键（Ctrl/Alt/Meta/Shift）的按键、输入类元素
  （input/textarea/select/contentEditable）中的按键、IME 组合输入。

新增快捷键：在 `KEY_NAV_MAP` 加一行即可，无需改动其他文件。

---

## 五、构建与开发命令

| 命令                              | 说明                                             |
| --------------------------------- | ------------------------------------------------ |
| `npm install`                     | 安装依赖                                         |
| `npm run dev`                     | 启动开发服务器（http://localhost:3000）          |
| `npm run build`                   | Next.js 生产构建                                 |
| `npm run build:opennext`          | OpenNext 完整构建（生成 `.open-next/worker.js`） |
| `npm run preview`                 | Wrangler 本地预览（模拟 Cloudflare 环境）        |
| `npm run deploy`                  | 部署到 Cloudflare Workers                        |
| `npm run typecheck`               | TypeScript 类型检查（`tsc --noEmit`）            |
| `npm run lint` / `lint:fix`       | ESLint 检查 / 自动修复                           |
| `npm run format` / `format:check` | Prettier 格式化 / 检查                           |

提交前必做：

```bash
npm run format
npm run lint
npm run typecheck
```

---

## 六、常见问题与注意事项

1. **RUM 与脚本**：仓库内禁止手动插入 `<script>`（包括 `next/script`）。
   Cloudflare Web Analytics 的 RUM（`beacon.min.js` + `/cdn-cgi/rum`）由边缘自动注入，
   不做任何手动干预；如确需调整请走 Cloudflare Dashboard 配置。
2. **爬虫/SEO**：页面保持服务端渲染（默认 RSC），HTML 直接可抓取；
   页面标题/描述通过 `metadata` 导出维护，新增页面记得同步。
3. **CSS Modules**：类名使用 camelCase；不要在全局 `globals.css` 中写页面专属样式，
   避免样式泄漏；全局只放 reset、字体、颜色变量等基础样式。
4. **KV 缓存**：`src/lib/kv.ts` + `config/cache.ts` 不受前端迁移影响；
   `USE_CACHE=false` 可切换实时抓取模式，TTL 默认 3600 秒。
5. **爬虫脚本**：新增脚本在 `src/scripts/` 实现 `ScraperScript` 接口，
   并注册到 `config/scripts.ts`，通过 `GET /api/data?script=<name>` 调用。
6. **类型检查**：`npm run build` 前确保 `npm run typecheck` 通过；
   若在 Windows 上构建 OpenNext 较慢，建议用 CI（Linux）或 WSL。
7. **路径别名**：`@/*` → `./src/*`，`@config/*` → `./config/*`（见 `tsconfig.json`）。

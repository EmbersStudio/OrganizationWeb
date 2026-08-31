# 前端模块说明（src/app）

本项目使用 **Next.js App Router** 组织页面路由，页面内容统一存放在独立的 HTML 文件中，
尽量做到「改内容不改代码」。

## 目录结构

```
src/app/
├── layout.tsx              # 全局布局（引入公共 CSS/JS）
├── page.tsx                # 首页（/）→ 渲染 content/pages/home.html
├── about/
│   └── page.tsx            # 关于页（/about）→ 渲染 content/pages/about.html
└── api/                    # 后端接口（见任务 3）
src/content/pages/          # 页面 HTML 文件（home.html、about.html、...）
src/styles/                 # 全局样式（globals.css + custom/ 自定义样式）
public/scripts/             # 公共 JS 脚本（global.js、...）
```

## 页面渲染机制

- 每个页面组件的 `page.tsx` 在**服务端**调用 `loadPageHTML(pageName)` 读取 HTML。
- HTML 通过 `dangerouslySetInnerHTML` 注入渲染，因此 HTML 文件可以是任意结构片段。
- 页面模板统一由 `layout.tsx` 提供 `<html>/<body>` 骨架，HTML 文件内**不要**再写
  `<html>`、`<head>`、`<body>` 标签。

## 如何添加新页面

1. 在 `src/content/pages/` 新建 `your-page.html`（只写内容片段）。
2. 新建路由目录与组件，例如 `src/app/your-page/page.tsx`：

   ```tsx
   import type { Metadata } from 'next';
   import { loadPageHTML } from '@/lib/html-loader';

   export const metadata: Metadata = { title: '你的页面' };

   export default async function YourPage() {
     const html = await loadPageHTML('your-page');
     return <main dangerouslySetInnerHTML={{ __html: html }} />;
   }
   ```

3. 访问 `/your-page` 即可。如需动态路由（如 `/posts/[slug]`），
   在目录中新建 `[slug]/page.tsx` 并在组件内读取路由参数后传入
   `loadPageHTML(slug)`（注意 `html-loader` 已做名称合法性校验）。

## 如何添加全局/局部样式

- 全局样式：在 `src/styles/custom/` 下新建 `*.css`，然后在 `layout.tsx` 顶部
  `import '@/styles/custom/xxx.css';` 即可；也可直接修改 `src/styles/globals.css`。
- 局部样式：在页面组件同级目录创建 `xxx.module.css` 并使用 CSS Modules。

## 如何添加 JS 脚本

- 公共脚本：在 `public/scripts/` 下添加 `*.js`，然后在 `layout.tsx` 中用
  `<Script src="/scripts/xxx.js" strategy="afterInteractive" />` 引入。
- 页面级脚本：在对应 `page.tsx` 中按需引入 `<Script>`。

## 页面级 CSS / JS（按页加载）

除全局样式/脚本外，每个页面可以在自己的 HTML 文件顶部声明**专属资源**，
只有该页面会加载它们：

```html
<!-- src/content/pages/your-page.html -->
<link rel="stylesheet" href="/styles/pages/your-page.css" />
<script src="/scripts/pages/your-page.js"></script>
<!-- ...页面内容片段... -->
```

- **CSS**：文件放在 `public/styles/pages/<page>.css`，经 `<link>` 声明，
  仅当访问该页面时浏览器才会请求并应用（CSS 文件按页面独立，互不影响）。
- **JS**：文件放在 `public/scripts/pages/<page>.js`，经 `<script src>` 声明；
  `HtmlPage` 会通过 Next 的 `<Script>` 组件挂载，保证脚本能正常执行
  （写在 HTML 里的内联 `<script>` 无法通过 `dangerouslySetInnerHTML` 执行，会被忽略并告警）。

对应关系：

| 页面 HTML                      | 页面 CSS 文件                   | 页面 JS 文件                    |
| ------------------------------ | ------------------------------- | ------------------------------- |
| `src/content/pages/home.html`  | `public/styles/pages/home.css`  | `public/scripts/pages/home.js`  |
| `src/content/pages/about.html` | `public/styles/pages/about.css` | `public/scripts/pages/about.js` |

> 资源声明标签会被 `src/lib/html-loader.ts` 自动提取，不会残留在渲染内容中。

## 注意事项

- `dangerouslySetInnerHTML` 不会对内容做 XSS 过滤。当前 HTML 文件由项目自身维护，
  请勿在其中插入不可信的外部内容；如后续引入用户输入，请先做转义或消毒（sanitize）。

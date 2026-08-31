# 内容目录说明（src/content）

## pages/

每个页面一个 `*.html` 文件，是页面内容的**唯一来源**。
文件名即页面名（不含扩展名），例如 `home.html` 对应 `loadPageHTML('home')`。

- 文件内只写内容片段（`<section>`、`<h1>` 等），不要包含 `<html>/<head>/<body>`。
- 新增页面：新建 HTML + 对应 `src/app/<route>/page.tsx`（见 `src/app/README.md`）。

## pages.generated.ts

由 `scripts/generate-pages-manifest.mjs` **自动生成**，请勿手动编辑。

- 内容：页面名 → HTML 字符串的映射；
- 用途：Cloudflare Worker 运行时无法读取源码文件系统，构建期将 HTML 打包进 Worker；
- 重新生成：`npm run generate:pages`（`npm run dev` / `npm run build` 前会自动执行）。

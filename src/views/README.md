# 页面组件目录（src/views）

每个页面一个文件夹，文件夹内包含：

- `<Page>Page.tsx` —— 页面组件（TSX，函数式组件 + Hooks，服务端组件优先）；
- `<Page>Page.module.css` —— 页面专属样式（CSS Modules，类名使用 camelCase）；
- 可选：页面私有数据/常量文件（如 `members.ts`）。

页面组件不直接承担路由职责：路由由 `src/app/**/page.tsx`（Next.js App Router）声明，
并通过 `src/router/routes.tsx` 的页面注册表统一注册。

> 说明：Next.js App Router 下 `src/app/page.tsx` 即页面入口（等价于 Vite 的 `main.tsx` +
> 路由表），页面 UI 与样式统一放在本目录，保证「一个页面 = 一个文件夹」。
>
> ⚠️ 为什么是 `src/views` 而不是 `src/pages`：`src/pages` 是 Next.js **Pages Router**
> 的保留目录，会触发旧版页面路由类型校验；本项目使用 App Router，故使用 `src/views`
> 承载页面组件（见 BUILD_GUIDE.md）。

# 页面组件目录（src/views）

每个页面一个文件夹，文件夹内包含：

- 页面组件（TSX，函数式组件 + Hooks，服务端组件优先）；
- 同名 `*.module.css` —— 页面专属样式（CSS Modules，类名使用 camelCase）；
- 可选：页面私有数据/常量文件（如 `members.ts`）。

页面组件不直接承担路由职责：路由由 `src/app/**/page.tsx`（Next.js App Router）声明，
常规页面通过 `src/router/routes.tsx` 的页面注册表统一注册。

> 说明：Next.js App Router 下 `src/app/page.tsx` 即页面入口（等价于 Vite 的 `main.tsx` +
> 路由表），页面 UI 与样式统一放在本目录，保证「一个页面 = 一个文件夹」。
>
> ⚠️ 为什么是 `src/views` 而不是 `src/pages`：`src/pages` 是 Next.js **Pages Router**
> 的保留目录，会触发旧版页面路由类型校验；本项目使用 App Router，故使用 `src/views`
> 承载页面组件。

## 目录清单

| 目录         | 内容                                                 | 对应路由              |
| ------------ | ---------------------------------------------------- | --------------------- |
| `home/`      | `HomePage.tsx` + CSS Module                          | `/`                   |
| `about/`     | `AboutPage.tsx` + CSS Module + `members.ts`          | `/about`              |
| `auth/`      | `AuthView.tsx` + CSS Module（登录/注册共用视图）     | `/login`、`/register` |
| `dashboard/` | `DashboardView.tsx` + CSS Module（受保护页，含登出） | `/dashboard`          |

## 命名例外

- `auth/AuthView` 被两个路由（`/login`、`/register`）复用，属于共享页面视图而非
  单一路由页面，因此使用 `<Name>View` 命名并放在公共 `auth/` 目录；
- `dashboard/DashboardView` 由服务端页面 `src/app/dashboard/page.tsx` 传入会话数据
  渲染（登出交互在客户端完成），也不以路由名重复命名；
- 认证相关页面不注册到导航/快捷键，详见 [docs/auth-guide.md](../../docs/auth-guide.md)。

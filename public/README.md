# 静态资源目录说明（public）

该目录下的文件会原样发布到站点根路径。例如：

- `public/images/logo.png` → `/images/logo.png`
- `public/_headers` → Cloudflare Workers Static Assets 响应头规则

> 迁移说明：旧的手动脚本（`public/scripts/**`）与页面级 CSS（`public/styles/pages/**`）
> 已随「纯 TypeScript + CSS Modules」改造移除。所有前端逻辑与样式均来自
> `src/pages` / `src/components` / `src/hooks`（经 Next.js 打包），
> 本目录仅保留真正需要原样发布的静态文件与边缘配置。

## 常用用途

| 文件/目录  | 用途                                                          |
| ---------- | ------------------------------------------------------------- |
| `images/`  | 图片资源（如 logo、favicon）                                  |
| `fonts/`   | 字体文件                                                      |
| `_headers` | Cloudflare Workers Static Assets 响应头规则（构建期自动生效） |

## 如何添加静态资源

1. 将文件放入 `public/` 下对应目录（`images/`、`fonts/` 等）；
2. 在代码中以根路径引用：`/images/logo.png`。

> 组件内的图片、字体等资源如无特殊需要，也可直接放在 `src/pages/**` 同目录下
> 由构建工具处理（自动哈希、缓存友好）。

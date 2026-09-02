# 静态资源目录说明（public）

该目录下的文件会原样发布到站点根路径。例如：

- `public/images/logo.png` → `/images/logo.png`
- `public/_headers` → Cloudflare Workers Static Assets 响应头规则

> 本目录仅保留真正需要原样发布的静态文件与边缘配置

## 常用用途

| 文件/目录  | 用途                                                          |
| ---------- | ------------------------------------------------------------- |
| `images/`  | 图片资源（如 logo、favicon）                                  |
| `fonts/`   | 字体文件                                                      |
| `_headers` | Cloudflare Workers Static Assets 响应头规则（构建期自动生效） |

## 如何添加静态资源

1. 将文件放入 `public/` 下对应目录（`images/`、`fonts/` 等）；
2. 在代码中以根路径引用：`/images/logo.png`。

> 组件内的图片、字体等资源如无特殊需要，也可直接放在 `src/views/**` 同目录下
> 由构建工具处理

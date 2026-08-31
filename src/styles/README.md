# 样式目录说明（src/styles）

| 文件               | 作用                                |
| ------------------ | ----------------------------------- |
| `globals.css`      | 全局基础样式（reset、字体、颜色等） |
| `custom/theme.css` | 自定义主题样式（示例）              |

## 如何添加样式

- 全局样式：在 `custom/` 下新建 `*.css`，并在 `src/app/layout.tsx` 中 import。
- 页面局部样式：在对应页面组件目录使用 CSS Modules（`xxx.module.css`）。

## 页面级样式

每个页面专属的 CSS 文件放在 `public/styles/pages/<page>.css`，
并在页面 HTML 中声明引用（详见 `src/app/README.md` 的「页面级 CSS / JS」一节）：

```html
<link rel="stylesheet" href="/styles/pages/about.css" />
```

- 页面级 CSS 只在该页面访问时加载，适合整页主题（背景、字体、布局）。
- 全局基础样式（`globals.css`）与主题样式（`custom/theme.css`）始终加载。

# 样式目录说明（src/styles）

| 文件               | 作用                                |
| ------------------ | ----------------------------------- |
| `globals.css`      | 全局基础样式（reset、字体、颜色等） |
| `custom/theme.css` | 自定义主题样式（示例）              |

## 如何添加样式

- 全局样式：在 `custom/` 下新建 `*.css`，并在 `src/app/layout.tsx` 中 import。
- 页面局部样式：在对应页面组件目录使用 CSS Modules（`xxx.module.css`）。

# 样式目录说明（src/styles）

本项目样式遵循「全局基础样式 + 页面 CSS Modules」的架构：

| 文件/目录             | 作用                                                           |
| --------------------- | -------------------------------------------------------------- |
| `globals.css`         | 全局基础样式：reset、`color-scheme`、body 字体/颜色/背景/行高  |
| `custom/theme.css`    | 设计变量（颜色、排版、间距等 CSS 自定义属性）                  |
| 各页面 `*.module.css` | 页面/组件专属样式（CSS Modules，类名 camelCase，自动哈希隔离） |

## 全局样式

`src/styles/globals.css` 与 `src/styles/custom/theme.css`
在入口 `src/app/layout.tsx` 中导入（等价于 Vite 的 `main.tsx` 导入）：

```tsx
import '@/styles/globals.css';
import '@/styles/custom/theme.css';
```

- 新增全局基础样式 → 修改 `globals.css`；
- 新增设计变量 → 修改 `custom/theme.css` 的 `:root`。

## 页面/组件样式（CSS Modules）

页面与组件的专属样式放在同目录下的 `*.module.css`：

```tsx
import styles from './HomePage.module.css';

export default function HomePage() {
  return <h1 className={styles.brand}>EmbersStudio</h1>;
}
```

- 类名使用 camelCase（如 `bodyWrapper`、`memberChipActive`），便于 `styles.xxx` 直接引用；
- 构建时类名自动哈希，页面之间样式互相隔离，不会冲突；
- 禁止在全局 CSS 中写入页面专属样式，避免泄漏到其他页面。

> 旧的 `public/styles/pages/*.css` 页面级样式已随迁移移除，统一收敛为 CSS Modules。

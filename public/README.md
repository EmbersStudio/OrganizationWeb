# 静态资源目录说明（public）

该目录下的文件会原样发布到站点根路径，例如：

- `public/scripts/global.js` → `/scripts/global.js`
- `public/images/logo.png` → `/images/logo.png`
- `public/styles/pages/about.css` → `/styles/pages/about.css`

## 常用用途

| 目录             | 用途                                                 |
| ---------------- | ---------------------------------------------------- |
| `scripts/`       | 公共前端 JS 脚本（全局加载）                         |
| `scripts/pages/` | 页面级 JS（仅对应页面加载，见 `src/app/README.md`）  |
| `styles/pages/`  | 页面级 CSS（仅对应页面加载，见 `src/app/README.md`） |
| `images/`        | 图片资源                                             |
| `fonts/`         | 字体文件                                             |

## 如何添加全局脚本

1. 在 `public/scripts/` 新建 `xxx.js`；
2. 在 `src/app/layout.tsx` 中引入：

   ```tsx
   import Script from 'next/script';
   // ...
   <Script src="/scripts/xxx.js" strategy="afterInteractive" />;
   ```

## 如何添加页面级 CSS / JS

1. CSS 放到 `public/styles/pages/<page>.css`，JS 放到 `public/scripts/pages/<page>.js`；
2. 在对应页面 HTML 顶部声明引用：

   ```html
   <link rel="stylesheet" href="/styles/pages/<page>.css" />
   <script src="/scripts/pages/<page>.js"></script>
   ```

3. 这些标签由 `src/lib/html-loader.ts` 自动提取并仅在该页面挂载（详见 `src/app/README.md`）。

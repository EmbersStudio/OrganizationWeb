# 静态资源目录说明（public）

该目录下的文件会原样发布到站点根路径，例如：

- `public/scripts/global.js` → `/scripts/global.js`
- `public/images/logo.png` → `/images/logo.png`

## 常用用途

| 目录       | 用途             |
| ---------- | ---------------- |
| `scripts/` | 公共前端 JS 脚本 |
| `images/`  | 图片资源         |
| `fonts/`   | 字体文件         |

## 如何添加公共脚本

1. 在 `public/scripts/` 新建 `xxx.js`；
2. 在 `src/app/layout.tsx` 中引入：

   ```tsx
   import Script from "next/script";
   // ...
   <Script src="/scripts/xxx.js" strategy="afterInteractive" />;
   ```

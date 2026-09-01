import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// 全局样式：可在此自由添加更多 CSS 文件（如 src/styles/custom/*.css）
import '@/styles/globals.css';
import '@/styles/custom/theme.css';

export const metadata: Metadata = {
  title: {
    default: 'EmbersStudio',
    template: '%s | EmbersStudio',
  },
  description: 'From the Embers, we build.',
};

/**
 * 全局布局：为所有页面提供统一的 HTML 骨架，并引入公共 CSS。
 *
 * 脚本约定（纯 TypeScript 迁移后）：
 * - 仓库内不再手动插入任何 <script> 标签（包括 next/script）；
 * - Cloudflare Web Analytics（RUM：beacon.min.js + /cdn-cgi/rum）由 Cloudflare 边缘
 *   自动注入，仓库不做任何手动干预；
 * - 所有业务逻辑、事件绑定、快捷键等均由 TSX 组件 / Hooks 承载，随打包产物加载。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

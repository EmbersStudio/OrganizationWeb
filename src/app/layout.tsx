import type { Metadata } from 'next';
import Script from 'next/script';
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
 * 全局布局：为所有页面提供统一的 HTML 骨架，并引入公共 CSS/JS。
 * 新增公共脚本时，在 public/scripts/ 下添加文件并通过 <Script> 引用。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Script src="/scripts/global.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

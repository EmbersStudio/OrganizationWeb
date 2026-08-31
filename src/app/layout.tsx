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
 * Cloudflare Web Analytics（RUM）手动异步接入。
 *
 * 背景：Cloudflare 在 HTML 响应边缘自动注入的 RUM（beacon.min.js + /cdn-cgi/rum）
 * 会进入首屏关键链路，且该注入代码不在本仓库内、无法直接修改。
 * 正确做法是先在 Cloudflare Dashboard → Web Analytics 关闭「自动注入」，
 * 再设置 NEXT_PUBLIC_CF_BEACON_TOKEN 并重新部署；RUM 脚本将通过
 * next/script（afterInteractive = async）在页面交互后加载，不再阻塞首屏。
 * 未设置 Token 时不加载任何 RUM 脚本。
 */
const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

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
        {cfBeaconToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            {...{ 'data-cf-beacon': JSON.stringify({ token: cfBeaconToken }) }}
          />
        ) : null}
      </body>
    </html>
  );
}

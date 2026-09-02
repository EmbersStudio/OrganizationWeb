import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import KeyboardNavigator from '@/components/keyboard-navigator';
import SiteNav from '@/components/site-nav';
import { I18nProvider } from '@/i18n';

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
 * - I18nProvider 提供语言上下文（导航语言切换与页面文案共享）；
 * - SiteNav 为统一顶部导航栏（基于 Card/Button/Dropdown，支持溢出折叠）；
 * - KeyboardNavigator 挂载全局快捷键监听。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <I18nProvider>
          <SiteNav />
          {children}
          <KeyboardNavigator />
        </I18nProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';

import HtmlPage from '@/components/html-page';

export const metadata: Metadata = {
  title: '首页',
  description: 'EmbersStudio 首页，内容由 content/pages/home.html 提供',
};

/**
 * 首页：渲染 content/pages/home.html（含页面级 CSS/JS）。
 */
export default function Home() {
  return <HtmlPage page="home" />;
}

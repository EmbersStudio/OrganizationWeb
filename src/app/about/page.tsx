import type { Metadata } from 'next';

import HtmlPage from '@/components/html-page';

export const metadata: Metadata = {
  title: '关于 · 余烬工作室',
  description: 'EmbersStudio 关于页，内容由 content/pages/about.html 提供',
};

/**
 * 关于页：渲染 content/pages/about.html（含页面级 CSS/JS）。
 */
export default function About() {
  return <HtmlPage page="about" />;
}

import type { Metadata } from 'next';

import AboutPage from '@/pages/about/AboutPage';

export const metadata: Metadata = {
  title: '关于 · 余烬工作室',
  description: 'EmbersStudio 关于页，由 TSX 组件渲染',
};

/**
 * 关于页：渲染 src/pages/about/AboutPage（原 about.html 迁移）。
 */
export default function About() {
  return <AboutPage />;
}

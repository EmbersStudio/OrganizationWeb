import type { Metadata } from 'next';

import HomePage from '@/pages/home/HomePage';

export const metadata: Metadata = {
  title: '首页',
  description: 'EmbersStudio 首页，由 TSX 组件渲染',
};

/**
 * 首页：渲染 src/pages/home/HomePage（原 home.html 迁移）。
 */
export default function Home() {
  return <HomePage />;
}

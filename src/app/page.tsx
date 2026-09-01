import type { Metadata } from 'next';

import HomePage from '@/views/home/HomePage';
import { getPagePath, requirePageRoute } from '@/router/routes';

/** 首页路由注册项（来自 src/router/routes.tsx） */
const homeRoute = requirePageRoute('home');

export const metadata: Metadata = {
  title: homeRoute.title,
  description: homeRoute.description,
};

/**
 * 首页：渲染 src/views/home/HomePage（原 home.html 迁移），
 * “了解更多”链接目标取自路由注册表。
 */
export default function Home() {
  return <HomePage nextHref={getPagePath('about')} />;
}

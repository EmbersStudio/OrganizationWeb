import type { Metadata } from 'next';

import { HomePage } from '@/views';
import { getPagePath, requirePageRoute } from '@/router/routes';

/** 首页路由注册项（来自 src/router/routes.tsx） */
const homeRoute = requirePageRoute('home');

export const metadata: Metadata = {
  title: homeRoute.title,
  description: homeRoute.description,
};

/**
 * 首页：渲染 src/views/home/HomePage
 */
export default function Home() {
  return <HomePage />;
}

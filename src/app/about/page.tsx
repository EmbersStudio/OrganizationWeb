import type { Metadata } from 'next';

import { AboutPage } from '@/views';
import { getPagePath, requirePageRoute } from '@/router/routes';

/** 关于页路由注册项（来自 src/router/routes.tsx） */
const aboutRoute = requirePageRoute('about');

export const metadata: Metadata = {
  title: aboutRoute.title,
  description: aboutRoute.description,
};

/**
 * 关于页：渲染 src/views/about/AboutPage（原 about.html 迁移），
 * “返回首页”链接目标取自路由注册表。
 */
export default function About() {
  return <AboutPage backHref={getPagePath('home')} />;
}

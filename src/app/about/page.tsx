import { cookies } from 'next/headers';

import { AboutPage } from '@/views';
import { getPagePath, requirePageRoute } from '@/router/routes';

/** 关于页路由注册项（来自 src/router/routes.tsx） */
const aboutRoute = requirePageRoute('about');

export async function generateMetadata() {
  const route = requirePageRoute('about');
  const cookieStore = await cookies();
  const locale = (cookieStore.get('embersstudio.locale')?.value as 'zh' | 'en') || 'zh';
  return {
    title: route.title[locale],
    description: route.description?.[locale] ?? '',
  };
}

/**
 * 关于页：渲染 src/views/about/AboutPage
 */
export default function About() {
  return <AboutPage />;
}

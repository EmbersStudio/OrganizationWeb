import { cookies } from 'next/headers';

import { HomePage } from '@/views';
import { requirePageRoute } from '@/router/routes';

/** 首页路由注册项（来自 src/router/routes.tsx） */
const homeRoute = requirePageRoute('home');

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('embersstudio.locale')?.value as 'zh' | 'en') || 'zh';
  return {
    title: homeRoute.title[locale],
    description: homeRoute.description?.[locale] ?? '',
  };
}
/**
 * 首页：渲染 src/views/home/HomePage
 */
export default function Home() {
  return <HomePage />;
}

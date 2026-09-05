/**
 * 页面组件统一导出（页面注册表）
 */

import AboutPage from '@/views/about/AboutPage';
import { AuthView } from '@/views/auth/AuthView';
import { DashboardView } from '@/views/dashboard/DashboardView';
import HomePage from '@/views/home/HomePage';

export { AboutPage, AuthView, DashboardView, HomePage };

/** 页面 id → 组件映射（供需要动态分发/校验的场景使用） */
export const PAGES = {
  home: HomePage,
  about: AboutPage,
} as const;

/** 页面 id 联合类型 */
export type PageId = keyof typeof PAGES;

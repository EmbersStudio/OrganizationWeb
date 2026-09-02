/**
 * 页面组件统一导出（相当于页面注册表）。
 *
 * ⚠️ 不使用 src/pages/index.ts：src/pages 是 Next.js Pages Router 的保留目录，
 * 本项目基于 App Router，页面组件统一放在 src/views。
 *
 * 新增页面流程：
 * 1. 在 src/views/<name>/ 创建页面组件；
 * 2. 在本文件追加 named export（并视需要加入 PAGES 映射）；
 * 3. 在 src/router/routes.tsx 注册路由元信息；
 * 4. 在 src/app/<route>/page.tsx 中渲染。
 */

import AboutPage from '@/views/about/AboutPage';
import HomePage from '@/views/home/HomePage';

export { AboutPage, HomePage };

/** 页面 id → 组件映射（供需要动态分发/校验的场景使用） */
export const PAGES = {
  home: HomePage,
  about: AboutPage,
} as const;

/** 页面 id 联合类型 */
export type PageId = keyof typeof PAGES;

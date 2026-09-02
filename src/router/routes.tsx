import type { Locale } from '@/i18n';

/** 页面路由注册项（导航/元信息/快捷键的公共数据源） */
export interface PageRouteInfo {
  /** 页面唯一标识（导航、快捷键、文档中使用） */
  id: string;
  /** 路由路径（Next.js App Router 路径） */
  path: string;
  /** 多语言标题 */
  title: Record<Locale, string>;
  /** 多语言描述（可选） */
  description?: Record<Locale, string>;
}

/**
 * 页面注册表：所有页面的唯一登记入口。
 *
 * 新增页面流程：
 * 1. 在 src/views/<name>/ 创建页面组件与 CSS Module；
 * 2. 在本数组追加注册项（id / path / title / description）；
 * 3. 在 src/app/<route>/page.tsx 中通过 requirePageRoute('<id>') 获取元信息，
 *    并直接 import 对应组件渲染。
 *
 * 页面之间的导航链接、键盘快捷键映射均以本表为数据源。
 */
export const PAGE_REGISTRY: readonly PageRouteInfo[] = [
  {
    id: 'home',
    path: '/',
    title: {
      zh: '首页 · 余烬工作室',
      en: 'Home · EmbersStudio',
    },
    description: {
      zh: '我们拥抱开源，乐于分享，并期待与志同道合的开发者共同成长。',
      en: 'We embrace open source, enjoy sharing, and look forward to growing together with like-minded developers.',
    },
  },
  {
    id: 'about',
    path: '/about',
    title: {
      zh: '关于 · 余烬工作室',
      en: 'About · EmbersStudio',
    },
    description: {
      zh: '了解余烬工作室的成员、技术栈和理念。',
      en: 'Learn about EmbersStudio\'s members, tech stack, and philosophy.',
    },
  },
];

/** 按 id 查找页面路由（未找到返回 undefined） */
export function getPageRoute(id: string): PageRouteInfo | undefined {
  return PAGE_REGISTRY.find((route) => route.id === id);
}

/** 按 id 获取页面路径（未找到返回 undefined） */
export function getPagePath(id: string): string | undefined {
  return getPageRoute(id)?.path;
}

/**
 * 按 id 获取页面路由；未注册时直接抛错（保证「注册表」与「实际路由」永远同步）。
 */
export function requirePageRoute(id: string): PageRouteInfo {
  const route = getPageRoute(id);
  if (!route) {
    throw new Error(`路由注册表中缺少页面: "${id}"，请先在 src/router/routes.tsx 中注册`);
  }
  return route;
}

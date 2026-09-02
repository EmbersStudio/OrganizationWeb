/**
 * 导航与站点配置（纯数据，不含 UI 逻辑）。
 *
 * 路径一律取自 src/router/routes.tsx 的路由注册表（不在此硬编码），
 * 展示文案使用 i18n 翻译键（见 src/locales/*.json）。
 */

import { PAGE_REGISTRY } from '@/router/routes';

/** 导航项：渲染所需的全部数据 */
export interface NavItem {
  /** 页面 id（与路由注册表一致） */
  id: string;
  /** 目标路径（来自路由注册表） */
  href: string;
  /** 导航文案翻译键 */
  labelKey: string;
}

/* ============ 配置（集中在此，便于增删/调整顺序） ============ */

/** 站点名称 */
export const SITE_NAME = 'EmbersStudio';

/**
 * 导航顺序与文案：数组顺序即导航显示顺序。
 * 新增页面：先注册路由，再在此追加 { id, labelKey }。
 */
const NAV_ORDER: readonly { id: string; labelKey: string }[] = [
  { id: 'home', labelKey: 'nav.home' },
  { id: 'about', labelKey: 'nav.about' },
];

/* ========================================================== */

/** 解析页面路径；注册表缺失时抛出错误保证配置同步 */
function resolveRoute(id: string): string {
  const route = PAGE_REGISTRY.find((item) => item.id === id);
  if (!route) {
    throw new Error(
      '导航配置引用了未注册的页面 id: "' + id + '"，请先在 src/router/routes.tsx 的 PAGE_REGISTRY 中注册',
    );
  }
  return route.path;
}

/** 导航链接列表（组件直接消费本数据） */
export const NAV_ITEMS: readonly NavItem[] = NAV_ORDER.map((item) => ({
  id: item.id,
  href: resolveRoute(item.id),
  labelKey: item.labelKey,
}));

/** 导航项 id 顺序（供溢出检测等使用） */
export const NAV_ITEM_IDS: readonly string[] = NAV_ITEMS.map((item) => item.id);

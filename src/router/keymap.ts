/**
 * 键盘快捷键 → 页面 id 映射。
 *
 * 修改本表即可调整快捷键；目标路径统一通过路由注册表（getPagePath）解析，
 * 保证路径只有 src/router/routes.tsx 一处来源。
 */
export const KEY_NAV_MAP: Readonly<Record<string, string>> = {
  h: 'home',
  a: 'about',
};

/** 将按键（小写）转换为目标页面 id；未配置返回 undefined */
export function getPageIdForKey(key: string): string | undefined {
  return KEY_NAV_MAP[key];
}

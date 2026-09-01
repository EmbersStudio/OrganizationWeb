'use client';

import { useKeyNavigation } from '@/hooks/use-key-navigation';

/**
 * 全局键盘快捷键监听组件（渲染为空节点）。
 *
 * 在根布局中挂载一次即可；按键 → 页面映射见 src/router/keymap.ts。
 */
export default function KeyboardNavigator() {
  useKeyNavigation();
  return null;
}

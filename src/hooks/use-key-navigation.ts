'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { getPageIdForKey } from '@/router/keymap';
import { getPagePath } from '@/router/routes';

/** 需要忽略快捷键的输入类元素（避免在输入框中触发跳转） */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * 全局键盘导航 Hook：按 src/router/keymap.ts 的配置，在按下指定按键时
 * 客户端跳转到对应页面（Next.js App Router 客户端导航）。
 *
 * 规则：
 * - 忽略带修饰键（Ctrl/Alt/Meta/Shift）的按键；
 * - 忽略输入类元素（input/textarea/select/contentEditable）与 IME 组合输入；
 * - 已在目标页面时不重复跳转。
 */
export function useKeyNavigation(): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }
      if (event.isComposing) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }

      const pageId = getPageIdForKey(event.key.toLowerCase());
      if (!pageId) {
        return;
      }
      const path = getPagePath(pageId);
      if (!path || path === pathname) {
        return;
      }

      event.preventDefault();
      router.push(path);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname, router]);
}

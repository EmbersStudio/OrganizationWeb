'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

/** useOverflowDetection 选项 */
export interface UseOverflowDetectionOptions<T extends HTMLElement> {
  /** 可滚动/可容纳子项的容器元素引用（测量 clientWidth） */
  containerRef: RefObject<T | null>;
  /** 子项元素引用表（id -> element） */
  itemRefs: RefObject<Map<string, T | null>>;
  /** 子项 id 的有序列表（DOM 顺序即折叠顺序） */
  itemIds: readonly string[];
  /** 水平保留的像素余量（防止浮点/边框造成的抖动），默认 4 */
  slack?: number;
  /** 文本/字号等影响宽度的因素变化时传入新值，触发全部重新测量 */
  remeasureKey?: string | number;
}

/** useOverflowDetection 返回值 */
export interface OverflowDetectionResult {
  /** 需要折叠进“更多”的子项 id */
  hiddenIds: readonly string[];
  /** 仍展示在容器中的子项 id（顺序与 itemIds 一致） */
  visibleIds: readonly string[];
  /** 是否存在溢出项（用于控制“更多”触发器显隐） */
  needsMore: boolean;
  /** 立即重新计算一次 */
  recalculate: () => void;
}

/**
 * 溢出检测 Hook：在 useLayoutEffect 中测量容器宽度与各子项宽度，
 * 当子项总宽超出容器时，从最右侧开始把子项折叠进“更多”列表。
 *
 * 容器尺寸变化由 ResizeObserver 监听；传入 remeasureKey（如语言切换）
 * 时会先展示全部子项重新测量后再折叠。
 */
export function useOverflowDetection<T extends HTMLElement>({
  containerRef,
  itemRefs,
  itemIds,
  slack = 4,
  remeasureKey,
}: UseOverflowDetectionOptions<T>): OverflowDetectionResult {
  const [hiddenIds, setHiddenIdsState] = useState<readonly string[]>([]);
  const hiddenRef = useRef<readonly string[]>([]);
  const widthCacheRef = useRef(new Map<string, number>());

  const commitHidden = useCallback((next: readonly string[]) => {
    const current = hiddenRef.current;
    const same = current.length === next.length && current.every((id, index) => id === next[index]);
    if (same) {
      return;
    }
    hiddenRef.current = next;
    setHiddenIdsState(next);
  }, []);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container || itemIds.length === 0) {
      return;
    }

    // 采集当前可见子项的真实宽度到缓存
    for (const id of itemIds) {
      const element = itemRefs.current?.get(id) ?? null;
      if (element && element.offsetWidth > 0) {
        widthCacheRef.current.set(id, element.offsetWidth);
      }
    }

    // 从前往后放置子项，放不下的全部折叠
    const available = Math.max(0, container.clientWidth - slack);
    const nextHidden: string[] = [];
    let used = 0;
    for (const id of itemIds) {
      const width = widthCacheRef.current.get(id);
      if (width === undefined) {
        // 尚未测到宽度（首次渲染/被隐藏中）：暂时保留，等待测量
        continue;
      }
      if (used + width <= available) {
        used += width;
      } else {
        nextHidden.push(id);
      }
    }

    commitHidden(nextHidden);
  }, [commitHidden, containerRef, itemIds, itemRefs, slack]);

  // 宽度相关因素变化时，先展示全部项以重新测量
  useLayoutEffect(() => {
    if (remeasureKey !== undefined) {
      commitHidden([]);
    }
  }, [commitHidden, remeasureKey]);

  useLayoutEffect(() => {
    recalculate();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(recalculate);
    observer.observe(container);
    window.addEventListener('resize', recalculate);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recalculate);
    };
  }, [containerRef, hiddenIds, recalculate, remeasureKey]);

  const visibleIds = useMemo(() => itemIds.filter((id) => !hiddenIds.includes(id)), [hiddenIds, itemIds]);

  return {
    hiddenIds,
    visibleIds,
    needsMore: visibleIds.length < itemIds.length,
    recalculate,
  };
}

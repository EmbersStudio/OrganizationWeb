'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown, type DropdownMenuItem } from '@/components/ui/dropdown';
import { useOverflowDetection } from '@/hooks/use-overflow-detection';
import { getPagePath } from '@/router/routes';
import { usePerformanceMode } from '@/utils/device';
import styles from './SiteNav.module.css';

/** 导航链接（展示文本后续任务接入 i18n 后替换为翻译键） */
interface NavEntry {
  id: string;
  href: string;
  label: string;
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { id: 'home', href: getPagePath('home') ?? '/', label: '首页' },
  { id: 'about', href: getPagePath('about') ?? '/about', label: '关于' },
];

const NAV_ITEM_IDS = NAV_ENTRIES.map((entry) => entry.id);

/** 站点名称（可配置） */
const SITE_NAME = 'EmbersStudio';

/**
 * 顶部导航栏：基于 Card + Button + Dropdown 构建。
 *
 * - 左侧品牌、中间导航链接、右侧操作区（更多/语言切换等）；
 * - 当前激活页面下方显示平滑滑动下划线；
 * - 链接过多时自动折叠进“更多”展开栏（useOverflowDetection 动态测量）。
 */
export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { animationsEnabled } = usePerformanceMode();

  const navTrackRef = useRef<HTMLElement | null>(null);
  const linkListRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const itemRefsRef = useRef(new Map<string, HTMLAnchorElement | null>());

  const itemIds = useMemo(() => NAV_ITEM_IDS, []);
  const { visibleIds, hiddenIds, needsMore } = useOverflowDetection({
    containerRef: navTrackRef,
    itemRefs: itemRefsRef,
    itemIds,
  });

  const activeEntry =
    NAV_ENTRIES.find((entry) => {
      if (entry.href === '/') {
        return pathname === '/';
      }
      return pathname === entry.href || pathname.startsWith(entry.href + '/');
    }) ?? null;

  const activeId = activeEntry?.id ?? null;

  // 测量激活链接位置，驱动下划线滑动
  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) {
      return;
    }
    const activeLink = activeId ? (itemRefsRef.current.get(activeId) ?? null) : null;
    if (!activeLink || hiddenIds.includes(activeId ?? '')) {
      indicator.style.width = '0px';
      indicator.style.opacity = '0';
      return;
    }
    indicator.style.width = activeLink.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + activeLink.offsetLeft + 'px)';
    indicator.style.opacity = '1';
  }, [activeId, hiddenIds]);

  const setItemRef = (id: string) => (element: HTMLAnchorElement | null) => {
    itemRefsRef.current.set(id, element);
  };

  const moreItems: readonly DropdownMenuItem[] = hiddenIds.map((id) => {
    const entry = NAV_ENTRIES.find((item) => item.id === id);
    if (!entry) {
      return { id, label: id };
    }
    return {
      id: entry.id,
      label: entry.label,
      selected: entry.id === activeId,
      onClick: () => {
        router.push(entry.href);
      },
    };
  });

  return (
    <header className={[styles.header, animationsEnabled ? '' : styles.lowMotion].filter(Boolean).join(' ')}>
      <Card variant="elevated" radius="xl" padding="none" shadow="md" className={styles.bar}>
        <div className={styles.inner}>
          <Link className={styles.brand} href="/" aria-label={SITE_NAME + ' 首页'}>
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandName}>{SITE_NAME}</span>
          </Link>

          <nav ref={navTrackRef} className={styles.navTrack} aria-label="主导航">
            <div ref={linkListRef} className={styles.linkList}>
              <span ref={indicatorRef} className={styles.indicator} aria-hidden="true" />
              {visibleIds.map((id) => {
                const entry = NAV_ENTRIES.find((item) => item.id === id);
                if (!entry) {
                  return null;
                }
                const active = entry.id === activeId;
                return (
                  <Link
                    key={entry.id}
                    ref={setItemRef(entry.id)}
                    href={entry.href}
                    aria-current={active ? 'page' : undefined}
                    className={[styles.navLink, active ? styles.navLinkActive : null].filter(Boolean).join(' ')}
                  >
                    {entry.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className={styles.actions}>
            {needsMore && (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="sm" shape="square">
                    更多
                  </Button>
                }
                items={moreItems}
                align="end"
              />
            )}
          </div>
        </div>
      </Card>
    </header>
  );
}

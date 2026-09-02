'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown, type DropdownMenuItem } from '@/components/ui/dropdown';
import { useOverflowDetection } from '@/hooks/use-overflow-detection';
import { LOCALE_OPTIONS, useI18n } from '@/i18n';
import { getPagePath } from '@/router/routes';
import { usePerformanceMode } from '@/utils/device';
import styles from './SiteNav.module.css';

/** 导航链接（纯数据；展示文本通过 labelKey 走 i18n） */
interface NavEntry {
  id: string;
  href: string;
  labelKey: string;
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { id: 'home', href: getPagePath('home') ?? '/', labelKey: 'nav.home' },
  { id: 'about', href: getPagePath('about') ?? '/about', labelKey: 'nav.about' },
];

const NAV_ITEM_IDS = NAV_ENTRIES.map((entry) => entry.id);

/** 站点名称（可配置） */
const SITE_NAME = 'EmbersStudio';

/**
 * 顶部导航栏：基于 Card + Button + Dropdown 构建。
 *
 * - 左侧品牌、中间导航链接、右侧操作区（更多 / 语言切换）；
 * - 当前激活页面下方显示平滑滑动下划线；
 * - 链接过多时自动折叠进“更多”展开栏（useOverflowDetection 动态测量）；
 * - 语言切换经 I18nProvider 即时生效并持久化到 localStorage。
 */
export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { animationsEnabled } = usePerformanceMode();
  const { t, locale, setLocale } = useI18n();

  const navTrackRef = useRef<HTMLElement | null>(null);
  const linkListRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const itemRefsRef = useRef(new Map<string, HTMLAnchorElement | null>());

  const itemIds = useMemo(() => NAV_ITEM_IDS, []);
  const { visibleIds, hiddenIds, needsMore } = useOverflowDetection({
    containerRef: navTrackRef,
    itemRefs: itemRefsRef,
    itemIds,
    // 语言切换后文案宽度可能变化，需要重新测量折叠
    remeasureKey: locale,
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
      label: t(entry.labelKey),
      selected: entry.id === activeId,
      onClick: () => {
        router.push(entry.href);
      },
    };
  });

  const languageItems: readonly DropdownMenuItem[] = LOCALE_OPTIONS.map((option) => ({
    id: option.code,
    label: t(option.labelKey),
    selected: option.code === locale,
    onClick: () => {
      setLocale(option.code);
    },
  }));

  const currentLocale = LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];

  return (
    <header className={[styles.header, animationsEnabled ? '' : styles.lowMotion].filter(Boolean).join(' ')}>
      <Card variant="elevated" radius="xl" padding="none" shadow="md" className={styles.bar}>
        <div className={styles.inner}>
          <Link className={styles.brand} href="/" aria-label={t('nav.brandAria', { site: SITE_NAME })}>
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandName}>{SITE_NAME}</span>
          </Link>

          <nav ref={navTrackRef} className={styles.navTrack} aria-label={t('nav.aria')}>
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
                    {t(entry.labelKey)}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className={styles.actions}>
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm" shape="square" aria-label={t('language.switchAria')}>
                  {currentLocale.shortLabel}
                </Button>
              }
              items={languageItems}
              align="end"
            />
            {needsMore && (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="sm" shape="square">
                    {t('nav.more')}
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

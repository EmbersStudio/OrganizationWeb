'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n';
import styles from './HomePage.module.css';

/** HomePage 组件参数 */
interface HomePageProps {
  /** “了解更多”链接目标（由路由注册表提供，默认 /about） */
  nextHref?: string;
}

/**
 * 首页：EmbersStudio 品牌主页。
 *
 * 客户端组件：文案经 I18nProvider 翻译（语言切换即时生效）。
 */
export default function HomePage({ nextHref = '/about' }: HomePageProps) {
  const { t } = useI18n();

  return (
    <main>
      <div className={styles.bodyWrapper}>
        <div className={styles.homeCenter}>
          <h1 className={styles.brand}>{t('home.brand')}</h1>
          <p className={styles.slogan}>{t('home.slogan')}</p>
          <p className={styles.homeActions}>
            <Link className={styles.homeLink} href={nextHref}>
              {t('home.learnMore')}
            </Link>
          </p>
        </div>
      </div>
      <footer className={styles.footer}>{t('home.footer')}</footer>
    </main>
  );
}

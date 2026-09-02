'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n';
import styles from './HomePage.module.css';

/** HomePage 组件参数 */
interface HomePageProps {
}

/**
 * 首页：EmbersStudio 品牌主页。
 */
export default function HomePage({ }: HomePageProps) {
  const { t } = useI18n();

  return (
    <main>
      <div className={styles.bodyWrapper}>
        <div className={styles.homeCenter}>
          <h1 className={styles.brand}>{t('home.brand')}</h1>
          <p className={styles.slogan}>{t('home.slogan')}</p>
          <p className={styles.homeActions}>
          </p>
        </div>
      </div>
      <footer className={styles.footer}>{t('home.footer')}</footer>
    </main>
  );
}

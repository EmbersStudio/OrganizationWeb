'use client';

import Head from 'next/head';
import { useEffect } from 'react';

import { useI18n } from '@/i18n';
import { usePageMeta } from '@/hooks/use-page-meta';
import styles from './HomePage.module.css';

/** HomePage 组件参数 */
interface HomePageProps {
}

/**
 * 首页：EmbersStudio 品牌主页。
 */
export default function HomePage({ }: HomePageProps) {
  const { t } = useI18n();
  const { title, description } = usePageMeta('home');

  // 语言变化时更新标题
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
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
    </>
  );
}

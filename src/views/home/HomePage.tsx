import Link from 'next/link';

import styles from './HomePage.module.css';

/** HomePage 组件参数 */
interface HomePageProps {
  /** “了解更多”链接目标（由 src/router/routes.tsx 注册表提供，默认 /about） */
  nextHref?: string;
}

/**
 * 首页：EmbersStudio 品牌主页。
 *
 * 由 src/app/page.tsx 渲染（原 src/content/pages/home.html 迁移而来）。
 * 纯静态内容，无客户端交互，作为服务端组件渲染以保持爬虫兼容性。
 */
export default function HomePage({ nextHref = '/about' }: HomePageProps) {
  return (
    <main>
      <div className={styles.bodyWrapper}>
        <div className={styles.homeCenter}>
          <h1 className={styles.brand}>EmbersStudio</h1>
          <p className={styles.slogan}>Creating Digital Wonders</p>
          <p className={styles.homeActions}>
            <Link className={styles.homeLink} href={nextHref}>
              了解更多 →
            </Link>
          </p>
        </div>
      </div>
      <footer className={styles.footer}>© 2026 EmbersStudio · Powered by Next.js on Cloudflare</footer>
    </main>
  );
}

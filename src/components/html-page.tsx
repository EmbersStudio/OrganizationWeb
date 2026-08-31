import Script from 'next/script';

import { loadPageHTML } from '@/lib/html-loader';

/** HtmlPage 组件参数 */
interface HtmlPageProps {
  /** 页面名称（对应 src/content/pages/<page>.html） */
  page: string;
}

/**
 * 通用 HTML 页面渲染组件（服务端组件）。
 *
 * 职责：
 * 1. 加载页面 HTML 内容片段（src/content/pages/<page>.html）；
 * 2. 挂载页面级样式表（<link rel="stylesheet">，经 CSS 提取）；
 * 3. 挂载页面级脚本（<script src>，经 next/script 保证执行）；
 * 4. 通过 dangerouslySetInnerHTML 渲染内容。
 *
 * 用法：新建页面时在 src/app/<route>/page.tsx 中
 * `return <HtmlPage page="your-page" />;` 即可。
 */
export default async function HtmlPage({ page }: HtmlPageProps) {
  let loaded = null;
  try {
    loaded = await loadPageHTML(page);
  } catch (error) {
    console.error(`[HTML Loader] Page "${page}" render failed:`, error);
  }

  if (!loaded) {
    return <p className="page-error">页面加载失败，请检查 src/content/pages/{page}.html。</p>;
  }

  return (
    <main>
      {loaded.cssHrefs.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <div dangerouslySetInnerHTML={{ __html: loaded.html }} />
      {loaded.scriptSrcs.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </main>
  );
}

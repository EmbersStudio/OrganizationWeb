import type { Metadata } from 'next';

import { loadPageHTML } from '@/lib/html-loader';

export const metadata: Metadata = {
  title: '关于',
  description: '关于 Organization Web，内容由 content/pages/about.html 提供',
};

/**
 * 关于页：从 src/content/pages/about.html 读取 HTML 并渲染。
 */
export default async function About() {
  let html = '';
  try {
    html = await loadPageHTML('about');
  } catch (error) {
    console.error('[HTML Loader] About page render failed:', error);
  }

  return (
    <main className="page-container">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="page-error">页面加载失败，请检查 src/content/pages/about.html。</p>
      )}
    </main>
  );
}

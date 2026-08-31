import { promises as fs } from 'node:fs';
import path from 'node:path';

/** 页面 HTML 文件所在目录（相对于项目根目录） */
const PAGES_DIR = path.join(process.cwd(), 'src', 'content', 'pages');

/** 允许的页面名称格式（防止路径穿越） */
const PAGE_NAME_PATTERN = /^[a-z0-9_-]+$/i;

/**
 * 加载指定页面的 HTML 文件内容（仅在服务端执行）。
 *
 * @param pageName 页面名称（不含 .html 扩展名），例如 'home' 或 'about'
 * @returns 页面 HTML 字符串
 * @throws 当页面名称非法、文件不存在或读取失败时抛出错误
 */
export async function loadPageHTML(pageName: string): Promise<string> {
  if (!PAGE_NAME_PATTERN.test(pageName)) {
    throw new Error(`[HTML Loader] 非法的页面名称: "${pageName}"`);
  }

  const filePath = path.join(PAGES_DIR, `${pageName}.html`);
  console.log(`[HTML Loader] Loading page: ${pageName} -> ${filePath}`);

  try {
    const html = await fs.readFile(filePath, 'utf8');
    console.log(`[HTML Loader] Page loaded: ${pageName} (${html.length} chars)`);
    return html;
  } catch (error) {
    console.error(`[HTML Loader] Failed to load page: ${pageName}`, error);
    throw new Error(`页面 "${pageName}" 不存在或无法读取`);
  }
}

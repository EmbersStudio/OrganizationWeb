import { promises as fs } from 'node:fs';
import path from 'node:path';

/** 页面 HTML 文件所在目录（相对于项目根目录） */
const PAGES_DIR = path.join(process.cwd(), 'src', 'content', 'pages');

/** 允许的页面名称格式（防止路径穿越） */
const PAGE_NAME_PATTERN = /^[a-z0-9_-]+$/i;

/** 匹配 <link rel="stylesheet" ...> 标签 */
const STYLESHEET_LINK_PATTERN = /<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi;

/** 匹配 <script ...>...</script> 标签 */
const SCRIPT_TAG_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;

/**
 * 页面加载结果：内容片段 + 页面级样式表/脚本引用。
 */
export interface LoadedPage {
  /** 页面内容片段（已移除样式表/脚本引用标签） */
  html: string;
  /** 页面样式表 URL 列表（来自 <link rel="stylesheet" href="...">） */
  cssHrefs: string[];
  /** 页面脚本 URL 列表（来自 <script src="...">） */
  scriptSrcs: string[];
}

/**
 * 提取 <link rel="stylesheet"> 引用并从内容中移除。
 *
 * @param raw 原始页面 HTML
 * @returns 内容片段与样式表 URL 列表
 */
function extractStylesheets(raw: string): { html: string; cssHrefs: string[] } {
  const cssHrefs: string[] = [];
  const html = raw.replace(STYLESHEET_LINK_PATTERN, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i);
    if (href) {
      console.log(`[HTML Loader] 提取页面样式表: ${href[1]}`);
      cssHrefs.push(href[1]);
    }
    return '';
  });
  return { html, cssHrefs };
}

/**
 * 提取 <script src="..."> 引用并从内容中移除。
 *
 * 内联 <script>（无 src）无法通过 dangerouslySetInnerHTML 执行，
 * 因此会被移除并给出警告，提示移入独立文件。
 *
 * @param raw 原始页面 HTML
 * @returns 内容片段与脚本 URL 列表
 */
function extractScripts(raw: string): { html: string; scriptSrcs: string[] } {
  const scriptSrcs: string[] = [];
  const html = raw.replace(SCRIPT_TAG_PATTERN, (tag) => {
    const src = tag.match(/src=["']([^"']+)["']/i);
    if (src) {
      console.log(`[HTML Loader] 提取页面脚本: ${src[1]}`);
      scriptSrcs.push(src[1]);
      return '';
    }
    console.warn(
      '[HTML Loader] 忽略内联 <script>：无法通过 dangerouslySetInnerHTML 执行，请移到独立文件并用 src 引用',
    );
    return '';
  });
  return { html, scriptSrcs };
}

/**
 * 从构建期生成的清单中读取 HTML（Cloudflare Worker 环境专用）。
 *
 * Worker 运行时无法通过 fs 读取项目源码目录（process.cwd() 为 /bundle），
 * 因此构建期会将 src/content/pages/*.html 打包进 pages.generated.ts。
 */
async function loadFromManifest(pageName: string): Promise<string | null> {
  try {
    const { pages } = await import('@/content/pages.generated');
    const html = pages[pageName];
    if (typeof html === 'string') {
      console.log(`[HTML Loader] Page loaded from manifest: ${pageName}`);
      return html;
    }
  } catch (error) {
    console.warn(`[HTML Loader] Manifest load failed: ${pageName}`, error);
  }
  return null;
}

/**
 * 加载指定页面的 HTML 内容（仅在服务端执行）。
 *
 * 优先级：
 * 1. 文件系统读取 src/content/pages/<name>.html（本地开发 / Node 环境）；
 * 2. 构建期生成的 pages.generated.ts 清单（Cloudflare Worker 环境）。
 *
 * 页面 HTML 中可声明页面级资源：
 * - <link rel="stylesheet" href="/styles/pages/<page>.css" />
 * - <script src="/scripts/pages/<page>.js" />
 * 这些标签会被提取到返回值中（由渲染组件负责挂载），不会出现在内容片段里。
 *
 * @param pageName 页面名称（不含 .html 扩展名），例如 'home' 或 'about'
 * @returns 内容片段与页面级资源引用
 * @throws 当页面名称非法、内容不存在或读取失败时抛出错误
 */
export async function loadPageHTML(pageName: string): Promise<LoadedPage> {
  if (!PAGE_NAME_PATTERN.test(pageName)) {
    throw new Error(`[HTML Loader] 非法的页面名称: "${pageName}"`);
  }

  const filePath = path.join(PAGES_DIR, `${pageName}.html`);
  console.log(`[HTML Loader] Loading page: ${pageName} -> ${filePath}`);

  let raw: string | null = null;

  // 1) 文件系统读取（本地开发优先）
  try {
    raw = await fs.readFile(filePath, 'utf8');
    console.log(`[HTML Loader] Page loaded: ${pageName} (${raw.length} chars)`);
  } catch (fsError) {
    console.log(
      `[HTML Loader] fs 读取失败（${fsError instanceof Error ? fsError.message : String(fsError)}），尝试构建期清单`,
    );
  }

  // 2) 构建期清单（Cloudflare Worker 环境）
  if (raw === null) {
    raw = await loadFromManifest(pageName);
  }

  if (raw === null) {
    console.error(`[HTML Loader] Failed to load page: ${pageName}`);
    throw new Error(`页面 "${pageName}" 不存在或无法读取`);
  }

  // 3) 提取页面级样式表与脚本引用
  const { html, cssHrefs } = extractStylesheets(raw);
  const extracted = extractScripts(html);

  return {
    html: extracted.html,
    cssHrefs,
    scriptSrcs: extracted.scriptSrcs,
  };
}

import { promises as fs } from "node:fs";
import path from "node:path";

/** 页面 HTML 文件所在目录（相对于项目根目录） */
const PAGES_DIR = path.join(process.cwd(), "src", "content", "pages");

/** 允许的页面名称格式（防止路径穿越） */
const PAGE_NAME_PATTERN = /^[a-z0-9_-]+$/i;

/**
 * 从构建期生成的清单中读取 HTML（Cloudflare Worker 环境专用）。
 *
 * Worker 运行时无法通过 fs 读取项目源码目录（process.cwd() 为 /bundle），
 * 因此构建期会将 src/content/pages/*.html 打包进 pages.generated.ts。
 */
async function loadFromManifest(pageName: string): Promise<string | null> {
  try {
    const { pages } = await import("@/content/pages.generated");
    const html = pages[pageName];
    if (typeof html === "string") {
      console.log(`[HTML Loader] Page loaded from manifest: ${pageName}`);
      return html;
    }
  } catch (error) {
    console.warn(`[HTML Loader] Manifest load failed: ${pageName}`, error);
  }
  return null;
}

/**
 * 加载指定页面的 HTML 文件内容（仅在服务端执行）。
 *
 * 优先级：
 * 1. 文件系统读取 src/content/pages/<name>.html（本地开发 / Node 环境）；
 * 2. 构建期生成的 pages.generated.ts 清单（Cloudflare Worker 环境）。
 *
 * @param pageName 页面名称（不含 .html 扩展名），例如 'home' 或 'about'
 * @returns 页面 HTML 字符串
 * @throws 当页面名称非法、内容不存在或读取失败时抛出错误
 */
export async function loadPageHTML(pageName: string): Promise<string> {
  if (!PAGE_NAME_PATTERN.test(pageName)) {
    throw new Error(`[HTML Loader] 非法的页面名称: "${pageName}"`);
  }

  const filePath = path.join(PAGES_DIR, `${pageName}.html`);
  console.log(`[HTML Loader] Loading page: ${pageName} -> ${filePath}`);

  // 1) 文件系统读取（本地开发优先）
  try {
    const html = await fs.readFile(filePath, "utf8");
    console.log(
      `[HTML Loader] Page loaded: ${pageName} (${html.length} chars)`,
    );
    return html;
  } catch (fsError) {
    console.log(
      `[HTML Loader] fs 读取失败（${fsError instanceof Error ? fsError.message : String(fsError)}），尝试构建期清单`,
    );
  }

  // 2) 构建期清单（Cloudflare Worker 环境）
  const fromManifest = await loadFromManifest(pageName);
  if (fromManifest !== null) {
    return fromManifest;
  }

  console.error(`[HTML Loader] Failed to load page: ${pageName}`);
  throw new Error(`页面 "${pageName}" 不存在或无法读取`);
}

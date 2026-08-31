import type { Metadata } from "next";

import { loadPageHTML } from "@/lib/html-loader";

export const metadata: Metadata = {
  title: "首页",
  description: "Organization Web 首页，内容由 content/pages/home.html 提供",
};

/**
 * 首页：从 src/content/pages/home.html 读取 HTML 并渲染。
 * 修改 HTML 文件即可更新页面内容，无需改动 TSX 代码。
 */
export default async function Home() {
  let html = "";
  try {
    html = await loadPageHTML("home");
  } catch (error) {
    console.error("[HTML Loader] Home page render failed:", error);
  }

  return (
    <main className="page-container">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="page-error">
          页面加载失败，请检查 src/content/pages/home.html。
        </p>
      )}
    </main>
  );
}

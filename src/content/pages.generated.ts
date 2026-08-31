// 本文件由 scripts/generate-pages-manifest.mjs 自动生成，请勿手动编辑。
// 内容来源：src/content/pages/*.html（编辑 HTML 后重新构建即可生效）。

/** 页面名称 → HTML 内容映射（构建期生成，供 Cloudflare Worker 运行时使用） */
export const pages: Record<string, string> = {
  "about": "<section class=\"page about-page\">\n  <h1 class=\"page-title\">关于本站</h1>\n  <p class=\"page-lead\">\n    本站使用独立的 HTML 文件承载页面内容：\n    <code>src/content/pages/</code> 目录下每个 <code>.html</code> 文件对应一个页面。\n  </p>\n  <p class=\"page-lead\">\n    添加新页面只需三步：新建 HTML 文件、新建对应的\n    <code>page.tsx</code>、注册路由。\n  </p>\n  <p><a class=\"page-link\" href=\"/\">返回首页 →</a></p>\n</section>\n",
  "home": "<section class=\"page home-page\">\n  <h1 class=\"page-title\">欢迎来到 Organization Web</h1>\n  <p class=\"page-lead\">\n    这是一个基于 Next.js (App Router) + OpenNext 的全栈站点。 页面内容由\n    <code>src/content/pages/home.html</code> 提供，无需修改 TSX 即可更新。\n  </p>\n  <p><a class=\"page-link\" href=\"/about\">了解更多 →</a></p>\n</section>\n",
};

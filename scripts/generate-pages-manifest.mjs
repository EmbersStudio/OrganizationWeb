/**
 * 生成页面 HTML 清单（src/content/pages.generated.ts）。
 *
 * 背景：Cloudflare Worker 运行时无法通过 fs 读取项目源码目录
 * （worker 内 process.cwd() 为 /bundle），因此需要在构建期把
 * src/content/pages/*.html 的内容打包为 TypeScript 字符串模块。
 * 本地开发（npm run dev）仍直接读取文件系统。
 *
 * 用法：node scripts/generate-pages-manifest.mjs
 * （已通过 package.json 的 predev / prebuild 钩子自动执行）
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = path.join(root, "src", "content", "pages");
const outFile = path.join(root, "src", "content", "pages.generated.ts");

const files = readdirSync(pagesDir)
  .filter((f) => f.endsWith(".html"))
  .sort();

const lines = [];
lines.push(
  "// 本文件由 scripts/generate-pages-manifest.mjs 自动生成，请勿手动编辑。",
);
lines.push(
  "// 内容来源：src/content/pages/*.html（编辑 HTML 后重新构建即可生效）。",
);
lines.push("");
lines.push(
  "/** 页面名称 → HTML 内容映射（构建期生成，供 Cloudflare Worker 运行时使用） */",
);
lines.push("export const pages: Record<string, string> = {");
for (const file of files) {
  const name = path.basename(file, ".html");
  const html = readFileSync(path.join(pagesDir, file), "utf8");
  lines.push(`  ${JSON.stringify(name)}: ${JSON.stringify(html)},`);
}
lines.push("};");
lines.push("");

writeFileSync(outFile, lines.join("\n"));
console.log(
  `[pages-manifest] Generated ${outFile} with ${files.length} page(s): ${files.join(", ")}`,
);

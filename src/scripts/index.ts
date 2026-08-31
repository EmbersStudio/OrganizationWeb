/**
 * 爬虫脚本统一出口：导出基类/类型与全部脚本。
 * 注册新脚本到 config/scripts.ts 后，建议在此补充导出。
 */
export type { ScraperResult, ScraperScript } from "./base-scraper";
export { exampleScraper } from "./example-scraper";

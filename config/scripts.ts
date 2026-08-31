import { exampleScraper } from "@/scripts/example-scraper";
import type { ScraperScript } from "@/scripts/base-scraper";

/**
 * 爬虫脚本注册表。
 *
 * 新增脚本步骤：
 * 1. 在 src/scripts/ 下实现 ScraperScript 接口；
 * 2. 在此数组末尾追加该脚本；
 * 3. 重启服务后通过 GET /api/data?script=<name> 调用。
 */
export const scripts: ScraperScript[] = [exampleScraper];

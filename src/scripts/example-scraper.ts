import type { ScraperScript } from "./base-scraper";

/** 模拟延迟（毫秒），便于观察缓存命中/未命中的效果 */
const MOCK_DELAY_MS = 300;

/**
 * 示例爬虫脚本：不进行真实网络抓取，仅返回模拟数据。
 * 可作为编写真实脚本的模板参考。
 */
export const exampleScraper: ScraperScript = {
  name: "example",
  enabled: true,
  description: "示例脚本：返回模拟数据，不进行真实网络抓取",

  async scrape() {
    console.log("[Scraper] example-scraper: scrape() 开始执行（模拟数据）");

    // 模拟抓取耗时，便于观察“缓存优先”模式下第二次请求的差异
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

    console.log("[Scraper] example-scraper: scrape() 执行完成");
    return {
      generatedAt: new Date().toISOString(),
      message: "Hello from example scraper (mock data)",
      items: [
        { id: 1, name: "示例条目 A" },
        { id: 2, name: "示例条目 B" },
        { id: 3, name: "示例条目 C" },
      ],
    };
  },
};

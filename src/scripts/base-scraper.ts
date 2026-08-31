/**
 * 爬虫脚本通用返回类型：允许任意 JSON 可序列化的结构。
 */
export type ScraperResult = Record<string, unknown> | unknown[] | string | number | boolean | null;

/**
 * 爬虫脚本接口。
 *
 * 所有爬虫脚本必须实现该接口，并通过 config/scripts.ts 注册后，
 * 即可通过 GET /api/data?script=<name> 调用。
 */
export interface ScraperScript {
  /** 脚本唯一名称（用于 /api/data?script=<name> 指定脚本） */
  name: string;
  /** 是否启用；false 时接口将返回 403 */
  enabled: boolean;
  /** 脚本用途描述（供文档/日志使用） */
  description?: string;
  /**
   * 执行抓取逻辑。
   *
   * @returns 任意 JSON 可序列化的数据
   */
  scrape(): Promise<ScraperResult>;
}

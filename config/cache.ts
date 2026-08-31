/**
 * 全局缓存配置。
 *
 * 通过环境变量 USE_CACHE 可切换缓存模式：
 * - 未设置或非 'false' 时，默认启用缓存（缓存优先）；
 * - 设置 USE_CACHE=false 时，禁用缓存（始终实时抓取）。
 */
export const cacheConfig = {
  /** 是否启用缓存（默认启用） */
  enabled: process.env.USE_CACHE !== 'false',
  /** 缓存有效期（秒） */
  ttl: 3600,
} as const;

/** 缓存配置的类型定义 */
export type CacheConfig = typeof cacheConfig;

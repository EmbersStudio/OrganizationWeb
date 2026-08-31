import { cacheConfig } from "@config/cache";
import { kvGet, kvSet } from "@/lib/kv";

/** 缓存优先读取的结果来源 */
export type CacheSource = "cache" | "live";

/** 缓存优先读取的返回结构 */
export interface CacheManagerResult<T> {
  /** 数据来源：cache=命中缓存，live=实时抓取 */
  source: CacheSource;
  /** 实际数据 */
  data: T;
}

/**
 * 缓存优先（cache-first）读取逻辑。
 *
 * - 当 cacheConfig.enabled 为 true 时：
 *   1. 尝试从 KV 读取缓存；
 *   2. 命中且可解析 → 直接返回缓存数据（source: 'cache'）；
 *   3. 未命中或缓存损坏 → 执行 fetchLive 获取实时数据并写入缓存（source: 'live'）。
 * - 当 cacheConfig.enabled 为 false（USE_CACHE=false）时：
 *   始终执行 fetchLive，不读写缓存（实时抓取模式）。
 *
 * @param key 缓存键
 * @param fetchLive 实时数据获取函数（如调用爬虫脚本）
 * @param ttlSeconds 缓存有效期（秒），默认取 cacheConfig.ttl
 * @returns 数据与其来源
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchLive: () => Promise<T>,
  ttlSeconds: number = cacheConfig.ttl,
): Promise<CacheManagerResult<T>> {
  if (cacheConfig.enabled) {
    const cached = await kvGet(key);
    if (cached !== null) {
      try {
        const data = JSON.parse(cached) as T;
        console.log(`[CacheManager] 缓存命中: ${key}`);
        return { source: "cache", data };
      } catch (error) {
        // 缓存内容损坏时降级为实时抓取
        console.error(
          `[CacheManager] 缓存内容解析失败，降级为实时抓取: ${key}`,
          error,
        );
      }
    } else {
      console.log(`[CacheManager] 缓存未命中: ${key}`);
    }
  } else {
    console.log(
      `[CacheManager] 缓存已禁用（USE_CACHE=false），实时抓取: ${key}`,
    );
  }

  const data = await fetchLive();
  if (cacheConfig.enabled) {
    await kvSet(key, JSON.stringify(data), ttlSeconds);
    console.log(`[CacheManager] 已写入缓存: ${key} (ttl=${ttlSeconds}s)`);
  }
  return { source: "live", data };
}

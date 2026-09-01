import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * 简化版 KV 命名空间接口（与 Cloudflare KVNamespace 结构兼容，
 * 便于本地开发时使用内存模拟实现）。
 */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

declare global {
  interface CloudflareEnv {
    /** 自定义 KV 绑定：用于 API 数据缓存（对应 wrangler.toml 中的 binding） */
    DATA_CACHE?: KVLike;
  }
}

/** KV 绑定名称，需与 wrangler.toml 中的 [[kv_namespaces]] binding 保持一致 */
const KV_BINDING_NAME = 'DATA_CACHE';

/** 内存模拟存储的条目 */
interface MemoryEntry {
  value: string;
  /** 过期时间（毫秒时间戳）；Infinity 表示永不过期 */
  expiresAt: number;
}

/**
 * 本地开发使用的内存 KV 模拟实现（进程内 Map）。
 * 无 Cloudflare 环境（如 npm run dev）时自动启用，方便无需账号即可开发。
 */
class MemoryKVStore {
  private store = new Map<string, MemoryEntry>();

  /** 读取值；已过期或不存在时返回 null */
  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /** 写入值，可选 TTL（秒） */
  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiresAt = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : Number.POSITIVE_INFINITY;
    this.store.set(key, { value, expiresAt });
  }
}

let memoryStore: MemoryKVStore | null = null;
/** 已解析的 KV 绑定；undefined=尚未解析，null=使用内存模拟 */
let resolvedBinding: KVLike | null | undefined;

/** 获取（并按需创建）内存模拟存储 */
function getMemoryStore(): MemoryKVStore {
  if (!memoryStore) {
    memoryStore = new MemoryKVStore();
  }
  return memoryStore;
}

/**
 * 解析 KV 绑定：
 * - Cloudflare/OpenNext 运行环境返回真实的 KV 命名空间；
 * - 本地 Node 环境（getCloudflareContext 不可用）返回 null，改用内存模拟。
 * 结果会缓存，避免每次请求重复解析。
 */
async function resolveBinding(): Promise<KVLike | null> {
  if (resolvedBinding !== undefined) {
    return resolvedBinding;
  }

  try {
    const ctx = await getCloudflareContext({ async: true });
    const binding = ctx.env[KV_BINDING_NAME];
    if (binding) {
      console.log(`[KV] Cloudflare KV binding resolved: ${KV_BINDING_NAME}`);
      resolvedBinding = binding;
      return binding;
    }
    console.warn(`[KV] Binding "${KV_BINDING_NAME}" 未在环境中配置，改用内存模拟`);
  } catch (error) {
    console.log(
      `[KV] Cloudflare context 不可用（${error instanceof Error ? error.message : String(error)}），改用内存模拟`,
    );
  }

  resolvedBinding = null;
  return null;
}

/**
 * 读取缓存值。
 *
 * @param key 缓存键
 * @returns 缓存值字符串；未命中或已过期时返回 null
 */
export async function kvGet(key: string): Promise<string | null> {
  const kv = await resolveBinding();
  if (kv) {
    const value = await kv.get(key);
    console.log(`[KV] get "${key}" -> ${value === null ? 'miss' : 'hit'}`);
    return value;
  }
  const value = await getMemoryStore().get(key);
  console.log(`[KV] memory get "${key}" -> ${value === null ? 'miss' : 'hit'}`);
  return value;
}

/**
 * 写入缓存值。
 *
 * @param key 缓存键
 * @param value 缓存值（建议传入 JSON 字符串）
 * @param ttlSeconds 过期时间（秒）；不传则永不过期
 */
export async function kvSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const kv = await resolveBinding();
  if (kv) {
    await kv.put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
    console.log(`[KV] put "${key}" (ttl=${ttlSeconds ?? 'none'}s)`);
    return;
  }
  await getMemoryStore().put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
  console.log(`[KV] memory put "${key}" (ttl=${ttlSeconds ?? 'none'}s)`);
}

import {getCachedOrFetch} from '@/lib/cache-manager';
import {cacheConfig} from '@config/cache';
import {scripts} from '@config/scripts';
import {NextResponse} from 'next/server';

/** 强制动态渲染，确保每次请求都走服务端逻辑 */
export const dynamic = 'force-dynamic';

/** 缓存键前缀 */
const CACHE_KEY_PREFIX = 'api:data:';

/**
 * 数据接口：GET /api/data?script=<name>
 *
 * 默认“缓存优先”模式（config/cache.ts，enabled=true）：
 * 1. 命中 KV 缓存且未过期 → 直接返回缓存数据（source: "cache"）；
 * 2. 未命中 → 执行对应脚本的 scrape() 获取实时数据并写入 KV（source: "live"）。
 *
 * 通过环境变量 USE_CACHE=false 可切换为“实时抓取模式”。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const scriptName = url.searchParams.get('script') ?? 'example';
  console.log(`[API] GET /api/data?script=${scriptName}`);

  // 校验脚本是否存在/启用
  const script = scripts.find((item) => item.name === scriptName);
  if (!script) {
    console.warn(`[API] 脚本不存在: ${scriptName}`);
    return NextResponse.json(
        {error: `Unknown script: ${scriptName}`}, {status: 404});
  }
  if (!script.enabled) {
    console.warn(`[API] 脚本已禁用: ${scriptName}`);
    return NextResponse.json(
        {error: `Script disabled: ${scriptName}`}, {status: 403});
  }

  // 缓存优先逻辑（cache-manager 封装）
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${scriptName}`;
    const {source, data} = await getCachedOrFetch(
        cacheKey, () => script.scrape(), cacheConfig.ttl);
    console.log(`[API] 请求完成 (script=${scriptName}, source=${source})`);
    return NextResponse.json(
        {source, data}, {headers: {'X-Cache-Source': source}});
  } catch (error) {
    console.error(`[API] 脚本执行失败: ${scriptName}`, error);
    return NextResponse.json(
        {
          error: 'Script execution failed',
          detail: error instanceof Error ? error.message : String(error),
        },
        {status: 500},
    );
  }
}

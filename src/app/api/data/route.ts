import { NextResponse } from 'next/server';

import { cacheConfig } from '@config/cache';
import { scripts } from '@config/scripts';
import { kvGet, kvSet } from '@/lib/kv';

/** 强制动态渲染，确保每次请求都走服务端逻辑 */
export const dynamic = 'force-dynamic';

/** 缓存键前缀 */
const CACHE_KEY_PREFIX = 'api:data:';

/**
 * 数据接口：GET /api/data?script=<name>
 *
 * 流程（缓存优先模式，cacheConfig.enabled = true）：
 * 1. 根据脚本名称生成缓存键；
 * 2. 命中 KV 缓存且未过期 → 直接返回缓存数据（source: "cache"）；
 * 3. 未命中或缓存被禁用 → 执行对应脚本的 scrape() 获取实时数据，
 *    若缓存启用则写入 KV（source: "live"）。
 *
 * 通过环境变量 USE_CACHE=false 可切换为“实时抓取模式”（不读写缓存）。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const scriptName = url.searchParams.get('script') ?? 'example';
  console.log(`[API] GET /api/data?script=${scriptName}`);

  // 1. 校验脚本是否存在/启用
  const script = scripts.find((item) => item.name === scriptName);
  if (!script) {
    console.warn(`[API] 脚本不存在: ${scriptName}`);
    return NextResponse.json({ error: `Unknown script: ${scriptName}` }, { status: 404 });
  }
  if (!script.enabled) {
    console.warn(`[API] 脚本已禁用: ${scriptName}`);
    return NextResponse.json({ error: `Script disabled: ${scriptName}` }, { status: 403 });
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${scriptName}`;

  // 2. 缓存优先：尝试读取缓存
  if (cacheConfig.enabled) {
    const cached = await kvGet(cacheKey);
    if (cached !== null) {
      try {
        const data = JSON.parse(cached) as unknown;
        console.log(`[API] 缓存命中 (script=${scriptName})`);
        return NextResponse.json({ source: 'cache', data });
      } catch (error) {
        // 缓存内容损坏时降级为实时抓取
        console.error(`[API] 缓存内容解析失败，降级为实时抓取: ${scriptName}`, error);
      }
    } else {
      console.log(`[API] 缓存未命中 (script=${scriptName})`);
    }
  } else {
    console.log(`[API] 缓存已禁用（USE_CACHE=false），执行实时抓取 (script=${scriptName})`);
  }

  // 3. 实时抓取
  try {
    console.log(`[API] 开始执行脚本: ${scriptName}`);
    const data = await script.scrape();

    if (cacheConfig.enabled) {
      await kvSet(cacheKey, JSON.stringify(data), cacheConfig.ttl);
      console.log(`[API] 已写入缓存 (script=${scriptName}, ttl=${cacheConfig.ttl}s)`);
    }

    return NextResponse.json({ source: 'live', data });
  } catch (error) {
    console.error(`[API] 脚本执行失败: ${scriptName}`, error);
    return NextResponse.json(
      {
        error: 'Script execution failed',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

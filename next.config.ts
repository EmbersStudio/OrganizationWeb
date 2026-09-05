import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';

// 本地开发（next dev）时通过 Wrangler 平台代理加载 D1/KV 等绑定，
// 使认证接口可以直接使用 wrangler.toml 中声明的本地 D1 数据库。
initOpenNextCloudflareForDev();

/**
 * Next.js 配置。
 *
 * 页面由 TSX 组件渲染（src/views/），无需读取源码文件系统；
 * 在 Cloudflare (OpenNext) 环境下由 nodejs_compat 兼容层提供支持。
 */
const nextConfig: NextConfig = {/* config options here */};

export default nextConfig;

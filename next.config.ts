import type { NextConfig } from "next";

/**
 * Next.js 配置。
 *
 * 页面 HTML 通过 node:fs 在服务端读取（src/content/pages/），
 * node:fs 属于 Node.js 内置模块，无需额外的 serverExternalPackages 配置；
 * 在 Cloudflare (OpenNext) 环境下由 nodejs_compat 兼容层提供支持。
 */
const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

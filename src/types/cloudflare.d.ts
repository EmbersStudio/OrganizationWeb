/**
 * Cloudflare 运行时环境类型（bindings / vars）。
 *
 * - `CloudflareEnv` 全局接口由 @opennextjs/cloudflare 声明，这里补充本项目使用的绑定；
 * - 通过 tsconfig 的 `types` 选项引入 @cloudflare/workers-types，从而获得 D1Database 等全局类型。
 */
import type {} from '@opennextjs/cloudflare';

declare global {
  interface CloudflareEnv {
    /** D1 数据库绑定（对应 wrangler.toml 中 [[d1_databases]] binding = "DB"） */
    DB: D1Database;
    /** Better Auth 密钥（生产环境应配置为 Cloudflare 机密变量） */
    BETTER_AUTH_SECRET?: string;
    /** 兼容旧命名的 Auth 密钥 */
    AUTH_SECRET?: string;
    /** 站点公开基地址（可选；默认按请求 Host 自动识别） */
    BETTER_AUTH_URL?: string;
    /** 受信任来源（逗号分隔，可选） */
    BETTER_AUTH_TRUSTED_ORIGINS?: string;
    /** GitHub OAuth Client ID（可选，未配置则关闭 GitHub 登录） */
    GITHUB_CLIENT_ID?: string;
    /** GitHub OAuth Client Secret（可选） */
    GITHUB_CLIENT_SECRET?: string;
  }
}

export {};

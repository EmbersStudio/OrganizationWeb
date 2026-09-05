/**
 * Better Auth 服务端实例工厂。
 *
 * 本项目运行于 Cloudflare Workers（OpenNext）：
 * - 数据库使用 D1（wrangler.toml binding = "DB"）；
 * - 每次请求通过 getCloudflareContext() 拿到 env，再创建 auth 实例；
 * - 支持邮箱密码注册/登录、邮箱验证令牌生成、密码重置令牌生成，
 *   以及（配置 GITHUB_CLIENT_ID/SECRET 时）GitHub OAuth 登录。
 *
 * 注意：BETTER_AUTH_SECRET 属于机密信息，必须通过 .dev.vars /
 * Cloudflare 机密变量注入，禁止硬编码。
 */

import * as schema from '@/db/schema';
import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {drizzle} from 'drizzle-orm/d1';

/** 供 auth() 使用的最小环境类型（来自 CloudflareEnv 全局类型） */
export interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

/** 从环境对象与进程环境读取字符串变量 */
function pickSecret(env: AuthEnv): string|undefined {
  return env.BETTER_AUTH_SECRET ?? env.AUTH_SECRET ??
      process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
}

/**
 * 根据当前请求的 Cloudflare 环境创建 Better Auth 实例。
 *
 * @param env Cloudflare 请求上下文中的 env（含 D1 绑定与变量）
 * @returns 配置完成的 Better Auth 实例
 */
export function auth(env: AuthEnv) {
  const secret = pickSecret(env);
  if (!secret) {
    throw new Error(
        '[Auth] 缺少 BETTER_AUTH_SECRET（或 AUTH_SECRET），请在 .dev.vars / Cloudflare 变量中配置');
  }

  const baseURL = env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL;
  const trustedOrigins = (env.BETTER_AUTH_TRUSTED_ORIGINS ??
                          process.env.BETTER_AUTH_TRUSTED_ORIGINS)
                             ?.split(',')
                             .map((item) => item.trim())
                             .filter(Boolean);

  const githubClientId = env.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID;
  const githubClientSecret =
      env.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET;

  return betterAuth({
    appName: 'EmbersStudio',
    secret,
    ...(baseURL ? {baseURL} : {}),
    ...(trustedOrigins && trustedOrigins.length > 0 ? {trustedOrigins} : {}),
    database: drizzleAdapter(drizzle(env.DB), {provider: 'sqlite', schema}),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // 示例实现：将密码重置链接输出到日志。
      // 生产环境请替换为真实的邮件服务（如 Resend / SendGrid）。
      sendResetPassword: async ({user, url}) => {
        console.log(`[Auth] 密码重置链接（${user.email}）: ${url}`);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60,  // 1 小时
      // 示例实现：将验证链接输出到日志。
      // 生产环境请替换为真实的邮件服务。
      sendVerificationEmail: async ({user, url}) => {
        console.log(`[Auth] 邮箱验证链接（${user.email}）: ${url}`);
      },
    },
    ...(githubClientId && githubClientSecret ? {
      socialProviders: {
        github: {
          clientId: githubClientId,
          clientSecret: githubClientSecret,
        },
      },
    } :
                                               {}),
  });
}

/** auth 实例类型（供服务端辅助函数复用） */
export type Auth = ReturnType<typeof auth>;

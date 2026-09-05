/**
 * Better Auth 浏览器客户端（供 React 客户端组件使用）。
 *
 * 默认请求同源 /api/auth/*；如站点部署在独立域名，
 * 可配置 NEXT_PUBLIC_BETTER_AUTH_URL 指定服务端地址。
 */

import { createAuthClient } from 'better-auth/react';

const configuredBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

/** 认证客户端单例 */
export const authClient = createAuthClient(configuredBaseURL ? { baseURL: configuredBaseURL } : undefined);

/** 会话类型（由客户端推断，与服务端返回保持一致） */
export type AuthSession = typeof authClient.$Infer.Session;

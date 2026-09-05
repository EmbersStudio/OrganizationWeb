/**
 * Better Auth 标准端点挂载（catch-all）。
 *
 * 所有 /api/auth/* 请求（登录、注册、登出、会话、验证、OAuth 回调等）
 * 都会进入 auth(env).handler()，由 Better Auth 内部路由分发。
 */
export const runtime = 'edge';

import {auth} from '@/lib/auth';
import {getCloudflareContext} from '@opennextjs/cloudflare';

/** 将请求交给基于当前 D1 环境的 Better Auth 实例处理 */
async function handleAuthRequest(request: Request): Promise<Response> {
  const {env} = await getCloudflareContext({async: true});
  const authInstance = auth(env);
  return authInstance.handler(request);
}

/** GET：get-session、邮箱验证、OAuth 回调等 */
export const GET = (request: Request) => handleAuthRequest(request);

/** POST：sign-in / sign-up / sign-out / reset-password 等 */
export const POST = (request: Request) => handleAuthRequest(request);

/**
 * 服务端会话读取辅助（Next.js Server Components / Route Handlers）。
 *
 * 使用 getCloudflareContext() 解析 D1 绑定后创建 Better Auth 实例，
 * 再通过请求 Cookie 读取当前会话；未登录返回 null。
 */

import {auth} from '@/lib/auth';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {headers} from 'next/headers';

/**
 * 读取当前请求对应的服务端会话。
 *
 * @returns 会话与用户信息；未登录时为 null
 */
export async function getServerSession() {
  const {env} = await getCloudflareContext({async: true});
  const headerStore = await headers();
  const authInstance = auth(env);
  return authInstance.api.getSession({headers: new Headers(headerStore)});
}

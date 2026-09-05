import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/session';
import { AuthView } from '@/views/auth/AuthView';

/** 登录页元信息 */
export const metadata: Metadata = {
  title: '登录 · EmbersStudio',
  description: '登录 EmbersStudio 账户。',
};

/** 登录页需要动态读取会话，禁止静态化 */
export const dynamic = 'force-dynamic';

/**
 * 登录页：已登录用户直接进入仪表盘，其余渲染登录表单。
 */
export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect('/dashboard');
  }
  return <AuthView mode="login" />;
}

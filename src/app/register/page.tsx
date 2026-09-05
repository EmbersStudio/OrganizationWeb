import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/session';
import { AuthView } from '@/views/auth/AuthView';

/** 注册页元信息 */
export const metadata: Metadata = {
  title: '注册 · EmbersStudio',
  description: '注册 EmbersStudio 账户。',
};

/** 注册页需要动态读取会话，禁止静态化 */
export const dynamic = 'force-dynamic';

/**
 * 注册页：已登录用户直接进入仪表盘，其余渲染注册表单。
 */
export default async function RegisterPage() {
  const session = await getServerSession();
  if (session) {
    redirect('/dashboard');
  }
  return <AuthView mode="register" />;
}

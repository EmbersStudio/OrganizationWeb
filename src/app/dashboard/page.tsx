import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/session';
import { DashboardView } from '@/views/dashboard/DashboardView';

/** 仪表盘页元信息 */
export const metadata: Metadata = {
  title: '仪表盘 · EmbersStudio',
  description: '登录后的受保护页面。',
};

/** 仪表盘必须实时校验会话，禁止静态化 */
export const dynamic = 'force-dynamic';

/**
 * 受保护仪表盘页：未登录时重定向到 /login。
 */
export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const { user } = session;
  return (
    <DashboardView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      }}
    />
  );
}

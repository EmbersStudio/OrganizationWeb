'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';

import styles from './DashboardView.module.css';

/** DashboardView 组件参数 */
export interface DashboardViewProps {
  /** 当前登录用户的展示信息 */
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt?: Date | null;
  };
}

/**
 * 受保护仪表盘：展示当前用户信息并提供登出按钮。
 */
export function DashboardView({ user }: DashboardViewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** 登出并返回登录页 */
  async function handleSignOut() {
    setBusy(true);
    setErrorMessage(null);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setErrorMessage('登出失败，请稍后重试。');
        return;
      }
      router.replace('/login');
      router.refresh();
    } catch {
      setErrorMessage('网络异常，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.pageWrap}>
      <Card variant="elevated" radius="lg" padding="lg" shadow="lg" className={styles.dashboardCard}>
        <h1 className={styles.title}>仪表盘</h1>
        <p className={styles.subtitle}>该页面仅登录用户可访问，会话由 D1 服务端存储。</p>

        {errorMessage && (
          <p className={styles.alertError} role="alert">
            {errorMessage}
          </p>
        )}

        <dl className={styles.infoList}>
          <div className={styles.infoRow}>
            <dt>用户 ID</dt>
            <dd>{user.id}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>用户名</dt>
            <dd>{user.name}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>邮箱</dt>
            <dd>{user.email}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>邮箱已验证</dt>
            <dd>{user.emailVerified ? '是' : '否'}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <Button variant="danger" onClick={handleSignOut} disabled={busy}>
            {busy ? '登出中…' : '退出登录'}
          </Button>
          <Link href="/" className={styles.homeLink}>
            返回首页
          </Link>
        </div>
      </Card>
    </main>
  );
}

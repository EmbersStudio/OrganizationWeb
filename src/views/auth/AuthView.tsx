'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';

import styles from './AuthView.module.css';

/** 页面模式：登录 / 注册 */
export type AuthMode = 'login' | 'register';

/** AuthView 组件参数 */
export interface AuthViewProps {
  /** 当前表单模式 */
  mode: AuthMode;
}

/** Better Auth 错误对象的结构（message 与 code 可选其一） */
interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

/** 常见错误码 → 中文提示 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: '该邮箱已注册，请直接登录。',
  INVALID_EMAIL_OR_PASSWORD: '邮箱或密码错误。',
  PASSWORD_TOO_SHORT: '密码至少需要 8 个字符。',
  PASSWORD_TOO_LONG: '密码长度不能超过 128 个字符。',
  EMAIL_NOT_VERIFIED: '邮箱尚未验证，请先完成邮箱验证。',
  USER_NOT_FOUND: '用户不存在。',
  INVALID_TOKEN: '链接无效或已过期，请重新申请。',
  ACCOUNT_NOT_FOUND: '账户不存在，请先注册。',
  GITHUB_ACCOUNT_NOT_LINKED: '尚未关联 GitHub 账户。',
};

/** 将客户端错误对象转换为可读文案 */
function toErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }
  const record = error as AuthErrorLike;
  const code = typeof record.code === 'string' ? record.code.toUpperCase() : '';
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code];
  }
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }
  return fallback;
}

/**
 * 登录 / 注册共用视图。
 *
 * - 注册：name + email + password，成功后进入 /dashboard；
 * - 登录：email + password，成功后进入 /dashboard；
 * - 服务端同时提供 GitHub OAuth（需配置环境变量）。
 */
export function AuthView({ mode }: AuthViewProps) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** 提交邮箱密码表单 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (isRegister && password !== confirmPassword) {
      setErrorMessage('两次输入的密码不一致。');
      return;
    }

    setBusy(true);
    try {
      if (isRegister) {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (result.error) {
          setErrorMessage(toErrorMessage(result.error, '注册失败，请稍后重试。'));
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (result.error) {
          setErrorMessage(toErrorMessage(result.error, '登录失败，请检查邮箱与密码。'));
          return;
        }
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      setErrorMessage(toErrorMessage(error, '网络异常，请稍后重试。'));
    } finally {
      setBusy(false);
    }
  }

  /** 通过 GitHub 登录（未配置对应环境变量时服务端会返回错误提示） */
  async function handleGithubSignIn() {
    setErrorMessage(null);
    setBusy(true);
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/dashboard',
      });
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'GitHub 登录失败，请确认已配置 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET。'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.pageWrap}>
      <Card variant="elevated" radius="lg" padding="lg" shadow="lg" className={styles.authCard}>
        <h1 className={styles.title}>{isRegister ? '创建账户' : '欢迎回来'}</h1>
        <p className={styles.subtitle}>{isRegister ? '注册一个 EmbersStudio 账户' : '登录后继续访问受保护页面'}</p>

        {errorMessage && (
          <p className={styles.alertError} role="alert">
            {errorMessage}
          </p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {isRegister && (
            <label className={styles.field}>
              <span className={styles.label}>用户名</span>
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="你的昵称"
                autoComplete="name"
                required
                minLength={1}
                maxLength={64}
              />
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.label}>邮箱</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>密码</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? '至少 8 个字符' : '输入密码'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={128}
            />
          </label>

          {isRegister && (
            <label className={styles.field}>
              <span className={styles.label}>确认密码</span>
              <input
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入密码"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
            </label>
          )}

          <Button type="submit" fullWidth disabled={busy}>
            {busy ? '处理中…' : isRegister ? '注册' : '登录'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>或</span>
        </div>

        <Button variant="outline" fullWidth onClick={handleGithubSignIn} disabled={busy}>
          使用 GitHub 登录
        </Button>

        <p className={styles.switchHint}>
          {isRegister ? (
            <>
              已有账户？
              <Link href="/login" className={styles.switchLink}>
                去登录
              </Link>
            </>
          ) : (
            <>
              还没有账户？
              <Link href="/register" className={styles.switchLink}>
                去注册
              </Link>
            </>
          )}
        </p>
      </Card>
    </main>
  );
}

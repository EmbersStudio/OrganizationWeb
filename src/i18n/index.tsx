'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import enMessages from '@/locales/en.json';
import zhMessages from '@/locales/zh.json';

/** 支持的语言 */
export type Locale = 'zh' | 'en';

/** 语言元信息 */
export interface LocaleOption {
  code: Locale;
  /** 语言显示名的翻译键（如 language.zh） */
  labelKey: string;
  /** 触发器上的短标识（如 “中” / “En”） */
  shortLabel: string;
}

/* ============ 配置（集中在文件头部，便于修改） ============ */

/** 默认语言 */
export const DEFAULT_LOCALE: Locale = 'zh';

/** 语言偏好持久化键 */
export const LOCALE_STORAGE_KEY = 'embersstudio.locale';

/** 支持的语言列表（新增语言时在此追加，并在 src/locales 添加同名 JSON） */
export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: 'zh', labelKey: 'language.zh', shortLabel: '中' },
  { code: 'en', labelKey: 'language.en', shortLabel: 'En' },
];

/* ========================================================== */

/** 嵌套翻译消息结构 */
type NestedMessages = { [key: string]: string | NestedMessages };

const dictionaries: Record<Locale, NestedMessages> = {
  zh: zhMessages as NestedMessages,
  en: enMessages as NestedMessages,
};

/** 翻译上下文值 */
export interface I18nContextValue {
  /** 当前语言 */
  locale: Locale;
  /** 切换语言（同时写入 localStorage 持久化） */
  setLocale: (next: Locale) => void;
  /**
   * 翻译函数：t('nav.home')；支持 {var} 插值，如 t('nav.brandAria', { site: 'X' })。
   * 缺失键时原样返回 key，便于开发期发现。
   */
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveMessage(messages: NestedMessages, key: string): string | undefined {
  let node: NestedMessages | string = messages;
  for (const part of key.split('.')) {
    if (typeof node === 'string' || !(part in node)) {
      return undefined;
    }
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(message: string, variables?: Record<string, string | number>): string {
  if (!variables) {
    return message;
  }
  return message.replace(/\{(\w+)\}/g, (raw, name: string) => (name in variables ? String(variables[name]) : raw));
}

/** 是否属于受支持的语言代码（localStorage 内容校验用） */
function isLocale(value: string | null): value is Locale {
  return value === 'zh' || value === 'en';
}

/** 语言偏好订阅（支持跨标签页同步） */
const localeListeners = new Set<() => void>();

function subscribeLocale(listener: () => void): () => void {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

function emitLocaleChange(): void {
  for (const listener of localeListeners) {
    listener();
  }
}

/** 读取当前持久化语言（服务端返回默认值，避免 hydration 不一致） */
function readStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) {
      return stored;
    }
  } catch {
    // localStorage 不可用时使用默认语言
  }
  return DEFAULT_LOCALE;
}

/**
 * 轻量 i18n Provider：
 * - 默认语言 DEFAULT_LOCALE；
 * - 挂载后读取 localStorage 中的语言偏好（刷新保持）；
 * - setLocale 即时更新状态并持久化，同时同步 <html lang>。
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  // 通过 useSyncExternalStore 读取 localStorage：服务端渲染取默认语言，
  // 客户端挂载后自动切换到持久化语言，避免同步 setState 与 hydration 报错。
  const locale = useSyncExternalStore(subscribeLocale, readStoredLocale, () => DEFAULT_LOCALE);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // 忽略持久化失败：当前会话内仍即时生效
    }
    emitLocaleChange();
  }, []);

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>) => {
      const message = resolveMessage(dictionaries[locale], key);
      return message === undefined ? key : interpolate(message, variables);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** 在 I18nProvider 内读取 i18n 上下文 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n 必须在 <I18nProvider> 内使用');
  }
  return context;
}

# i18n 国际化模块（src/i18n）

基于 React Context + `useSyncExternalStore` 的轻量国际化方案，无第三方依赖。

---

## 一、目录结构

```

src/
├── i18n/
│   └── index.tsx            # Provider、Hook、配置
├── locales/
│   ├── zh.json              # 中文翻译
│   └── en.json              # 英文翻译

```

- 语言文件使用 JSON 嵌套结构，与组件中的 `t('key.subkey')` 对应。
- 所有翻译键统一管理，避免硬编码文案。

---

## 二、如何新增一种语言

以添加日语（`ja`）为例：

### 1. 更新类型定义

在 `src/i18n/index.tsx` 中：

```ts
// 支持的语言
export type Locale = 'zh' | 'en' | 'ja';   // 增加 'ja'
```

### 2. 添加翻译文件

复制 `zh.json` 并翻译为日语，保存为 `src/locales/ja.json`。

### 3. 注册新语言

在 `src/i18n/index.tsx` 中：

```ts
// 导入日语 JSON
import jaMessages from '@/locales/ja.json';

// 注册到 dictionaries
const dictionaries: Record<Locale, NestedMessages> = {
  zh: zhMessages,
  en: enMessages,
  ja: jaMessages,        // 新增
};

// 添加语言选项（用于导航栏下拉菜单）
export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: 'zh', labelKey: 'language.zh', shortLabel: '中' },
  { code: 'en', labelKey: 'language.en', shortLabel: 'En' },
  { code: 'ja', labelKey: 'language.ja', shortLabel: '日' }, // 新增
];
```

### 4. （可选）更新语言守卫函数

```ts
function isLocale(value: string | null): value is Locale {
  return value === 'zh' || value === 'en' || value === 'ja';
}
```

### 5. 在 `locales/*.json` 中添加语言名翻译

确保所有语言文件都有 `language.zh`、`language.en`、`language.ja` 等键，以便下拉菜单显示正确名称。

---

## 三、在组件中使用翻译

### 基本用法

```tsx
'use client';
import { useI18n } from '@/i18n';

export function MyComponent() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div>
      <p>{t('nav.home')}</p>          // 输出：首页 / Home
      <button onClick={() => setLocale('en')}>Switch to English</button>
    </div>
  );
}
```

### 插值变量

翻译字符串中可使用 `{varName}` 占位符：

```ts
// locales/zh.json: "greeting": "你好，{name}！"
t('greeting', { name: '张三' }) // 输出：你好，张三！
```

---

## 四、页面标题 / 描述的多语言支持

页面的 `<title>` 和 `<meta name="description">` 通过 **路由注册表**（`src/router/routes.tsx`）和 **客户端 Hook**（`usePageMeta`）配合实现多语言。

### 1. 在路由注册表中定义多语言元数据

```ts
// src/router/routes.tsx
export const PAGE_REGISTRY = [
  {
    id: 'home',
    path: '/',
    title: {
      zh: '首页 · 余烬工作室',
      en: 'Home · EmbersStudio',
      ja: 'ホーム · EmbersStudio',   // 新增语言时添加对应键
    },
    description: {
      zh: '我们拥抱开源...',
      en: 'We embrace open source...',
      ja: '私たちはオープンソースを...',
    },
  },
];
```

### 2. 在页面组件中使用 `usePageMeta`

```tsx
'use client';
import Head from 'next/head';
import { usePageMeta } from '@/hooks/use-page-meta';

export default function HomePage() {
  const { title, description } = usePageMeta('home');
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      {/* ... */}
    </>
  );
}
```

当语言切换时，`usePageMeta` 自动返回当前语言的标题/描述，标题即时刷新。

### 3. 服务端渲染（SEO）

在 `src/app/page.tsx` 中通过 `generateMetadata` 读取 Cookie 中的语言，返回对应元数据，保证首次加载和爬虫抓取正确。

```ts
export async function generateMetadata() {
  const route = requirePageRoute('home');
  const cookieStore = await cookies();
  const locale = (cookieStore.get('embersstudio.locale')?.value as Locale) || 'zh';
  return {
    title: route.title[locale],
    description: route.description?.[locale] ?? '',
  };
}
```

---

## 五、语言持久化与跨标签页同步

- **localStorage**：键 `embersstudio.locale`，用于客户端状态持久化。
- **Cookie**：同名 Cookie，路径 `/`，有效期 365 天，供服务端 `generateMetadata` 读取。
- 语言切换时同时写入两者，跨标签页通过 `storage` 事件同步（`useSyncExternalStore` 实现）。

---

## 六、注意事项

- 所有使用 `t()` 的组件必须添加 `'use client'`，因为 i18n 上下文仅存在于客户端。
- 服务端组件（如 `layout.tsx`）无法使用 `useI18n`，但可通过 `cookies()` 读取语言偏好来处理元数据（见第四节）。
- 新增语言时，务必检查所有已存在的翻译键是否都已翻译，避免缺失键回退为原键名。
- 语言切换后，`<html lang>` 属性会自动更新（由 `I18nProvider` 的 `useEffect` 处理）。

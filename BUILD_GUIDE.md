# BUILD_GUIDE · 构建与开发指南

本项目已迁移为 **纯 TypeScript + React（Next.js App Router）+ CSS Modules** 开发体系：

- 所有页面由 **TSX 组件** 生成 DOM（不再有 HTML 模板字符串 / `dangerouslySetInnerHTML`）；
- 所有业务逻辑、事件绑定、路由、快捷键均由 **TypeScript** 编写并随构建产物打包；
- 全局基础样式在入口统一导入，页面/组件专属样式使用 **CSS Modules**（自动哈希隔离）；
- 仓库内**不再手动插入任何 `<script>` 标签**（Cloudflare RUM 由边缘自动注入，勿手动干预）。

---

## 一、目录结构规范

```
.
├── config/                    # 全局配置（缓存 cache.ts、爬虫脚本注册表 scripts.ts）
├── public/                    # 静态资源（图片/字体/_headers），不含任何脚本或页面样式
├── scripts/                   # 构建辅助脚本
├── src/
│   ├── app/                   # Next.js App Router 路由层（page.tsx / layout.tsx / api/）
│   ├── views/                 # ★ 页面组件：每个页面一个文件夹
│   │   ├── index.ts           # 页面组件统一导出（PAGES 映射，等价页面注册表）
│   │   ├── home/
│   │   │   ├── HomePage.tsx          # 页面组件
│   │   │   └── HomePage.module.css   # 页面专属样式（CSS Modules）
│   │   └── about/
│   │       ├── AboutPage.tsx
│   │       ├── AboutPage.module.css
│   │       └── members.ts            # 页面私有数据/类型
│   ├── components/            # 公共组件（跨页面复用）
│   │   ├── site-nav.tsx              # 顶部导航栏（Card/Button/Dropdown）
│   │   ├── keyboard-navigator.tsx    # 全局快捷键监听
│   │   └── ui/                       # ★ 基础元件库（button/card/dropdown）
│   ├── config/                # 前端配置（navigation.ts：站点名/导航顺序/文案键）
│   ├── i18n/                  # 轻量 i18n（I18nProvider / useI18n）
│   ├── locales/               # 翻译文件（zh.json / en.json）
│   ├── hooks/                 # 自定义 Hooks（use-key-navigation / use-overflow-detection 等）
│   ├── utils/                 # 纯函数工具（device.ts 设备检测）
│   ├── router/                # 路由注册表 routes.tsx + 快捷键映射 keymap.ts
│   ├── styles/                # 全局样式（globals.css 基础样式、custom/theme.css 设计变量）
│   ├── types/                 # 跨模块共享类型定义
│   ├── lib/                   # 服务端/核心库（kv.ts、cache-manager.ts 等）
│   └── scripts/               # 爬虫脚本框架（base-scraper.ts 等）
├── next.config.ts / tsconfig.json / wrangler.toml
└── package.json
```

命名约定：

| 内容        | 命名规则                                      | 示例                    |
| ----------- | --------------------------------------------- | ----------------------- |
| 组件文件    | `PascalCase.tsx`                              | `HomePage.tsx`          |
| CSS Modules | 与组件同名 `*.module.css`，类名 **camelCase** | `AboutPage.module.css`  |
| Hooks       | `use-<name>.ts`                               | `use-key-navigation.ts` |
| 工具/常量   | kebab-case                                    | `format-date.ts`        |
| 路由注册 id | kebab-case 小写                               | `home`、`about`         |

> 入口说明：Next.js App Router 中 `src/app/layout.tsx` 等价于 Vite 项目的
> `main.tsx`——全局样式在此导入，根组件与全局监听（如快捷键）在此挂载。
>
> ⚠️ 为什么用 `src/views` 而不是 `src/pages`：`src/pages` 是 Next.js **Pages Router**
> 的保留目录，放入非页面文件会触发旧版路由类型校验失败；本项目基于 App Router，
> 因此页面组件统一放在 `src/views`（目录职责不变，仅规避保留目录冲突）。

---

## 二、如何创建新页面

以新增页面 `projects`（路径 `/projects`）为例：

### 1. 创建页面文件夹与组件

```bash
mkdir -p src/views/projects
```

```tsx
// src/views/projects/ProjectsPage.tsx
import styles from './ProjectsPage.module.css';

interface ProjectsPageProps {
  /** 例如：来自路由注册表的其他页面路径 */
  homeHref?: string;
}

export default function ProjectsPage({ homeHref = '/' }: ProjectsPageProps) {
  return (
    <main>
      <div className={styles.page}>
        <h1>项目</h1>
        <a href={homeHref}>← 返回首页</a>
      </div>
    </main>
  );
}
```

```css
/* src/views/projects/ProjectsPage.module.css（类名 camelCase） */
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
}
```

### 2. 在路由注册表中注册

编辑 `src/router/routes.tsx`，在 `PAGE_REGISTRY` 末尾追加：

```ts
{
  id: 'projects',
  path: '/projects',
  title: '项目',
  description: 'EmbersStudio 项目页',
},
```

### 3. 创建 App Router 路由页

```bash
mkdir -p src/app/projects
```

```tsx
// src/app/projects/page.tsx
import type { Metadata } from 'next';

import ProjectsPage from '@/views/projects/ProjectsPage';
import { getPagePath, requirePageRoute } from '@/router/routes';

const route = requirePageRoute('projects');

export const metadata: Metadata = {
  title: route.title,
  description: route.description,
};

export default function Projects() {
  return <ProjectsPage homeHref={getPagePath('home')} />;
}
```

### 4. 访问 `/projects` 即可

- 开发模式：`http://localhost:3000/projects`；
- 生产构建后由 Next.js 服务端/静态渲染，HTML 可直接被爬虫抓取。

> 若页面需要客户端交互（事件、state），在组件文件顶部加 `'use client';`，
> 元信息（metadata）仍写在 `src/app/**/page.tsx`（服务端）中。

---

## 三、页面与导航注册

页面与导航采用“注册表 + 配置”双层结构：

- **路由注册表** `src/router/routes.tsx`：页面 id / 路径 / 元信息（metadata 数据源）；
- **页面组件导出** `src/views/index.ts`：统一导出各页面组件（并含 `PAGES` id→组件映射）；
- **导航配置** `src/config/navigation.ts`：站点名、导航顺序与文案翻译键（纯数据）。

新增页面的标准流程：

1. 在 `src/views/<name>/` 创建页面组件与 CSS Module；
2. 在 `src/views/index.ts` 导出组件（可加入 `PAGES`）；
3. 在 `src/router/routes.tsx` 的 `PAGE_REGISTRY` 注册路由元信息；
4. 在 `src/config/navigation.ts` 的 `NAV_ORDER` 追加 `{ id, labelKey }`（决定导航顺序）；
5. 在 `src/locales/zh.json`、`en.json` 添加 `nav.<id>` 文案；
6. 创建 `src/app/<route>/page.tsx` 渲染组件（见第二章示例，页面从 `@/views` 引入）。

> 原则：页面路径只在 `routes.tsx` 写一次；导航栏组件（`SiteNav`）读取
> `NAV_ITEMS`（路径由配置从注册表解析），文案统一走 i18n，不硬编码。
>
> ⚠️ 页面组件统一放 `src/views`，不要放 `src/pages`（Pages Router 保留目录）。

---

## 四、如何为指定按键绑定页面

快捷键映射集中在 `src/router/keymap.ts`：

```ts
export const KEY_NAV_MAP: Readonly<Record<string, string>> = {
  h: 'home', // 按 h 跳转首页
  a: 'about', // 按 a 跳转关于页
  // p: 'projects', // 新增：按 p 跳转项目页
};
```

- 键值使用小写字母（Hook 内部会 `toLowerCase()`）；
- 值为注册表中的**页面 id**，路径由 `getPagePath` 解析；
- 全局监听器由 `src/hooks/use-key-navigation.ts` 提供（`useEffect` 注册/注销），
  已通过 `src/components/keyboard-navigator.tsx` 挂载于根布局，无需每个页面重复绑定；
- 自动忽略：带修饰键（Ctrl/Alt/Meta/Shift）的按键、输入类元素
  （input/textarea/select/contentEditable）中的按键、IME 组合输入。

新增快捷键：在 `KEY_NAV_MAP` 加一行即可，无需改动其他文件。

---

## 五、基础元件（Button / Card / Dropdown）

基础元件统一位于 `src/components/ui/<name>/`，目录内为 `index.tsx` + `*.module.css`。
每个元件带默认 CSS Module 样式与完整 TypeScript props，并支持外部 `className` / `style` 覆盖。

### Button

| Prop           | 说明                                                       |
| -------------- | ---------------------------------------------------------- |
| `variant`      | `primary` / `outline` / `ghost` / `danger`，默认 `primary` |
| `size`         | `sm` / `md` / `lg`，默认 `md`                              |
| `shape`        | `rounded` / `square`，默认 `rounded`                       |
| `icon`         | 字体图标 / SVG / 任意 ReactNode                            |
| `iconPosition` | `start` / `end`，默认 `start`                              |
| `children`     | 可选；不传 children/icon 时按钮可为空（占位或装饰）        |
| `href`         | 传入后渲染为 `<a>`                                         |

```tsx
<Button size="sm">保存</Button>
<Button variant="outline" icon={<StarIcon />}>收藏</Button>
<Button shape="square">更多</Button>
<Button aria-hidden="true" />
```

### Card

| Prop       | 说明                                        |
| ---------- | ------------------------------------------- |
| `variant`  | `elevated` / `outlined` / `flat` / `tinted` |
| `radius`   | `none` / `sm` / `md` / `lg` / `xl` / `full` |
| `padding`  | `none` / `sm` / `md` / `lg`                 |
| `shadow`   | `none` / `sm` / `md` / `lg`                 |
| `children` | 任意子元素                                  |

```tsx
<Card variant="elevated" radius="lg" padding="md" shadow="md">
  <p>卡片内容</p>
</Card>
```

### Dropdown

由触发器（通常为 Button）与弹出面板（基于 Card）组成。支持两种内容方式：

- `items`：传入 `DropdownMenuItem[]`（label/icon/href/onClick/disabled/selected）；
- `children`：在面板中放任意自定义内容。

点击触发器自动展开/收起；点击外部或按 Escape 自动关闭；菜单项点击后默认收起
（`closeOnSelect={false}` 可关闭该行为）。

```tsx
<Dropdown
  trigger={
    <Button variant="ghost" size="sm">
      更多
    </Button>
  }
  items={[
    { id: 'a', label: '选项 A', onClick: () => doA() },
    { id: 'b', label: '选项 B', disabled: true },
  ]}
  align="end"
/>
```

---

## 六、导航栏配置

顶部导航栏组件为 `src/components/site-nav.tsx`（已挂载在 `src/app/layout.tsx`）：

- 左侧站点名（`SITE_NAME`）、中间导航链接、右侧语言切换与“更多”菜单；
- 当前页面激活时，链接下方显示平滑滑动下划线；
- 链接过多超出容器时，自动把放不下的链接折叠进“更多”展开栏（`useOverflowDetection` 测量）。

### 添加 / 删除 / 调整顺序

编辑 `src/config/navigation.ts` 中文件头部的 `NAV_ORDER`：

```ts
// 只改这里：顺序即显示顺序
const NAV_ORDER: readonly { id: string; labelKey: string }[] = [
  { id: 'home', labelKey: 'nav.home' },
  { id: 'about', labelKey: 'nav.about' },
  // { id: 'projects', labelKey: 'nav.projects' }, // 新增导航项
];
```

删除一行即从导航移除；调整行序即调整显示顺序。路径与文案分别由路由注册表与 i18n 提供，
组件内无需改动。

> 新增页面时别忘了在 `src/locales/*.json` 补充 `nav.*` 键，详见下一节。

---

## 七、国际化（i18n）与语言切换

项目使用自建的轻量 i18n（无第三方依赖）：

- 语言文件：`src/locales/zh.json`、`src/locales/en.json`（JSON 嵌套结构）；
- Provider/Hook：`src/i18n/index.tsx` 导出 `I18nProvider` 与 `useI18n()`；
- 语言偏好存入 localStorage（key：`embersstudio.locale`），刷新后保持；
- 语言切换下拉菜单位于导航栏右侧（显示“中”/“En”），切换即时生效。

### 组件中使用翻译

```tsx
'use client';

import { useI18n } from '@/i18n';

export function Demo() {
  const { t, locale, setLocale } = useI18n();
  return (
    <p>
      {t('nav.home')} · 当前语言：{locale}
      <button onClick={() => setLocale('en')}>English</button>
    </p>
  );
}
```

支持 `{var}` 插值：`t('nav.brandAria', { site: 'EmbersStudio' })`。

### 新增语言

1. 复制 `src/locales/zh.json` 为 `src/locales/<code>.json` 并翻译；
2. 在 `src/i18n/index.tsx` 头部配置中：
   - `type Locale` 增加语言代码；
   - `dictionaries` 注册新 JSON；
   - `LOCALE_OPTIONS` 增加 `{ code, labelKey, shortLabel }`；
3. 在语言文件里添加语言显示名键（如 `language.fr`）；
4. 组件文本全部通过 `t()` 读取，页面无需改文案。

---

## 八、设备检测与性能模式

工具位置：

- `src/utils/device.ts`：`getDeviceType()`（优先视口宽度，UA 兜底）；
- `src/hooks/use-performance-mode.ts`：`usePerformanceMode()` Hook
  （从 `@/utils/device` 亦可导入）。

### getDeviceType

```ts
import { getDeviceType } from '@/utils/device';

getDeviceType(); // 基于当前窗口宽度
getDeviceType(390); // 'mobile'（< 768）
getDeviceType(1024); // 'tablet'（< 1200）
getDeviceType(1440); // 'desktop'
```

### usePerformanceMode

返回 `{ deviceType, prefersReducedMotion, lowPower, animationsEnabled }`。
移动端或系统开启“减少动态效果”时 `animationsEnabled === false`，应关闭复杂
过渡 / 粒子 / 毛玻璃等耗电动效，保留 hover 变色等基础反馈。

```tsx
const { animationsEnabled } = usePerformanceMode();

<div className={animationsEnabled ? styles.fancy : styles.simple}>…</div>;
```

- 导航栏已在低功耗模式自动禁用下划线滑动过渡（保留变色反馈）；
- 关于页在低功耗模式自动关闭毛玻璃与过渡动效；
- 新组件按需接入同一 Hook 即可保持全站一致的动效策略。

---

## 九、构建与开发命令

| 命令                              | 说明                                             |
| --------------------------------- | ------------------------------------------------ |
| `npm install`                     | 安装依赖                                         |
| `npm run dev`                     | 启动开发服务器（http://localhost:3000）          |
| `npm run build`                   | Next.js 生产构建                                 |
| `npm run build:opennext`          | OpenNext 完整构建（生成 `.open-next/worker.js`） |
| `npm run preview`                 | Wrangler 本地预览（模拟 Cloudflare 环境）        |
| `npm run deploy`                  | 部署到 Cloudflare Workers                        |
| `npm run typecheck`               | TypeScript 类型检查（`tsc --noEmit`）            |
| `npm run lint` / `lint:fix`       | ESLint 检查 / 自动修复                           |
| `npm run format` / `format:check` | Prettier 格式化 / 检查                           |

提交前必做：

```bash
npm run format
npm run lint
npm run typecheck
```

---

## 十、常见问题与注意事项

1. **RUM 与脚本**：仓库内禁止手动插入 `<script>`（包括 `next/script`）。
   Cloudflare Web Analytics 的 RUM（`beacon.min.js` + `/cdn-cgi/rum`）由边缘自动注入，
   不做任何手动干预；如确需调整请走 Cloudflare Dashboard 配置。
2. **爬虫/SEO**：页面保持服务端渲染（默认 RSC），HTML 直接可抓取；
   页面标题/描述通过 `metadata` 导出维护，新增页面记得同步。
3. **CSS Modules**：类名使用 camelCase；不要在全局 `globals.css` 中写页面专属样式，
   避免样式泄漏；全局只放 reset、字体、颜色变量等基础样式。
4. **KV 缓存**：`src/lib/kv.ts` + `config/cache.ts` 不受前端迁移影响；
   `USE_CACHE=false` 可切换实时抓取模式，TTL 默认 3600 秒。
5. **爬虫脚本**：新增脚本在 `src/scripts/` 实现 `ScraperScript` 接口，
   并注册到 `config/scripts.ts`，通过 `GET /api/data?script=<name>` 调用。
6. **类型检查**：`npm run build` 前确保 `npm run typecheck` 通过；
   若在 Windows 上构建 OpenNext 较慢，建议用 CI（Linux）或 WSL。
7. **路径别名**：`@/*` → `./src/*`，`@config/*` → `./config/*`（见 `tsconfig.json`）。

# 路由与导航配置目录（src/router）

- `routes.tsx` —— 页面注册表：路径 → 页面组件 + 元信息（导航/路由的唯一数据源）；
- `keymap.ts` —— 键盘快捷键 → 页面路径映射（见 `src/hooks/use-key-navigation.ts`）。

新增页面时先在 `routes.tsx` 注册，再在 `src/app/<route>/page.tsx` 中引用对应组件。

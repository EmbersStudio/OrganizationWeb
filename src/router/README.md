# 路由与导航配置目录（src/router）

- `routes.tsx` —— 页面注册表：id / 路径 / 标题 / 描述（导航与快捷键的公共数据源）；
- `keymap.ts` —— 键盘快捷键 → 页面路径映射（见 `src/hooks/use-key-navigation.ts`）。

新增页面流程：

1. 在 `src/views/<name>/` 创建页面组件（TSX + CSS Module）；
2. 在 `routes.tsx` 的 `PAGE_REGISTRY` 追加注册项；
3. 在 `src/app/<route>/page.tsx` 中 `requirePageRoute('<id>')` 获取元信息并渲染组件。

页面之间的导航链接与快捷键跳转均通过注册表（`getPagePath`）获取路径，避免硬编码。

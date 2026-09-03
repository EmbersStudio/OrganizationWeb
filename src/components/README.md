# 公共组件目录（src/components）

存放可复用的组件（如导航、布局、交互组件）。

约定：

- 组件文件使用 `PascalCase.tsx` 命名；
- 需要客户端交互的组件在文件顶部声明 `'use client';`；
- 组件专属样式使用同名 `*.module.css`（CSS Modules）。

基础元件库：

- `src/components/ui/button/` —— Button（variant/size/icon/shape 等参数，可完全留空）；
- `src/components/ui/card/` —— Card（variant/radius/padding/shadow 容器参数）；
- `src/components/ui/starsky/` —— StarSky / StarSkyCard（星空背景容器与组合卡片，Canvas 星星动画参数可在 TS 中配置：颜色、数量、尺寸、交互等；无内容时可作纯背景，也可复用 Card 等组件作为内容）；
- `src/components/ui/dropdown/` —— Dropdown（触发器 + Card 面板，items/children 两种内容）。
- `site-nav.tsx` —— 基于上述元件的顶部导航栏（数据来自 `src/config/navigation.ts`）。

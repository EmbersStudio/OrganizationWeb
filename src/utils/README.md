# 工具函数目录（src/utils）

存放纯函数工具（格式化、校验、常量等，不含 React 依赖）。

约定：

- 文件名使用 kebab-case（如 `format-date.ts`）；
- 每个导出函数附 JSDoc 注释。

设备检测：

- `device.ts` —— `getDeviceType()` 优先按视口宽度、UA 兜底返回
  `'mobile' | 'tablet' | 'desktop'`；同时便捷重导出
  `usePerformanceMode()`（Hook 本体位于 `src/hooks/use-performance-mode.ts`，
  遵循“utils 不放 React 实现”的约定）。
- `color.ts` —— `hexToRgb()` 将 `#rrggbb` 颜色解析为 0~1 浮点数组（供 WebGL uniform 使用）。
- `texture-generators.ts` —— 字符形状纹理（R32F）与字符图集（RGBA）生成，
  共享 ASCII 字符集与版式，供 DecryptReveal 组件使用。
- `decrypt-reveal-renderer.ts` —— DecryptReveal 的 WebGL 渲染引擎类（单图/多图共用）。
- `decrypt-reveal-props.ts` —— DecryptReveal 参数默认值合并（渲染期全量参数）。
- `image-fit.ts` —— CSS object-fit / object-position 的 Canvas 2D 复刻。

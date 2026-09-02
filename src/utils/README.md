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

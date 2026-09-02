# 自定义 Hooks 目录（src/hooks）

存放跨组件复用的自定义 Hooks（如 `useKeyNavigation`）。

约定：

- 文件名使用 `use-<name>.ts`（kebab-case）；
- 每个 Hook 以 `use` 开头，遵循 React Hooks 规则；
- 需要清理的监听器（事件、定时器）必须在 `useEffect` 返回值中注销。

常用 Hook：

- `use-key-navigation.ts` —— 全局键盘快捷键跳页；
- `use-overflow-detection.ts` —— 测量容器/子项宽度，返回应折叠进“更多”的项；
- `use-performance-mode.ts` —— 设备/系统动效偏好，返回是否启用完整动效。

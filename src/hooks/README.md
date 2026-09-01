# 自定义 Hooks 目录（src/hooks）

存放跨组件复用的自定义 Hooks（如 `useKeyNavigation`）。

约定：

- 文件名使用 `use-<name>.ts`（kebab-case）；
- 每个 Hook 以 `use` 开头，遵循 React Hooks 规则；
- 需要清理的监听器（事件、定时器）必须在 `useEffect` 返回值中注销。

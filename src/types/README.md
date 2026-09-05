# 类型定义目录（src/types）

存放跨模块共享的 TypeScript 类型与接口（如页面路由、成员数据等）。

约定：

- 与页面/模块强相关的类型就近放在对应目录；
- 跨模块复用的类型集中放本目录，文件名使用 kebab-case。

当前文件：

- `cloudflare.d.ts` —— Cloudflare 运行时环境类型补充：在全局 `CloudflareEnv`
  中声明 D1 绑定（`DB`）、Better Auth 密钥/站点地址、GitHub OAuth 等变量；
  配合 `tsconfig.json` 的 `types` 选项引入 `@cloudflare/workers-types`。

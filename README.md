# AshesStudio 官网

AshesStudio 组织的极简品牌官网，基于 **NestJS** 构建，并完整适配 **Cloudflare Workers** 部署。

## 技术栈

- NestJS（@nestjs/core + @nestjs/platform-express 官方平台适配器）
- Cloudflare 官方 cloudflare:node 桥接（nodejs_compat 下 node:http 服务器 + fetch 入口）
- Cloudflare Workers（wrangler 4，ESM 格式，nodejs_compat）
- TypeScript

## 本地开发

```bash
npm install

# 方式一：Cloudflare Workers 模拟环境（推荐，验证部署效果）
npm run cf:dev        # 访问 http://localhost:8787

# 方式二：普通 Node 环境（NestJS 传统启动方式）
npm run start         # 访问 http://localhost:3000
npm run start:dev     # 监听模式
```

首页会展示组织名称 **AshesStudio** 与品牌标语 **Creating Digital Wonders**。

## 部署到 Cloudflare

```bash
npm run cf:deploy
```

## 项目结构

```
├── wrangler.toml        # Cloudflare Workers 配置（入口 main、compatibility_date）
├── src/
│   ├── main.ts          # Workers 入口：导出标准 fetch 处理器
│   ├── bootstrap.ts     # 本地 Node 启动入口（npm run start）
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── shims/empty.ts   # wrangler 打包用空桩（NestJS 可选 lazy 依赖）
└── package.json         # 含 cf:dev / cf:deploy 脚本
```

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { httpServerHandler } from 'cloudflare:node';
import { AppModule } from './app.module';

/**
 * Cloudflare Workers 入口（wrangler.toml 中 main = "src/main.ts"）。
 *
 * 方案：使用官方平台适配器 @nestjs/platform-express 创建 NestJS 应用，
 * 并通过 Cloudflare 官方提供的 cloudflare:node 桥接（nodejs_compat 下的
 * node:http 服务器内部注册表）将标准 fetch 请求转发给 NestJS 应用处理。
 */

const NODE_SERVER_PORT = 3000;

let appStarted: Promise<void> | null = null;

async function ensureNestAppStarted(): Promise<void> {
  if (!appStarted) {
    appStarted = (async () => {
      const app = await NestFactory.create<NestExpressApplication>(
        AppModule,
        new ExpressAdapter(),
      );
      await app.init();
      // 在 nodejs_compat 环境下，listen() 不会真正占用 TCP 端口，
      // 而是把 HTTP 服务器注册到 cloudflare:node 的内部表中，
      // 之后由 fetch 处理器按端口号将请求桥接进来。
      await app.listen(NODE_SERVER_PORT);
    })();
  }
  return appStarted;
}

// 创建一次桥接处理器：fetch Request -> node:http 服务器（NestJS/Express）
const nodeHttpBridge = httpServerHandler({ port: NODE_SERVER_PORT });

export interface Env {}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    await ensureNestAppStarted();
    return nodeHttpBridge.fetch!(request as any, env, ctx);
  },
};

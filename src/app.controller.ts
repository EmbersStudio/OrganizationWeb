import { Controller, Get, Header, Inject } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  // 使用显式 @Inject 令牌注入（wrangler/esbuild 不生成 design:paramtypes 元数据，
  // 因此构造函数注入在 Worker 打包环境中不可用，属性注入 + 显式令牌则完全兼容）。
  @Inject(AppService)
  private readonly appService!: AppService;

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHomePage(): string {
    const brand = this.appService.getBrandName();
    const slogan = this.appService.getSlogan();
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${brand} — ${slogan}</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
        color: #f5f5f7;
        background: radial-gradient(1200px 600px at 20% 0%, #1c2233 0%, #0d0f17 55%, #07080d 100%);
      }
      main { text-align: center; padding: 2rem; }
      .brand {
        font-size: clamp(3rem, 10vw, 6.5rem);
        font-weight: 800;
        letter-spacing: 0.04em;
        background: linear-gradient(120deg, #ffffff, #ffb86c);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .slogan {
        margin-top: 1.25rem;
        font-size: clamp(1.1rem, 3vw, 1.6rem);
        font-weight: 300;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: #aab3c4;
      }
      footer {
        position: fixed; left: 0; right: 0; bottom: 1.25rem;
        text-align: center; color: #5c6474; font-size: 0.8rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1 class="brand">${brand}</h1>
      <p class="slogan">${slogan}</p>
    </main>
    <footer>© ${new Date().getFullYear()} ${brand} · Powered by NestJS on Cloudflare Workers</footer>
  </body>
</html>`;
  }
}

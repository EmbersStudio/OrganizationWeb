# 性能优化说明

本站（embers-studio.crimsonseraph.top）曾出现以下首屏性能问题（依据瀑布图数据）：

| 问题         | 现象                                                                  | 根因                                                                        |
| ------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| RUM 阻塞     | 文档 → `v3d52b…js` → `/cdn-cgi/rum`，RUM 请求耗时 7.52s，阻塞后续资源 | Cloudflare Web Analytics **自动注入**的脚本位于关键链路，且无法在仓库内修改 |
| 大文件下载慢 | 73.4kB / 48.5kB 的 JS 耗时 6.87s / 3.36s（约 100KB/s）                | 静态资源未命中 CDN 边缘缓存（`CF-Cache-Status: MISS`），实际回源            |
| JS 串行加载  | 6 个 JS 文件串行                                                      | RUM 阻塞 + 无边缘缓存放大；Next.js 16 构建产物本身已是 `async` + `preload`  |
| CSS 加载晚   | CSS 在 600ms 后才开始下载                                             | 旧版本未对页面 CSS 发出 `preload`（当前构建已自动生成）                     |

## 已完成（仓库内改动）

### 1. 静态资源缓存规则 — `public/_headers`

按 [OpenNext Cloudflare 官方推荐](https://opennext.js.org/cloudflare/perf) 增加 `public/_headers`，
构建期由 OpenNext 复制到 `.open-next/assets/_headers`，由
[Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/headers/) 生效：

- `/_next/static/*` → `Cache-Control: public,max-age=31536000,immutable`（Next.js 产物文件名带内容哈希，可永久缓存，浏览器与 CDN 边缘都命中）；
- `/scripts/*`、`/styles/*` → `Cache-Control: public,max-age=86400`（非哈希文件，更新后 URL 不变，使用 1 天短缓存；迁移后仓库已无这两类静态资源，规则保留无副作用）。

### 2. RUM：由 Cloudflare 边缘自动注入（不手动干预）

按「纯 TypeScript 迁移」规范，仓库内不再手动插入任何 RUM 脚本（移除了此前基于
`NEXT_PUBLIC_CF_BEACON_TOKEN` + `next/script` 的手动接入方案），
Cloudflare Web Analytics 的 `beacon.min.js` + `/cdn-cgi/rum` 由边缘自动注入，
仓库不做任何手动干预。

若仍希望 RUM 异步化（避免位于首屏关键链路），请在 Cloudflare Dashboard →
Web Analytics 中关闭「自动注入」并使用其提供的异步接入方式（不依赖本仓库代码）。

### 3. 无需改动的部分（已由 Next.js 16 自动完成）

- **JS chunk 并行加载**：构建产物中所有 chunk 均为 `<script async>`，入口脚本与页面 CSS 已自动生成 `<link rel="preload">`；
- **页面 CSS 提前下载**：页面样式已收敛为 CSS Modules（随页面 chunk 打包），Next.js 自动在 `<head>` 中输出 `preload`，浏览器会在解析 HTML 时尽早发起请求；
- **压缩**：Cloudflare 边缘默认对 text 类资源启用 Brotli/Gzip，无需仓库改动。

## 需要你在 Cloudflare Dashboard 完成的操作

1. **关闭 Web Analytics 自动注入**：Dashboard → Web Analytics → 找到本站点 → 关闭「Automatic setup / 自动注入」，并删除自动生成的 beacon 片段。这是消除 7.52s RUM 阻塞的关键一步。
2. **确认 Brotli 开启**（默认开启）：Dashboard → Speed → Optimization → Content Optimization → Brotli = ON。
3. **验证 CDN 缓存命中**：部署后检查静态资源响应头 `CF-Cache-Status: HIT` 与 `Cache-Control: public,max-age=31536000,immutable`。

## 验证方法

```bash
# 1. 响应头检查（替换为实际部署后的哈希文件名）
curl -sI https://embers-studio.crimsonseraph.top/_next/static/chunks/<chunk>.js \
  -H 'Accept-Encoding: gzip, deflate, br'

# 期望看到：
#   HTTP/2 200
#   content-encoding: br
#   cache-control: public,max-age=31536000,immutable
#   cf-cache-status: HIT

# 2. 确认 RUM 不再阻塞：HTML 中应没有 Cloudflare 自动注入的同步 beacon 片段
curl -s https://embers-studio.crimsonseraph.top/ | grep -c 'beacon.min.js' || true
```

- **Lighthouse**（移动端模拟 3G/4G）目标性能评分 ≥ 90；
- **WebPageTest** 关键路径视图中，`/cdn-cgi/rum` 不应再位于主链；
- **Cloudflare 分析** 中监控缓存命中率与回源时间。

## 可选后续（低优先级）

- **103 Early Hints / HTTP/2**：如仍有首屏压力，可在 Cloudflare 开启 Early Hints（Dashboard → Speed → Optimization）并向关键资源发送 `Link` 头；本仓库暂无字体等资源，收益有限，建议先验证上述优化效果。
- **关键 CSS 内联**：当前页面 CSS 体量很小（HomePage/AboutPage 的 module.css），且已被 Next.js 自动 `preload`；若后续样式膨胀，再用 `critical`/`penthouse` 内联首屏样式。

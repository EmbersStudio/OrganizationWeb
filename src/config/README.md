# 前端配置目录（src/config）

存放纯数据配置（不包含 UI 逻辑），便于集中修改。

- `navigation.ts` —— 站点名 `SITE_NAME`、导航顺序与文案键 `NAV_ORDER`
  及派生出的 `NAV_ITEMS` / `NAV_ITEM_IDS`。路径由路由注册表（`src/router/routes.tsx`）
  解析，避免硬编码。

修改导航只需编辑 `NAV_ORDER`（文件头部），详见 BUILD_GUIDE「六、导航栏配置」。

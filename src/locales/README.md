# 语言文件目录（src/locales）

存放翻译 JSON：

- `zh.json` —— 简体中文；
- `en.json` —— English。

键结构为嵌套对象，如 `nav.home`、`about.members.crimsonseraphBadge`。
新增语言时新建 `<code>.json`，并在 `src/i18n/index.tsx` 头部注册
（`Locale`、`dictionaries`、`LOCALE_OPTIONS`），详见 BUILD_GUIDE「七、国际化」。

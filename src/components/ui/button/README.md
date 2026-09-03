# Button 按钮元件

> 组件位置：`src/components/ui/button/`

基础按钮元件，支持 **按钮（`<button>`）** 与 **链接（`<a>`）** 两种形态，可携带图标；
颜色、尺寸、外形、是否占满宽度等由 TypeScript 参数控制，不传参数时使用默认配置，外观通过 CSS Modules 实现。

---

## 一、引入

```tsx
import { Button } from '@/components/ui/button';
```

---

## 二、Props 说明

| 属性           | 类型                                          | 默认值    | 说明                                                |
| -------------- | --------------------------------------------- | --------- | --------------------------------------------------- |
| `variant`      | `primary` \| `outline` \| `ghost` \| `danger` | `primary` | 视觉变体：填充 / 描边 / 透明幽灵 / 危险色           |
| `size`         | `sm` \| `md` \| `lg`                          | `md`      | 按钮尺寸                                            |
| `shape`        | `rounded` \| `square`                         | `rounded` | 外形：圆角按钮 / 纯矩形                             |
| `icon`         | `ReactNode`                                   | 无        | 图标（字体图标 / SVG / 任意节点）                   |
| `iconPosition` | `start` \| `end`                              | `start`   | 图标位置                                            |
| `fullWidth`    | `boolean`                                     | `false`   | 是否占满父容器宽度                                  |
| `href`         | `string`                                      | 无        | 传入时渲染为 `<a>`，否则渲染为 `<button>`           |
| 其余           | 原生属性                                      | —         | `className` / `style` / `onClick` / `aria-*` 等透传 |

---

## 三、使用示例

```tsx
// 1. 基础文本按钮
<Button>保存</Button>

// 2. 仅图标（装饰/占位可完全留空）
<Button icon={<StarIcon />} aria-label="收藏" />

// 3. 图标 + 文本（图标居右）
<Button icon={<Icon />} iconPosition="end">下一步</Button>

// 4. 链接形态
<Button href="/about" variant="outline">关于我们</Button>

// 5. 全宽幽灵按钮（如折叠菜单入口）
<Button variant="ghost" size="sm" shape="square" fullWidth>更多</Button>

// 6. 危险操作
<Button variant="danger" size="lg">删除</Button>
```

---

## 四、与其他组件组合

- 作为 `Dropdown` 的触发器（接受 `onClick` 克隆注入）；
- 放入 `Card` 内容区、`StarSky` 内容层等任意容器；
- 链接形态直接使用 `href`，无需手动包裹 `<a>`。

## 五、注意事项

1. 不传 `href` 时渲染为原生 `<button>`，默认 `type="button"`，避免表单误提交；
2. 传入 `href` 时其余事件与属性透传给 `<a>`；
3. 可通过 `className` 追加自定义 CSS Module 类覆盖默认外观；
4. 需要自定义颜色/尺寸时优先使用 `variant` / `size` / `shape` 参数。

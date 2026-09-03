# Dropdown 下拉 / 展开元件

> 组件位置：`src/components/ui/dropdown/`

由**触发器**与**弹出面板**组成：面板基于 `Card`，内容既可以是标准菜单项列表（`items`），
也可以是任意自定义内容（`children`）；点击外部或按 `Escape` 自动收起，样式使用 CSS Modules。

---

## 一、引入

```tsx
import { Dropdown, type DropdownMenuItem } from '@/components/ui/dropdown';
```

---

## 二、Props 说明

| 属性             | 类型                          | 默认值  | 说明                                                   |
| ---------------- | ----------------------------- | ------- | ------------------------------------------------------ |
| `trigger`        | `ReactNode`                   | —       | 触发器，通常为 `Button`；任意接受 `onClick` 的元素均可 |
| `items`          | `readonly DropdownMenuItem[]` | 无      | 传入时渲染菜单项列表（`items` 与 `children` 二选一）   |
| `children`       | `ReactNode`                   | 无      | 面板内自定义内容（存在 `items` 时忽略）                |
| `align`          | `start` \| `end`              | `end`   | 面板水平对齐方向                                       |
| `open`           | `boolean`                     | 无      | 受控展开状态                                           |
| `defaultOpen`    | `boolean`                     | `false` | 非受控初始展开状态                                     |
| `onOpenChange`   | `(open: boolean) => void`     | 无      | 展开状态变化回调                                       |
| `closeOnSelect`  | `boolean`                     | `true`  | 选中菜单项后是否自动收起                               |
| `className`      | `string`                      | 无      | 触发器锚点容器类名                                     |
| `panelClassName` | `string`                      | 无      | 面板类名（在 Card 样式后追加）                         |
| `itemClassName`  | `string`                      | 无      | 菜单项类名                                             |

### DropdownMenuItem（菜单项）

| 属性       | 类型         | 说明                           |
| ---------- | ------------ | ------------------------------ |
| `id`       | `string`     | 唯一 ID（React key）           |
| `label`    | `ReactNode`  | 显示内容                       |
| `icon`     | `ReactNode`  | 可选图标                       |
| `href`     | `string`     | 可选链接地址（渲染为 `<a>`）   |
| `disabled` | `boolean`    | 禁用态                         |
| `selected` | `boolean`    | 选中态（如语言菜单中当前语言） |
| `onClick`  | `() => void` | 点击回调（默认触发后收起）     |

---

## 三、使用示例

```tsx
// 1. 标准菜单列表（含选中态与图标）
<Dropdown
  trigger={<Button variant="outline">更多</Button>}
  items={[
    { id: 'settings', label: '设置', icon: <Icon />, onClick: openSettings },
    { id: 'docs', label: '文档', href: '/docs' },
    { id: 'danger', label: '删除', disabled: true },
  ]}
  align="end"
/>

// 2. 自定义面板内容（不使用 items）
<Dropdown trigger={<Button>语言</Button>}>
  <p>任意自定义内容，也可放入 Card / 表单等组件</p>
</Dropdown>

// 3. 受控使用
const [open, setOpen] = useState(false);
<Dropdown
  trigger={<Button>更多</Button>}
  open={open}
  onOpenChange={setOpen}
  items={moreItems}
/>
```

---

## 四、与其他组件组合

- 触发器通常传 `Button`，站点导航的“更多”与语言切换菜单即基于 Dropdown 构建；
- 面板为 `Card` 容器，可通过 `panelClassName` 调整定位与宽度；
- 语言菜单等场景可配合 `selected` 标记当前语言。

## 五、注意事项

1. `items` 与 `children` 同时存在时以 `items` 为准；
2. 触发器若不是 React 元素（如纯文本），组件会渲染兜底按钮；
3. 点击外部区域或按下 `Escape` 自动收起；
4. `href` 菜单项渲染为链接，其余渲染为 `role="menuitem"` 的按钮，便于无障碍访问。

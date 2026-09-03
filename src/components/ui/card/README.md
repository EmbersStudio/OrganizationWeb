# Card 卡片容器元件

> 组件位置：`src/components/ui/card/`

通用卡片容器：可容纳任意子组件，外观（视觉变体 / 圆角 / 内边距 / 阴影）通过 TypeScript 参数控制，
不传参数时使用默认配置；样式使用 CSS Modules，暗色玻璃拟态风格，适合与 Button / Dropdown / StarSky 等组合。

---

## 一、引入

```tsx
import { Card } from '@/components/ui/card';
```

---

## 二、Props 说明

| 属性       | 类型                                             | 默认值     | 说明                                                |
| ---------- | ------------------------------------------------ | ---------- | --------------------------------------------------- |
| `variant`  | `elevated` \| `outlined` \| `flat` \| `tinted`   | `elevated` | 视觉变体：玻璃拟态 / 描边 / 极淡 / 橙色点缀         |
| `radius`   | `none` \| `sm` \| `md` \| `lg` \| `xl` \| `full` | `md`       | 圆角档位                                            |
| `padding`  | `none` \| `sm` \| `md` \| `lg`                   | `md`       | 内边距档位                                          |
| `shadow`   | `none` \| `sm` \| `md` \| `lg`                   | `md`       | 阴影档位                                            |
| `children` | `ReactNode`                                      | 无         | 卡片内容                                            |
| 其余       | 原生 `div` 属性                                  | —          | `className` / `style` / `onClick` / `aria-*` 等透传 |

---

## 三、使用示例

```tsx
// 1. 默认卡片
<Card>
  <h3>标题</h3>
  <p>正文内容</p>
</Card>

// 2. 组合参数：大圆角 + 宽松内边距 + 强阴影
<Card variant="elevated" radius="xl" padding="lg" shadow="lg">
  <h3>登录</h3>
  <Button>提交</Button>
</Card>

// 3. 内容仅作分隔时不留内边距
<Card variant="outlined" radius="lg" padding="none">
  <p>用于包住列表/菜单</p>
</Card>

// 4. 纯装饰 / 自定义样式
<Card variant="flat" className={styles.myCard} aria-hidden="true" />
```

---

## 四、与其他组件组合

- 顶部导航胶囊（`site-nav`）基于 Card + Button + Dropdown 构建；
- `Dropdown` 弹出面板内部就是 Card（`variant` / `radius` / `padding` / `shadow` 可控）；
- 在 `StarSky` 内容层中放 Card，即可获得“星空 + 玻璃卡片”效果（见 `ui/starsky/README.md`）；
- `StarSkyCard` 内部也复用了本组件。

## 五、注意事项

1. Card 只负责容器外观，不限制内容结构与交互；
2. `padding="none"` 配合列表/菜单时自行控制子元素间距；
3. 可通过 `className` 追加自定义 CSS Module 类覆盖默认外观。

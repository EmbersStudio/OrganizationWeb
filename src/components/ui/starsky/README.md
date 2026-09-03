# StarSky / StarSkyCard · 星空背景组件

> 组件位置：`src/components/ui/starsky/`
> 视觉与动画参考：`HTMLTest/index.html`（星星拖尾、鼠标/触摸视差漂移、纵深缩放）

StarSky 是一组基于 **Canvas + CSS Modules** 的星空背景组件：

- 可作为**纯背景**（容器内只渲染星空），也可在星空中叠加任意内容；
- 提供便捷组合组件 **StarSkyCard**（内部复用基础元件 `Card`），在卡片中放置子组件；
- 星星**颜色、数量、尺寸、速度、是否交互等参数均在 TypeScript 中定义**，不传参数时使用默认配置；
- 支持通过 `center` 指定**运动中心点**（关键字或具体坐标），通过 `mode` 切换**整体运动模式**（扩散 / 收缩 / 顺时针、逆时针旋转）；
- 背景渐变等视觉样式由 **CSS Modules** 定义，颜色通过 CSS 变量注入，方便整体覆盖。

---

## 一、引入

```tsx
import { StarSky, StarSkyCard } from '@/components/ui/starsky';
// 也可默认引入
import StarSky from '@/components/ui/starsky';
```

两个组件都需要客户端运行（Canvas 动画），组件文件内部已声明 `'use client';`，可直接在页面组件中使用。

---

## 二、属性说明

### StarSkyConfig（星空配置，两者通用）

| 属性                | 类型                       | 默认值                       | 说明                                                                             |
| ------------------- | -------------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| `starColor`         | `string`                   | `'rgba(255, 255, 255, 0.5)'` | 星星（拖尾）颜色                                                                 |
| `starCount`         | `number`                   | 自动计算                     | 星星数量；缺省时按 `(容器宽 + 容器高) / 8` 计算                                  |
| `starSize`          | `number`                   | `3`                          | 星星基础尺寸（线宽）                                                             |
| `starMinScale`      | `number`                   | `0.2`                        | 星星最小缩放比例（纵深下限）                                                     |
| `overflowThreshold` | `number`                   | `50`                         | 星星移出容器多少像素后回收重放                                                   |
| `speed`             | `number`                   | `1`                          | 运动速度**缩放系数**：扩散/收缩实际 = 0.0009 × speed，旋转实际 = 0.00009 × speed |
| `mode`              | `StarSkyMode`              | `expand`                     | 整体运动模式：`expand` / `shrink` / `rotate-cw` / `rotate-ccw`                   |
| `center`            | `StarSkyCenter`            | `{ x: 'mid', y: 'mid' }`     | 运动中心点，见下方关键字说明                                                     |
| `interactive`       | `boolean`                  | `true`                       | 是否响应鼠标/触摸产生视差漂移                                                    |
| `twinkle`           | `boolean`                  | `true`                       | 是否让星星逐帧随机闪烁                                                           |
| `backgroundColors`  | `[string, string, string]` | 参考示例三段渐变             | 背景渐变的三段颜色                                                               |
| `background`        | `string`                   | 无                           | 自定义完整 CSS `background`，优先级最高                                          |

> **`center` 关键字取值**（按 CSS 语义解析，也支持 px / % / number）
>
> - `x`：`left` = 0、`mid` / `center` = 50%、`right` = 100%，或如 `100px`、`30%`、数字（px）；
> - `y`：`up` = 0、`mid` / `center` = 50%、`bottom` = 100%，或如 `100px`、`30%`、数字（px）。

**`mode` 四种整体运动模式**（默认 `expand`，保持“从中间扩散”的原有行为）：

| 模式         | 效果说明                                                                          |
| ------------ | --------------------------------------------------------------------------------- |
| `expand`     | 从中心点向外扩散（默认，星星 z 逐渐变大、向四周飞散）                             |
| `shrink`     | 从四周向中心点收缩（z 的变化与 expand 相反，逐渐变小并落入中心后于边缘外重生）    |
| `rotate-cw`  | 绕中心点顺时针旋转（z 保持随机纵深不变，不拉近也不拉远，仅按 z 缩放转速体现纵深） |
| `rotate-ccw` | 绕中心点逆时针旋转                                                                |

> **`speed` 换算规则**（`speed` 是缩放系数，不是原始速度）：
>
> - 扩散/收缩：每帧 `z` 变化 = `0.0009 × speed`（默认 1 时即 0.0009）；
> - 旋转：每帧角速度 = `0.00009 × speed`，再按 `star.z` 缩放（z 越大转速越快，体现纵深）。

> 旋转模式中星星沿圆周运动，可能短暂经过画面边缘外侧；只有当它超出 `overflowThreshold`
> 时才会在画布内重新生成，且保持正常的 z（不会生成极淡的细小星星），因此画面亮度与数量不会随时间衰减。

默认配置常量 `DEFAULT_STAR_SKY_CONFIG` 也已导出，可参考或复用：

```ts
import { DEFAULT_STAR_SKY_CONFIG } from '@/components/ui/starsky';
```

### StarSky（星空容器）其他属性

| 属性               | 类型            | 默认值  | 说明                                   |
| ------------------ | --------------- | ------- | -------------------------------------- |
| `children`         | `ReactNode`     | 无      | 叠加在星空上的内容，默认水平垂直居中   |
| `fullScreen`       | `boolean`       | `false` | 固定铺满整个视口（纯背景模式）         |
| `contentClassName` | `string`        | 无      | 内容层自定义类名                       |
| 其余               | 原生 `div` 属性 | —       | `className` / `style` 等（如控制尺寸） |

> 容器无内容（children）时默认最小高度为 `18rem`；如需其他尺寸可通过
> `style={{ '--starsky-min-height': '…' }}` 或直接 `style={{ minHeight: '…' }}` 覆盖，
> 也可以给外层包裹容器定高。

### StarSkyCard（星空 + Card 组合卡片）

| 属性        | 类型           | 说明                                                                                             |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `cardProps` | `CardProps`    | 传给内部 `Card` 的参数：`variant` / `radius` / `padding` / `shadow` / `className` 等，全部可缺省 |
| `children`  | `ReactNode`    | 卡片内子组件                                                                                     |
| 其余        | `StarSkyProps` | 星空相关配置同上                                                                                 |

---

## 三、使用示例

### 1. 纯背景：容器内只有星空

页面中需要一块“自带星空”的区域时，直接使用 `StarSky` 并给容器尺寸：

```tsx
// ExampleBg.tsx
import { StarSky } from '@/components/ui/starsky';
import styles from './ExampleBg.module.css';

export default function ExampleBg() {
  return <StarSky className={styles.sky} />;
}
```

```css
/* ExampleBg.module.css */
.sky {
  height: 100vh; /* 明确高度；默认最小高度 18rem */
}
```

全屏铺满视口可开启 `fullScreen`（等效参考示例中固定画布的效果）：

```tsx
<StarSky fullScreen aria-hidden="true" />
```

### 2. 在星空中叠加任意内容（可复用 Card 等元件）

```tsx
// 例如首页 Hero 区域
import { Card, Button } from '@/components/ui/...'; // 实际路径以项目为准
import { StarSky } from '@/components/ui/starsky';

<StarSky className={styles.hero}>
  <Card variant="elevated" radius="lg" padding="lg" shadow="lg">
    <h2>欢迎来到星空</h2>
    <p>内容默认显示在星空之上，可放置任何组件。</p>
    <Button>开始</Button>
  </Card>
</StarSky>;
```

### 3. StarSkyCard：一站式星空卡片

需要“星空背景 + 卡片容器”的组合卡片时使用 `StarSkyCard`，内部已复用 `Card`：

```tsx
// 登录/介绍卡片
<StarSkyCard
  starCount={120}
  backgroundColors={['#0a1432', '#3a1050', '#05050f']}
  cardProps={{ variant: 'elevated', radius: 'xl', padding: 'lg', shadow: 'lg' }}
>
  <h3>成员信息</h3>
  <p>这里可以放任意子组件（文本、表单、列表等）。</p>
</StarSkyCard>
```

- 不传 `cardProps` 时，`Card` 使用自身的全部默认参数；
- 不传 `children` 时也可以作为一块“星空卡片”纯装饰背景使用。

### 4. 自定义星空参数

```tsx
<StarSky
  starColor="rgba(255, 220, 160, 0.9)" // 暖金色星星
  starCount={80} // 固定星星数量，而非按面积自动计算
  starSize={2.5}
  starMinScale={0.35}
  speed={2} // 缩放系数：整体运动快 2 倍
  interactive={false} // 关闭鼠标视差
  twinkle={false} // 关闭逐帧闪烁
  backgroundColors={['#1b0a2e', '#31124e', '#0a0614']}
>
  <p>自定义星空样式</p>
</StarSky>
```

> 若需要完全自定义背景（图片等），使用 `background` 属性覆盖整段渐变：

```tsx
<StarSky background="radial-gradient(circle at 50% 30%, #241a4d, #05050f)">…</StarSky>
```

### 5. 设置运动中心点与整体运动模式

```tsx
// 向左侧中部收缩（星星被“吸入”左中位置）
<StarSky mode="shrink" center={{ x: 'left', y: 'mid' }}>
  <p>向中心收缩</p>
</StarSky>

// 以画面 (200, 150) 为轴顺时针旋转（数字按 px 处理）
<StarSky mode="rotate-cw" center={{ x: 200, y: 150 }} />

// 以右侧底部附近为轴逆时针旋转（也可使用百分比定位）
<StarSky mode="rotate-ccw" center={{ x: 'right', y: 'bottom' }} />

// 中心点偏移的默认扩散模式：例如从画面左上 1/4 处扩散
<StarSky mode="expand" center={{ x: '25%', y: 'up' }} />
```

> 旋转模式中 `speed` 是缩放系数：默认即 0.00009 × z 的慢速旋转；近处（z 大）的星星转速更快，远处较慢，形成纵深观感；
> 收缩模式回收时 z 会被重置为较大值，在边缘外重生后再次吸入中心，形成持续循环。

---

## 四、注意事项

1. **动画逻辑仿照参考 HTML**：星星带拖尾；`twinkle` 开启时每帧随机透明度；
   鼠标/触摸移动会给星空叠加惯性视差（`interactive` 可关闭）。
   `center` 负责指定运动中心（默认正中），`mode` 负责整体运动方式（默认 `expand` 从中间扩散）。
2. **系统减少动态效果**：组件监听 `prefers-reduced-motion`，开启时只静态绘制一次星空，不跑动画帧。
3. **高 DPI 适配**：画布按 `window.devicePixelRatio` 放大渲染，尺寸变化通过
   `ResizeObserver`（不支持时回退 `window.resize`）自动重建。
4. **纯背景需要高度**：容器无内容时依赖默认最小高度或外部尺寸，请结合场景设置
   `className` / `style` 或外层容器高度。
   `speed` 是缩放系数：想更快传入 `speed={2}`，想更慢传 `speed={0.5}`（默认 `1`）。
5. 内容层默认居中，如需要其他布局，可通过 `contentClassName` 覆盖；
   卡片类内容直接使用 `StarSkyCard` 即可。

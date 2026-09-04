# DecryptReveal · 解密揭示组件（WebGL2）

> 组件位置：`src/components/DecryptReveal/`

鼠标/触摸悬停处逐步“解密”内容：悬停区域显示清晰原始画面，其余区域显示字形加密，
并叠加边缘辉光、色差与乱码闪烁效果。支持两种用法：

## 一、单图模式（image）

组件自身渲染解密画布，适合“一整张图”的展示位：

```tsx
import { DecryptReveal } from '@/components/DecryptReveal';

// 不传 width/height：填满父容器（父级需明确宽高，与旧版行为一致）
<div style={{ width: '100vw', height: '100vh' }}>
  <DecryptReveal image="/demo.jpg" radius={320} cell={10} />
</div>

// 或直接指定 CSS 尺寸（常规 CSS 尺寸值均可，如 number / '50vw' / 'clamp(...)'）
<DecryptReveal image="/demo.jpg" width={320} height={240} radius={120} />
```

## 二、容器模式（children，推荐用于头像/列表）

组件把 children **原样渲染**在容器内，自动为其中每一张 `<img>` 叠加解密效果层，
**非图片内容（文字、按钮、布局）不受影响**；图片自身的 `className` / `style`、
`object-fit`、圆角、边框等样式全部继续生效，效果层与图片像素级对齐：

```tsx
<DecryptReveal className={styles.memberRow} radius={100} cell={5} scramble={0.12}>
  {members.map((member) => (
    <div key={member.id} className={styles.memberChip}>
      <img
        className={styles.memberImg} // 圆形头像、object-fit: cover 等均正常生效
        src={member.avatar}
        alt={member.name}
        crossOrigin="anonymous" // 跨域图片必须允许 CORS，否则回退为普通图片
      />
      <span>{member.name}</span>
    </div>
  ))}
</DecryptReveal>
```

容器模式注意：

- 效果层挂在 `document.body`（视口坐标系），`pointer-events: none`，
  不会拦截点击/悬停交互；指针事件绑定在真实 `<img>` 上；
- 每帧自动跟随图片几何（滚动、响应式尺寸、hover 缩放等变化）；
- 圆角按图片自身 `border-radius` 扣除边框后复刻到效果层；
- 内容像素通过 `object-fit / object-position` 复刻自浏览器渲染，解密区与真实图片一致；
- 跨域图片需在 `<img>` 上加 `crossOrigin="anonymous"` 且服务端返回 CORS 头，
  否则无法读取像素，会自动回退为普通图片并输出 `[DecryptReveal]` 前缀日志。

## 目录拆分

| 文件/目录                                 | 职责                                              |
| ----------------------------------------- | ------------------------------------------------- |
| `src/shaders/*.glsl.ts`                   | GLSL 源码（顶点 / 细胞计算 / 最终合成），原样保留 |
| `src/utils/color.ts`                      | hexToRgb 颜色解析                                 |
| `src/utils/texture-generators.ts`         | 字形特征纹理与字符图集生成（共享字符集与版式）    |
| `src/utils/decrypt-reveal-renderer.ts`    | WebGL 渲染引擎类（单图/多图共用一套渲染逻辑）     |
| `src/utils/decrypt-reveal-props.ts`       | 参数默认值合并                                    |
| `src/utils/image-fit.ts`                  | CSS object-fit / object-position 的 Canvas 复刻   |
| `src/hooks/use-decrypt-reveal.ts`         | 单图模式逻辑                                      |
| `src/hooks/use-decrypt-reveal-content.ts` | 容器模式：children 内图片扫描与效果层管理         |
| `src/components/DecryptReveal/index.tsx`  | 对外 UI 组件                                      |

## 性能说明

- WebGL 上下文、着色器、纹理只在**图片加载完成 / cell / aspect** 变化时重建；
  颜色、亮度、乱码等视觉参数通过 ref 在渲染循环内逐帧读取，实时生效且不闪烁；
- 内容纹理在初始化时**只上传一次**，动画循环仅绑定采样；
- 细胞纹理随网格尺寸显式分配存储（RGBA8），保证 FBO 完整可渲染；
- R32F 字形特征纹理上传前有可用性探测，失败会输出错误日志并进入 error 状态。

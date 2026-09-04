# DecryptReveal · 解密揭示组件（WebGL2）

> 组件位置：`src/components/DecryptReveal/`
> 逻辑来源：`HTMLTest/canvas.tsx`（已按模块拆分并优化性能）

鼠标/触摸悬停处逐步“解密”内容图片：整图先被映射为字符网格（字形加密），
指针附近的字形会被替换回原始像素，并叠加边缘辉光、色差与乱码闪烁效果。

## 目录拆分

| 文件/目录                                | 职责                                              |
| ---------------------------------------- | ------------------------------------------------- |
| `src/shaders/*.glsl.ts`                  | GLSL 源码（顶点 / 细胞计算 / 最终合成），原样保留 |
| `src/utils/color.ts`                     | hexToRgb 颜色解析                                 |
| `src/utils/texture-generators.ts`        | 字形特征纹理与字符图集生成（共享字符集与版式）    |
| `src/hooks/use-decrypt-reveal.ts`        | WebGL 初始化、渲染循环、指针与尺寸管理            |
| `src/components/DecryptReveal/index.tsx` | 对外 UI 组件                                      |

## 性能说明

- WebGL 上下文、着色器、纹理只在**图片加载完成 / cell / aspect** 变化时重建；
  颜色、亮度、乱码等视觉参数通过 ref 在渲染循环内逐帧读取，实时生效且不闪烁；
- 内容纹理在初始化时**只上传一次**，动画循环仅绑定采样；
- 细胞纹理随网格尺寸显式分配存储（RGBA8），保证 FBO 完整可渲染；
- R32F 字形特征纹理上传前有可用性探测，失败会输出错误日志并进入 error 状态。

## 使用

```tsx
import { DecryptReveal } from '@/components/DecryptReveal';

<div style={{ width: '100vw', height: '100vh' }}>
  <DecryptReveal image="/demo.jpg" radius={300} softness={0.5} color="#4ade80" scramble={0.12} />
</div>;
```

> 组件默认铺满父容器；父容器需要明确高度。跨域图片必须允许 CORS。

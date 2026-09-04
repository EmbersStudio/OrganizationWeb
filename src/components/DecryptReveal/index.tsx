'use client';

import { useDecryptReveal } from '@/hooks/use-decrypt-reveal';
import type { DecryptRevealProps } from '@/types/decrypt-reveal';

/**
 * DecryptReveal 解密揭示组件（WebGL2）。
 *
 * 基于鼠标/触摸位置逐步“解密”内容图片：图片被划分为字符网格，
 * 悬停区域内的字形被替换回原始像素并叠加辉光/色差等边缘效果。
 *
 * 用法：
 * ```tsx
 * <div style={{ width: '100vw', height: '100vh' }}>
 *   <DecryptReveal image="/demo.jpg" radius={260} cell={10} />
 * </div>
 * ```
 *
 * 说明：
 * - 组件自身不设宽度/高度，默认铺满父容器（100% × 100%）；
 * - 仅 className / style 透传到外层容器，其余参数全部交给 useDecryptReveal；
 * - 视觉参数变化（颜色/亮度/乱码等）不会重建 WebGL 资源；
 * - 图片需同源或支持 CORS，否则画布会被污染导致无法上传 GPU。
 */
export function DecryptReveal({ className, style, ...rest }: DecryptRevealProps) {
  const { containerRef, canvasRef, contentCanvasRef } = useDecryptReveal(rest);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'auto' }} />
      {/* 隐藏缓存画布：图片先由 2D 上下文绘制，再一次性上传为 WebGL 纹理 */}
      <canvas ref={contentCanvasRef} style={{ display: 'none' }} aria-hidden="true" />
    </div>
  );
}

export default DecryptReveal;

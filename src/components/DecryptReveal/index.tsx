'use client';

import { useDecryptReveal } from '@/hooks/use-decrypt-reveal';
import { useDecryptRevealContent } from '@/hooks/use-decrypt-reveal-content';
import type { DecryptRevealProps } from '@/types/decrypt-reveal';

/**
 * DecryptReveal 解密揭示组件（WebGL2），支持两种用法：
 *
 * 1. 单图模式（image）：
 *    组件自身渲染解密画布；默认填满父容器（父级需明确宽高），
 *    也可通过 width / height 传入任意 CSS 尺寸。
 *
 * 2. 容器模式（children）：
 *    把任意内容原样渲染在容器内，并自动为其中每一张 <img> 叠加解密效果层；
 *    非图片内容（文字、按钮、布局）保持原样，图片自身的 className/style、
 *    object-fit、圆角、边框等样式均继续生效（效果层像素级对齐）。
 *    容器不强制宽度/高度，默认由内容撑开。
 */
export function DecryptReveal({ image, className, style, width, height, children, ...rest }: DecryptRevealProps) {
  const singleMode = Boolean(image);
  if (singleMode && children !== undefined) {
    console.warn('[DecryptReveal] 同时传入 image 与 children 时仅生效单图模式，children 会被忽略');
  }

  // 两个 Hook 固定调用（各自内部按 image/children 是否存在自行空转，保持 Hooks 顺序稳定）
  const { containerRef, canvasRef, contentCanvasRef } = useDecryptReveal({ image, ...rest });
  const { wrapperRef } = useDecryptRevealContent({ image: undefined, ...rest });

  if (singleMode) {
    return (
      <div
        ref={containerRef}
        data-decrypt-reveal-root
        className={className}
        style={{ position: 'relative', width: width ?? '100%', height: height ?? '100%', ...style }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'auto' }} />
        {/* 隐藏缓存画布：图片先由 2D 上下文绘制，再一次性上传为 WebGL 纹理 */}
        <canvas ref={contentCanvasRef} style={{ display: 'none' }} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} data-decrypt-reveal-root className={className} style={{ width, height, ...style }}>
      {children}
    </div>
  );
}

export default DecryptReveal;

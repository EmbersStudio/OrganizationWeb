/**
 * CSS object-fit / object-position 复刻工具。
 *
 * DecryptReveal 容器模式需要为每张 <img> 生成与浏览器渲染一致的“内容画布”
 * （用于字形采样与解密区域像素），本模块把 CSS 的 object-fit 语义搬到 Canvas 2D：
 * - fill / contain / cover / none / scale-down；
 * - object-position 支持 left/top/center/right/bottom 关键字、百分比与长度（px）。
 */

/** CSS object-fit 取值 */
export type CssObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';

/** 解析单个轴对齐 token：返回 0~1 的比例（长度 token 返回以像素为单位的原始偏移，另行标记） */
function parseAxisToken(token: string | undefined): { kind: 'ratio' | 'px'; value: number } {
  const raw = token?.trim();
  if (!raw) {
    return { kind: 'ratio', value: 0.5 };
  }
  switch (raw) {
    case 'left':
    case 'top':
      return { kind: 'ratio', value: 0 };
    case 'center':
      return { kind: 'ratio', value: 0.5 };
    case 'right':
    case 'bottom':
      return { kind: 'ratio', value: 1 };
    default:
      break;
  }
  if (raw.endsWith('%')) {
    const percent = Number.parseFloat(raw);
    return Number.isFinite(percent) ? { kind: 'ratio', value: percent / 100 } : { kind: 'ratio', value: 0.5 };
  }
  const px = Number.parseFloat(raw);
  return Number.isFinite(px) ? { kind: 'px', value: px } : { kind: 'ratio', value: 0.5 };
}

/**
 * 按 CSS object-fit / object-position 把图片绘制到目标矩形中。
 *
 * @param ctx 目标 2D 上下文（画布应已设置为目标设备像素尺寸）
 * @param image 已加载完成的图片源（HTMLImageElement）
 * @param boxWidth 目标宽度（px）
 * @param boxHeight 目标高度（px）
 * @param objectFit CSS object-fit 值
 * @param objectPosition CSS object-position 值（如 "50% 50%" / "right bottom"）
 */
export function drawImageWithObjectFit(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  boxWidth: number,
  boxHeight: number,
  objectFit: CssObjectFit = 'fill',
  objectPosition = '50% 50%',
): void {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (iw < 1 || ih < 1 || boxWidth < 1 || boxHeight < 1) {
    return;
  }

  let scale = 1;
  const scaleX = boxWidth / iw;
  const scaleY = boxHeight / ih;
  switch (objectFit) {
    case 'fill':
      scale = 1;
      break;
    case 'contain':
      scale = Math.min(scaleX, scaleY);
      break;
    case 'cover':
      scale = Math.max(scaleX, scaleY);
      break;
    case 'none':
      scale = 1;
      break;
    case 'scale-down':
      scale = Math.min(1, scaleX, scaleY);
      break;
    default:
      scale = 1;
      break;
  }
  if (objectFit === 'fill') {
    ctx.drawImage(image, 0, 0, boxWidth, boxHeight);
    return;
  }

  const dw = iw * scale;
  const dh = ih * scale;
  // 空白区域偏移（object-position 语义）
  const [xToken = '50%', yToken = '50%'] = objectPosition.trim().split(/\s+/);
  const xAxis = parseAxisToken(xToken);
  const yAxis = parseAxisToken(yToken);
  const offsetX = xAxis.kind === 'px' ? xAxis.value : (boxWidth - dw) * xAxis.value;
  const offsetY = yAxis.kind === 'px' ? yAxis.value : (boxHeight - dh) * yAxis.value;
  ctx.drawImage(image, offsetX, offsetY, dw, dh);
}

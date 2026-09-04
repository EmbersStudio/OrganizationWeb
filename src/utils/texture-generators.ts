/**
 * 字符纹理生成工具（WebGL2）。
 *
 * 解码揭示效果需要两套字符纹理，两者共享同一字符集与版式绘制逻辑，
 * 统一收敛在本模块避免重复定义：
 *
 * - 形状纹理（shape texture）：R32F 浮点纹理，宽 6、高 N，
 *   存储每个 ASCII 字符在 6 个特征采样点上的归一化亮度，
 *   供细胞着色器逐格匹配“最像哪个字符”；
 * - 图集纹理（atlas texture）：RGBA 字符图集（黑底白字），
 *   供最终着色器按字形索引采样绘制具体字符。
 */

/** 可打印 ASCII 字符集（32~126），共 95 个字符 */
export const GLYPH_CHARSET: string = (() => {
  let charset = '';
  for (let i = 32; i <= 126; i++) {
    charset += String.fromCharCode(i);
  }
  return charset;
})();

/** 单个字形网格的边长（px） */
export const GLYPH_CELL_SIZE = 64;
/** 字形网格之间的留白（px） */
export const GLYPH_PAD = 8;
/** 字形绘制字体（与细胞着色器特征采样点比例保持一致） */
export const GLYPH_FONT = '600 48px monospace';

/** 特征采样点：字形内部 6 个相对位置（x/y 取值 0~1） */
export const SHAPE_SAMPLE_POINTS: readonly (readonly [number, number])[] = [
  [0.28, 0.26],
  [0.72, 0.14],
  [0.28, 0.56],
  [0.72, 0.44],
  [0.28, 0.86],
  [0.72, 0.74],
];

/** 字符图集版式参数（生成画布与纹理共用） */
export interface GlyphSheetLayout {
  /** 字形总数 */
  count: number;
  /** 图集列数 */
  cols: number;
  /** 图集行数 */
  rows: number;
  /** 网格间留白（px） */
  pad: number;
  /** 单个网格边长（px） */
  cellSize: number;
}

/**
 * 依据字符总数计算图集版式（正方形开方布局）。
 *
 * @param count 字形数量
 * @returns 版式参数（pad/cellSize 固定取 GLYPH_PAD / GLYPH_CELL_SIZE）
 */
export function getGlyphSheetLayout(count: number): GlyphSheetLayout {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { count, cols, rows, pad: GLYPH_PAD, cellSize: GLYPH_CELL_SIZE };
}

/**
 * 按共享版式绘制黑底白字的字符画布（供 CPU 采样 / GPU 上传共用）。
 *
 * @param layout 版式参数（由 getGlyphSheetLayout 获得）
 * @returns 绘制完成的 <canvas>（宽度 = cols * (cellSize + 2pad)，高度同理）
 */
export function createGlyphSheetCanvas(layout: GlyphSheetLayout): HTMLCanvasElement {
  const { count, cols, rows, pad, cellSize } = layout;
  const canvas = document.createElement('canvas');
  canvas.width = cols * (cellSize + pad * 2);
  canvas.height = rows * (cellSize + pad * 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('[DecryptReveal] 无法创建字符图集 2D 上下文');
  }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = GLYPH_FONT;

  for (let i = 0; i < count; i++) {
    const x = (i % cols) * (cellSize + pad * 2) + pad + cellSize / 2;
    const y = Math.floor(i / cols) * (cellSize + pad * 2) + pad + cellSize / 2;
    ctx.fillText(GLYPH_CHARSET[i] ?? ' ', x, y);
  }
  return canvas;
}

/** 形状纹理生成结果（纹理 + 复用图集版式） */
export interface ShapeTextureResult extends GlyphSheetLayout {
  /** 已上传的 R32F 形状纹理（宽 6 × 高 count） */
  texture: WebGLTexture;
}

/**
 * 探测当前 WebGL2 上下文是否支持 R32F 浮点纹理上传。
 *
 * WebGL2 中 R32F 并非所有实现都默认可用，失败时抛出带说明的错误，
 * 由上层 Hook 捕获并回退为错误状态（同时输出日志便于排查）。
 *
 * @param gl WebGL2 上下文
 */
function assertR32FSupported(gl: WebGL2RenderingContext): void {
  const probe = gl.createTexture();
  if (!probe) {
    throw new Error('[DecryptReveal] 无法创建 R32F 探测纹理');
  }
  gl.bindTexture(gl.TEXTURE_2D, probe);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([0]));
  const ok = gl.getError() === gl.NO_ERROR;
  gl.deleteTexture(probe);
  gl.bindTexture(gl.TEXTURE_2D, null);
  if (!ok) {
    throw new Error('[DecryptReveal] 当前环境不支持 R32F 浮点纹理，无法进行字形匹配');
  }
}

/**
 * 生成字符形状纹理（R32F，6 × N）。
 *
 * 逐字从共享字符画布读取 6 个特征采样点周边圆形区域（半径 8px）
 * 的 alpha 均值，并按字形归一化后上传 GPU。
 *
 * @param gl WebGL2 上下文
 * @returns 纹理与图集版式（count/cols/rows/pad/cellSize）
 */
export function generateShapeTexture(gl: WebGL2RenderingContext): ShapeTextureResult {
  assertR32FSupported(gl);

  const layout = getGlyphSheetLayout(GLYPH_CHARSET.length);
  const canvas = createGlyphSheetCanvas(layout);
  const imageData = ctx_getImageData(canvas);
  const data = imageData.data;
  const shapeData = new Float32Array(6 * layout.count);

  for (let g = 0; g < layout.count; g++) {
    const col = g % layout.cols;
    const row = Math.floor(g / layout.cols);
    const baseX = col * (layout.cellSize + layout.pad * 2) + layout.pad;
    const baseY = row * (layout.cellSize + layout.pad * 2) + layout.pad;
    for (let p = 0; p < SHAPE_SAMPLE_POINTS.length; p++) {
      const px = baseX + SHAPE_SAMPLE_POINTS[p][0] * layout.cellSize;
      const py = baseY + SHAPE_SAMPLE_POINTS[p][1] * layout.cellSize;
      let sum = 0;
      let n = 0;
      for (let dy = -8; dy <= 8; dy++) {
        for (let dx = -8; dx <= 8; dx++) {
          if (dx * dx + dy * dy > 64) {
            continue;
          }
          const sx = Math.round(px + dx);
          const sy = Math.round(py + dy);
          if (sx < 0 || sx >= canvas.width || sy < 0 || sy >= canvas.height) {
            continue;
          }
          sum += data[(sy * canvas.width + sx) * 4 + 3];
          n++;
        }
      }
      shapeData[g * 6 + p] = n > 0 ? sum / (255 * n) : 0;
    }
  }

  // 每个字形归一化：保证亮度整体偏亮的字符不会因绝对亮度胜出
  for (let g = 0; g < layout.count; g++) {
    let max = 0;
    for (let p = 0; p < 6; p++) {
      max = Math.max(max, shapeData[g * 6 + p]);
    }
    if (max > 0) {
      for (let p = 0; p < 6; p++) {
        shapeData[g * 6 + p] /= max;
      }
    }
  }

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('[DecryptReveal] 无法创建形状纹理');
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 6, layout.count, 0, gl.RED, gl.FLOAT, shapeData);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const uploadError = gl.getError();
  if (uploadError !== gl.NO_ERROR) {
    gl.deleteTexture(texture);
    throw new Error(`[DecryptReveal] 形状纹理上传失败（WebGL 错误码 ${uploadError}）`);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);

  return { texture, ...layout };
}

/**
 * 取画布像素数据（封装可读性，便于统一错误提示）。
 */
function ctx_getImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('[DecryptReveal] 无法读取字符画布像素数据');
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 生成字符图集纹理（RGBA，带 mipmap）。
 *
 * 复用 generateShapeTexture 的字符集与版式参数绘制同一套字符，
 * 供最终着色器 textureGrad 采样；为避免重复定义，字符绘制统一走
 * createGlyphSheetCanvas。
 *
 * @param gl WebGL2 上下文
 * @param glyphCount 字形总数（通常取 GLYPH_CHARSET.length）
 * @param cols 图集列数（来自 getGlyphSheetLayout / generateShapeTexture 结果）
 * @param rows 图集行数
 * @param pad 网格留白（px）
 * @param cellSize 网格边长（px）
 * @returns 已上传并生成 mipmap 的图集纹理
 */
export function generateAtlasTexture(
  gl: WebGL2RenderingContext,
  glyphCount: number,
  cols: number,
  rows: number,
  pad: number,
  cellSize: number,
): WebGLTexture {
  const canvas = createGlyphSheetCanvas({ count: glyphCount, cols, rows, pad, cellSize });
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('[DecryptReveal] 无法创建图集纹理');
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

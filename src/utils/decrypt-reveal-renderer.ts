/**
 * DecryptReveal 渲染引擎（纯类实现，不依赖 React）。
 *
 * 每个实例负责一块 WebGL 画布：
 * - 编译着色器、创建纹理 / FBO / 顶点缓冲；
 * - 将“内容画布”（2D，已按目标绘制/裁剪好）上传为纹理（初始化一次，可显式重传）；
 * - 逐帧执行“细胞纹理 → 最终合成”两趟绘制，动态读取外部最新 props；
 * - 提供 setViewport / setPointerTarget 供宿主（单图模式或多图 overlay 模式）驱动。
 *
 * 渲染循环由宿主通过 frame(now) 驱动，本类不自行 requestAnimationFrame，
 * 以便单图与多图场景共用一套渲染逻辑。
 */

import { cellShaderSource } from '@/shaders/cell.frag.glsl';
import { finalShaderSource } from '@/shaders/final.frag.glsl';
import { vertexShaderSource } from '@/shaders/vertex.glsl';
import { GLYPH_CELL_SIZE, GLYPH_PAD, generateAtlasTexture, generateShapeTexture } from '@/utils/texture-generators';
import type { ResolvedDecryptRevealProps } from '@/types/decrypt-reveal';
import { hexToRgb } from '@/utils/color';

/** 着色器 uniform 位置表（可能为 null，表示被编译器优化掉） */
type UniformMap = Record<string, WebGLUniformLocation | null>;

/** 一次着色器程序资源包 */
interface ShaderProgramBundle {
  program: WebGLProgram;
  vs: WebGLShader;
  fs: WebGLShader;
  uniforms: UniformMap;
}

/** 渲染尺寸布局（设备像素） */
interface RenderLayout {
  /** 容器 CSS 宽度（逻辑 px） */
  cssWidth: number;
  /** 容器 CSS 高度（逻辑 px） */
  cssHeight: number;
  /** 画布设备像素宽 */
  w: number;
  /** 画布设备像素高 */
  h: number;
  /** devicePixelRatio（上限 2） */
  dpr: number;
  /** 网格单元高（设备像素） */
  cellPx: number;
  /** 网格单元宽（设备像素） */
  cellW: number;
  /** 网格行数 */
  gridRows: number;
  /** 网格列数 */
  gridCols: number;
}

/** 指针状态（当前值与目标值，逐帧指数平滑） */
interface PointerState {
  x: number;
  y: number;
  active: number;
  targetX: number;
  targetY: number;
  targetActive: number;
}

/** DecryptRevealRenderer 构造参数 */
export interface DecryptRevealRendererOptions {
  /** 可见 WebGL 画布（由宿主创建并挂载） */
  canvas: HTMLCanvasElement;
  /** 每帧读取最新渲染参数（宿主通过 ref 提供） */
  getProps: () => ResolvedDecryptRevealProps;
  /** 返回当前内容画布（2D），首次 init 与显式 uploadContent 时上传 */
  getContentCanvas: () => HTMLCanvasElement | null;
}

/**
 * DecryptReveal 渲染引擎。
 *
 * 用法：
 * 1. new DecryptRevealRenderer({ canvas, getProps, getContentCanvas })；
 * 2. 内容画布就绪后调用 init({ cssWidth, cssHeight, dpr })；
 * 3. 宿主每帧调用 frame(now)，尺寸变化调用 setViewport，指针移动调用 setPointerTarget；
 * 4. 卸载时调用 dispose()。
 */
export class DecryptRevealRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly getProps: () => ResolvedDecryptRevealProps;
  private readonly getContentCanvas: () => HTMLCanvasElement | null;

  private gl: WebGL2RenderingContext | null = null;
  private cellProgram: ShaderProgramBundle | null = null;
  private finalProgram: ShaderProgramBundle | null = null;
  private buffer: WebGLBuffer | null = null;
  private contentTexture: WebGLTexture | null = null;
  private shapeTexture: WebGLTexture | null = null;
  private cellTexture: WebGLTexture | null = null;
  private atlasTexture: WebGLTexture | null = null;
  private fbo: WebGLFramebuffer | null = null;

  private glyphCount = 0;
  private atlasCols = 0;
  private atlasRows = 0;
  private atlasPadFrac = 0;
  private atlasInnerFrac = 0;

  private layout: RenderLayout = {
    cssWidth: 0,
    cssHeight: 0,
    w: 1,
    h: 1,
    dpr: 1,
    cellPx: 1,
    cellW: 1,
    gridRows: 1,
    gridCols: 1,
  };

  private contentWidth = 0;
  private contentHeight = 0;
  private pointer: PointerState = {
    x: -100000,
    y: -100000,
    active: 0,
    targetX: -100000,
    targetY: -100000,
    targetActive: 0,
  };
  private time = 0;
  private prevTime = -1;
  private initialized = false;
  private disposed = false;

  constructor(options: DecryptRevealRendererOptions) {
    this.canvas = options.canvas;
    this.getProps = options.getProps;
    this.getContentCanvas = options.getContentCanvas;
  }

  /** 是否已初始化 WebGL 资源 */
  get ready(): boolean {
    return this.initialized;
  }

  /**
   * 初始化 WebGL 资源并上传当前内容纹理。
   *
   * 失败时抛出带模块前缀的错误；宿主应捕获并输出日志。
   *
   * @param cssWidth 内容区 CSS 宽度（逻辑 px）
   * @param cssHeight 内容区 CSS 高度（逻辑 px）
   * @param dpr devicePixelRatio（建议上限 2）
   */
  init(cssWidth: number, cssHeight: number, dpr: number): void {
    if (this.initialized || this.disposed) {
      return;
    }
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      throw new Error('[DecryptReveal] 当前浏览器不支持 WebGL2');
    }
    this.gl = gl;

    try {
      const cellProgram = this.createProgram(vertexShaderSource, cellShaderSource);
      const finalProgram = this.createProgram(vertexShaderSource, finalShaderSource);
      this.cellProgram = cellProgram;
      this.finalProgram = finalProgram;

      // 全屏三角形带
      this.buffer = gl.createBuffer();
      if (!this.buffer) {
        throw new Error('[DecryptReveal] 无法创建顶点缓冲');
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      // 内容纹理（占位，稍后 uploadContent 填充）
      this.contentTexture = this.createTexture(gl.LINEAR);

      // 字形特征纹理 + 字符图集
      const shapeResult = generateShapeTexture(gl);
      this.shapeTexture = shapeResult.texture;
      this.glyphCount = shapeResult.count;
      this.atlasCols = shapeResult.cols;
      this.atlasRows = shapeResult.rows;
      const atlasUnit = GLYPH_CELL_SIZE + GLYPH_PAD * 2;
      this.atlasPadFrac = GLYPH_PAD / atlasUnit;
      this.atlasInnerFrac = GLYPH_CELL_SIZE / atlasUnit;
      this.atlasTexture = generateAtlasTexture(
        gl,
        this.glyphCount,
        this.atlasCols,
        this.atlasRows,
        shapeResult.pad,
        shapeResult.cellSize,
      );

      // 细胞纹理 + FBO
      this.cellTexture = this.createTexture(gl.NEAREST);
      this.fbo = gl.createFramebuffer();
      if (!this.fbo) {
        throw new Error('[DecryptReveal] 无法创建帧缓冲');
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.cellTexture, 0);

      this.initialized = true;
      this.setViewport(cssWidth, cssHeight, dpr);
      this.uploadContent();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  /**
   * 更新画布尺寸与网格布局（窗口尺寸 / overlay 元素尺寸变化时调用）。
   * 尺寸变化时同步重分配细胞纹理存储。
   */
  setViewport(cssWidth: number, cssHeight: number, dpr: number): void {
    if (!this.gl || this.disposed) {
      return;
    }
    const cellPx = Math.max(4, Math.min(40, this.getProps().cell)) * dpr;
    const cellW = cellPx * this.getProps().aspect;
    const cellH = cellPx;
    const w = Math.max(1, Math.round(cssWidth * dpr));
    const h = Math.max(1, Math.round(cssHeight * dpr));
    const gridCols = Math.max(1, Math.ceil(w / cellW));
    const gridRows = Math.max(1, Math.ceil(h / cellH));

    const changed =
      this.layout.w !== w ||
      this.layout.h !== h ||
      this.layout.cssWidth !== cssWidth ||
      this.layout.cssHeight !== cssHeight;
    this.layout = { cssWidth, cssHeight, w, h, dpr, cellPx, cellW, gridRows, gridCols };
    this.canvas.width = w;
    this.canvas.height = h;

    if (changed && this.cellTexture && this.gl) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.cellTexture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        gridCols,
        gridRows,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null,
      );
    }
  }

  /** 重新上传内容画布纹理（内容画布尺寸/像素变化后调用）。 */
  uploadContent(): void {
    if (!this.gl || !this.contentTexture || this.disposed) {
      return;
    }
    const content = this.getContentCanvas();
    if (!content) {
      return;
    }
    this.contentWidth = content.width;
    this.contentHeight = content.height;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.contentTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, content);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  /** 更新指针目标（坐标为内容区 CSS 逻辑像素，原点左上）。 */
  setPointerTarget(x: number, y: number, active: 0 | 1): void {
    this.pointer.targetX = x;
    this.pointer.targetY = y;
    this.pointer.targetActive = active;
  }

  /** 指针离开内容区（平滑淡出揭示效果）。 */
  clearPointer(): void {
    this.pointer.targetActive = 0;
  }

  /**
   * 渲染一帧（由宿主 RAF 循环调用）。
   *
   * @param now performance.now() / requestAnimationFrame 时间戳
   */
  frame(now: number): void {
    if (!this.gl || this.disposed || !this.initialized) {
      return;
    }
    if (this.prevTime < 0) {
      this.prevTime = now;
    }
    const dt = Math.min((now - this.prevTime) / 1000, 1 / 30);
    this.prevTime = now;
    this.time += dt;

    // 平滑插值指针
    const p = this.getProps();
    const smooth = Math.max(p.smoothing, 0.0001);
    const alpha = 1 - Math.exp(-dt / smooth);
    this.pointer.x += (this.pointer.targetX - this.pointer.x) * alpha;
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * alpha;
    this.pointer.active += (this.pointer.targetActive - this.pointer.active) * alpha;

    const gl = this.gl;
    const cellU = this.cellProgram?.uniforms ?? {};
    const finalU = this.finalProgram?.uniforms ?? {};
    const layout = this.layout;
    if (!this.cellProgram || !this.finalProgram || !this.cellTexture || !this.fbo) {
      return;
    }

    // ---- 第一趟：细胞纹理 ----
    gl.useProgram(this.cellProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.contentTexture);
    gl.uniform1i(cellU.uContent, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.uniform1i(cellU.uShapes, 1);
    gl.uniform2f(cellU.uContentRes, this.contentWidth, this.contentHeight);
    gl.uniform2f(cellU.uCellPx, layout.cellW, layout.cellPx);
    gl.uniform1i(cellU.uGlyphCount, this.glyphCount);
    gl.uniform1f(cellU.uContrast, Math.min(Math.max(p.contrast, 0.3), 3));
    gl.uniform1f(cellU.uExposure, Math.min(Math.max(p.exposure, 0.2), 3));
    gl.uniform1f(cellU.uThreshold, Math.max(p.threshold, 0.005));
    const bg = hexToRgb(p.background);
    gl.uniform3f(cellU.uBg, bg[0], bg[1], bg[2]);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, layout.gridCols, layout.gridRows);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // ---- 第二趟：最终合成 ----
    gl.useProgram(this.finalProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.contentTexture);
    gl.uniform1i(finalU.uContent, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.cellTexture);
    gl.uniform1i(finalU.uCells, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(finalU.uAtlas, 2);

    gl.uniform2f(finalU.uRes, layout.cssWidth, layout.cssHeight);
    gl.uniform1f(finalU.uDpr, layout.dpr);
    gl.uniform2f(finalU.uCellPx, layout.cellW, layout.cellPx);
    gl.uniform2f(finalU.uGrid, layout.gridCols, layout.gridRows);
    gl.uniform2f(finalU.uAtlasGrid, this.atlasCols, this.atlasRows);
    gl.uniform2f(finalU.uAtlasPad, this.atlasPadFrac, this.atlasPadFrac);
    gl.uniform2f(finalU.uAtlasInner, this.atlasInnerFrac, this.atlasInnerFrac);
    gl.uniform1i(finalU.uGlyphCount, this.glyphCount);
    gl.uniform2f(finalU.uPointer, this.pointer.x, this.pointer.y);
    gl.uniform1f(finalU.uActive, this.pointer.active);
    gl.uniform1f(finalU.uRadius, Math.max(p.radius, 1));
    gl.uniform1f(finalU.uSoftness, p.softness);
    gl.uniform1f(finalU.uColored, p.colored);
    const col = hexToRgb(p.color);
    gl.uniform3f(finalU.uColor, col[0], col[1], col[2]);
    gl.uniform1f(finalU.uBrightness, Math.min(Math.max(p.brightness, 0.2), 3));
    gl.uniform1f(finalU.uLegibility, Math.min(Math.max(p.legibility, 0), 1));
    gl.uniform1f(finalU.uScramble, Math.min(Math.max(p.scramble, 0), 1));
    gl.uniform1f(finalU.uScrambleSpeed, Math.min(Math.max(p.scrambleSpeed, 0), 30));
    gl.uniform1f(finalU.uEdgeWidth, p.edgeWidth);
    gl.uniform1f(finalU.uEdgeFlicker, Math.min(Math.max(p.edgeFlicker, 0), 1));
    gl.uniform1f(finalU.uEdgeGlow, Math.min(Math.max(p.edgeGlow, 0), 3));
    gl.uniform1f(finalU.uEdgeTint, p.edgeTint);
    gl.uniform1f(finalU.uAberration, Math.max(p.aberration, 0));
    gl.uniform1f(finalU.uPassthrough, p.passthrough);
    gl.uniform3f(finalU.uBg, bg[0], bg[1], bg[2]);
    gl.uniform1f(finalU.uTime, this.time);
    gl.uniform1f(finalU.uMaxX, 1);
    gl.uniform1f(finalU.uCrisp, 0);

    gl.viewport(0, 0, layout.w, layout.h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** 释放全部 GPU 资源（可重复调用）。 */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    const gl = this.gl;
    if (gl) {
      const programs = [this.cellProgram, this.finalProgram];
      for (const bundle of programs) {
        if (bundle) {
          gl.deleteShader(bundle.vs);
          gl.deleteShader(bundle.fs);
          gl.deleteProgram(bundle.program);
        }
      }
      if (this.buffer) {
        gl.deleteBuffer(this.buffer);
      }
      for (const texture of [this.contentTexture, this.shapeTexture, this.cellTexture, this.atlasTexture]) {
        if (texture) {
          gl.deleteTexture(texture);
        }
      }
      if (this.fbo) {
        gl.deleteFramebuffer(this.fbo);
      }
    }
    this.gl = null;
    this.cellProgram = null;
    this.finalProgram = null;
    this.buffer = null;
    this.contentTexture = null;
    this.shapeTexture = null;
    this.cellTexture = null;
    this.atlasTexture = null;
    this.fbo = null;
  }

  private createTexture(filter: number): WebGLTexture {
    const gl = this.gl;
    if (!gl) {
      throw new Error('[DecryptReveal] 渲染引擎尚未初始化');
    }
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('[DecryptReveal] 无法创建纹理');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  private compileShader(source: string, type: number): WebGLShader {
    const gl = this.gl;
    if (!gl) {
      throw new Error('[DecryptReveal] 渲染引擎尚未初始化');
    }
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('[DecryptReveal] 无法创建着色器对象');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? '';
      gl.deleteShader(shader);
      throw new Error('[DecryptReveal] 着色器编译失败: ' + log);
    }
    return shader;
  }

  private createProgram(vsSource: string, fsSource: string): ShaderProgramBundle {
    const gl = this.gl;
    if (!gl) {
      throw new Error('[DecryptReveal] 渲染引擎尚未初始化');
    }
    const vs = this.compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = this.compileShader(fsSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) {
      throw new Error('[DecryptReveal] 无法创建着色器程序');
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? '';
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      throw new Error('[DecryptReveal] 着色器程序链接失败: ' + log);
    }
    const uniforms: UniformMap = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) {
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
    }
    return { program, vs, fs, uniforms };
  }
}

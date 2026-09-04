'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { cellShaderSource } from '@/shaders/cell.frag.glsl';
import { finalShaderSource } from '@/shaders/final.frag.glsl';
import { vertexShaderSource } from '@/shaders/vertex.glsl';
import {
  DECRYPT_REVEAL_DEFAULTS,
  type DecryptRevealRuntimeProps,
  type ResolvedDecryptRevealProps,
} from '@/types/decrypt-reveal';
import { hexToRgb } from '@/utils/color';
import { GLYPH_CELL_SIZE, GLYPH_PAD, generateAtlasTexture, generateShapeTexture } from '@/utils/texture-generators';

/**
 * DecryptReveal 加载状态：
 * - idle：尚未开始加载图片；
 * - loading：正在加载/绘制内容图片；
 * - ready：WebGL 资源就绪，渲染循环运行中；
 * - error：图片加载失败、WebGL2 不可用或 R32F 不受支持。
 */
export type DecryptRevealLoadState = 'idle' | 'loading' | 'ready' | 'error';

/** useDecryptReveal 返回值 */
export interface UseDecryptRevealResult {
  /** 外层容器引用（组件挂载到 root div） */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 可见 WebGL canvas 引用 */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 隐藏内容缓存 canvas 引用（图片先绘制到 2D canvas 再上传 GPU） */
  contentCanvasRef: RefObject<HTMLCanvasElement | null>;
  /** 当前加载状态 */
  loadState: DecryptRevealLoadState;
  /** 重新加载当前 image（图片加载失败后调用） */
  reload: () => void;
}

/** 一次着色器程序相关的完整资源包 */
interface ShaderProgramBundle {
  program: WebGLProgram;
  vs: WebGLShader;
  fs: WebGLShader;
  /** 名称 -> uniform 位置（可能为 null，表示编译期被优化掉/未使用） */
  uniforms: Record<string, WebGLUniformLocation | null>;
}

/** 渲染尺寸布局（设备像素） */
interface RenderLayout {
  /** 容器 CSS 宽度 */
  rectWidth: number;
  /** 容器 CSS 高度 */
  rectHeight: number;
  /** 画布设备像素宽度 */
  w: number;
  /** 画布设备像素高度 */
  h: number;
  /** devicePixelRatio（上限 2） */
  dpr: number;
  /** 网格单元高度（设备像素） */
  cellPx: number;
  /** 网格单元宽度（设备像素） */
  cellW: number;
  /** 网格单元高度（与 cellPx 相同，保留字段便于阅读） */
  cellH: number;
  /** 网格列数 */
  gridCols: number;
  /** 网格行数 */
  gridRows: number;
}

/** 指针状态（平滑插值的当前值与目标值） */
interface PointerState {
  x: number;
  y: number;
  active: number;
  targetX: number;
  targetY: number;
  targetActive: number;
}

/** 合并默认值，得到渲染期全量参数 */
function resolveRuntimeProps(props: DecryptRevealRuntimeProps): ResolvedDecryptRevealProps {
  const d = DECRYPT_REVEAL_DEFAULTS;
  return {
    image: props.image,
    radius: props.radius ?? d.radius,
    softness: props.softness ?? d.softness,
    color: props.color ?? d.color,
    background: props.background ?? d.background,
    brightness: props.brightness ?? d.brightness,
    scramble: props.scramble ?? d.scramble,
    scrambleSpeed: props.scrambleSpeed ?? d.scrambleSpeed,
    edgeWidth: props.edgeWidth ?? d.edgeWidth,
    edgeFlicker: props.edgeFlicker ?? d.edgeFlicker,
    edgeGlow: props.edgeGlow ?? d.edgeGlow,
    edgeTint: props.edgeTint ?? d.edgeTint,
    aberration: props.aberration ?? d.aberration,
    passthrough: props.passthrough ?? d.passthrough,
    threshold: props.threshold ?? d.threshold,
    contrast: props.contrast ?? d.contrast,
    exposure: props.exposure ?? d.exposure,
    legibility: props.legibility ?? d.legibility,
    colored: props.colored ?? d.colored,
    cell: props.cell ?? d.cell,
    aspect: props.aspect ?? d.aspect,
    smoothing: props.smoothing ?? d.smoothing,
  };
}

/**
 * DecryptReveal 核心逻辑 Hook。
 *
 * 职责：
 * - 将 image 绘制到隐藏 canvas，内容纹理在初始化时仅上传一次；
 * - 初始化 WebGL2 上下文、着色器、纹理与 FBO；
 * - 启动 requestAnimationFrame 渲染循环（细胞纹理 → 最终合成两趟绘制）；
 * - 监听指针移动 / 窗口尺寸变化；
 * - 卸载时取消动画帧并删除全部 GPU 资源。
 *
 * 性能设计：
 * - 几何相关参数（cell / aspect）变化才重建资源；
 * - 其余视觉参数通过 ref 保存最新值，渲染循环逐帧读取，无需重建上下文；
 * - 内容纹理只在图片加载完成后上传一次，之后仅绑定采样。
 */
export function useDecryptReveal(props: DecryptRevealRuntimeProps): UseDecryptRevealResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contentCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loadState, setLoadState] = useState<DecryptRevealLoadState>('idle');
  // 每次图片成功绘制到内容 canvas 后 +1，驱动 WebGL 重新初始化（内容尺寸变化需要重建网格/FBO）
  const [contentVersion, setContentVersion] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // 渲染期全量参数：最新值存入 ref，动画循环直接读取，避免视觉参数变化触发重建
  const resolved = resolveRuntimeProps(props);
  const resolvedRef = useRef(resolved);

  // ref 属于副作用通道，需在渲染提交后再同步（React 19 hooks 规范）
  useEffect(() => {
    resolvedRef.current = resolved;
  });

  const { image, cell, aspect } = resolved;

  // 图片加载：绘制到隐藏 canvas（跨域图片需服务器返回 CORS 头）
  useEffect(() => {
    if (!image) {
      console.error('[DecryptReveal] image 参数为空，无法加载内容');
      return undefined;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // loadstart 为异步事件，在回调中更新状态（不违反 set-state-in-effect 规则）
    img.onloadstart = () => {
      setLoadState('loading');
    };
    img.onload = () => {
      const canvas = contentCanvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[DecryptReveal] 无法获取隐藏内容 canvas 的 2D 上下文');
        setLoadState('error');
        return;
      }
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
      setContentVersion((version) => version + 1);
      setLoadState('ready');
    };
    img.onerror = () => {
      console.error('[DecryptReveal] 图片加载失败:', image);
      setLoadState('error');
    };
    img.src = image;
    return () => {
      // 图片加载中卸载/换图时取消回调，避免旧图覆盖新图
      img.onload = null;
      img.onerror = null;
    };
  }, [image, reloadKey]);

  // WebGL 初始化与渲染循环：仅在内容就绪 / cell / aspect / image 变化时重建
  useEffect(() => {
    if (contentVersion < 1) {
      return undefined;
    }
    const canvas = canvasRef.current;
    const contentCanvas = contentCanvasRef.current;
    if (!canvas || !contentCanvas || contentCanvas.width < 1 || contentCanvas.height < 1) {
      return undefined;
    }

    // ---- 资源创建与错误处理 ----
    let glContext: WebGL2RenderingContext | null = null;
    let cellProgram: ShaderProgramBundle | null = null;
    let finalProgram: ShaderProgramBundle | null = null;
    let buffer: WebGLBuffer | null = null;
    let contentTexture: WebGLTexture | null = null;
    let shapeTexture: WebGLTexture | null = null;
    let cellTexture: WebGLTexture | null = null;
    let atlasTexture: WebGLTexture | null = null;
    let fbo: WebGLFramebuffer | null = null;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;

    // 画布 CSS 尺寸（rect）→ 设备像素布局
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const computeLayout = (): RenderLayout => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      const cellPx = Math.max(4, Math.min(40, cell)) * dpr;
      const cellW = cellPx * aspect;
      const cellH = cellPx;
      const gridCols = Math.max(1, Math.ceil(w / cellW));
      const gridRows = Math.max(1, Math.ceil(h / cellH));
      return { rectWidth: rect.width, rectHeight: rect.height, w, h, dpr, cellPx, cellW, cellH, gridCols, gridRows };
    };

    const dispose = (): void => {
      const gl = glContext;
      if (rafId > 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (gl) {
        if (cellProgram) {
          gl.deleteShader(cellProgram.vs);
          gl.deleteShader(cellProgram.fs);
          gl.deleteProgram(cellProgram.program);
        }
        if (finalProgram) {
          gl.deleteShader(finalProgram.vs);
          gl.deleteShader(finalProgram.fs);
          gl.deleteProgram(finalProgram.program);
        }
        if (buffer) {
          gl.deleteBuffer(buffer);
        }
        if (contentTexture) {
          gl.deleteTexture(contentTexture);
        }
        if (shapeTexture) {
          gl.deleteTexture(shapeTexture);
        }
        if (cellTexture) {
          gl.deleteTexture(cellTexture);
        }
        if (atlasTexture) {
          gl.deleteTexture(atlasTexture);
        }
        if (fbo) {
          gl.deleteFramebuffer(fbo);
        }
      }
      cellProgram = null;
      finalProgram = null;
      buffer = null;
      contentTexture = null;
      shapeTexture = null;
      cellTexture = null;
      atlasTexture = null;
      fbo = null;
      glContext = null;
    };

    try {
      const gl = canvas.getContext('webgl2', {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: false,
      });
      if (!gl) {
        throw new Error('[DecryptReveal] 当前浏览器不支持 WebGL2');
      }
      glContext = gl;

      const compileShader = (source: string, type: number): WebGLShader => {
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
      };

      const createProgram = (vsSource: string, fsSource: string): ShaderProgramBundle => {
        const vs = compileShader(vsSource, gl.VERTEX_SHADER);
        const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
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
        const uniforms: Record<string, WebGLUniformLocation | null> = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
          const info = gl.getActiveUniform(program, i);
          if (info) {
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
          }
        }
        return { program, vs, fs, uniforms };
      };

      cellProgram = createProgram(vertexShaderSource, cellShaderSource);
      finalProgram = createProgram(vertexShaderSource, finalShaderSource);

      // 全屏三角形带顶点缓冲
      buffer = gl.createBuffer();
      if (!buffer) {
        throw new Error('[DecryptReveal] 无法创建顶点缓冲');
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      const createTexture = (filter: number): WebGLTexture => {
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
      };

      // ---- 内容纹理：仅在此处上传一次，渲染循环只绑定采样 ----
      contentTexture = createTexture(gl.LINEAR);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, contentTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, contentCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);

      // ---- 字形特征纹理（R32F）+ 字符图集（RGBA），共享字符集与版式 ----
      const shapeResult = generateShapeTexture(gl);
      shapeTexture = shapeResult.texture;
      const glyphCount = shapeResult.count;
      const atlasLayout = {
        count: shapeResult.count,
        cols: shapeResult.cols,
        rows: shapeResult.rows,
        pad: shapeResult.pad,
        cellSize: shapeResult.cellSize,
      };
      atlasTexture = generateAtlasTexture(
        gl,
        atlasLayout.count,
        atlasLayout.cols,
        atlasLayout.rows,
        atlasLayout.pad,
        atlasLayout.cellSize,
      );
      // 图集 UV 换算常量（pad 比例 / 字形内容比例）
      const atlasUnit = GLYPH_CELL_SIZE + GLYPH_PAD * 2;
      const atlasPadFrac = GLYPH_PAD / atlasUnit;
      const atlasInnerFrac = GLYPH_CELL_SIZE / atlasUnit;

      // ---- 细胞纹理 + FBO（RGBA8，随布局尺寸分配存储，修复原实现缺 texImage2D 的问题）----
      cellTexture = createTexture(gl.NEAREST);
      fbo = gl.createFramebuffer();
      if (!fbo) {
        throw new Error('[DecryptReveal] 无法创建帧缓冲');
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cellTexture, 0);

      let layout = computeLayout();
      canvas.width = layout.w;
      canvas.height = layout.h;

      const allocateCellTexture = (): void => {
        if (!cellTexture) {
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, cellTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, layout.gridCols, layout.gridRows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      };
      allocateCellTexture();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);

      // 指针状态
      const pointer: PointerState = {
        x: -100000,
        y: -100000,
        active: 0,
        targetX: -100000,
        targetY: -100000,
        targetActive: 0,
      };
      let time = 0;
      let prevTime = performance.now();

      const onPointerMove = (event: PointerEvent): void => {
        const rect = canvas.getBoundingClientRect();
        pointer.targetX = event.clientX - rect.left;
        pointer.targetY = event.clientY - rect.top;
        pointer.targetActive = 1;
      };
      const onPointerLeave = (): void => {
        pointer.targetActive = 0;
      };
      const applySize = (): void => {
        const next = computeLayout();
        if (
          next.w === layout.w &&
          next.h === layout.h &&
          next.gridCols === layout.gridCols &&
          next.gridRows === layout.gridRows
        ) {
          return;
        }
        layout = next;
        canvas.width = layout.w;
        canvas.height = layout.h;
        allocateCellTexture();
      };
      const onWindowResize = (): void => {
        applySize();
      };

      let readyNotified = false;
      const frame = (now: number): void => {
        rafId = requestAnimationFrame(frame);
        if (!readyNotified) {
          readyNotified = true;
          // 首帧回调属异步执行：在此通知 ready（避免 effect 体内同步 setState）
          setLoadState('ready');
        }
        const dt = Math.min((now - prevTime) / 1000, 1 / 30);
        prevTime = now;
        time += dt;

        // 平滑跟随指针（smoothing 仅影响速率，逐帧读取最新值即可）
        const p = resolvedRef.current;
        const smooth = Math.max(p.smoothing, 0.0001);
        const alpha = 1 - Math.exp(-dt / smooth);
        pointer.x += (pointer.targetX - pointer.x) * alpha;
        pointer.y += (pointer.targetY - pointer.y) * alpha;
        pointer.active += (pointer.targetActive - pointer.active) * alpha;

        const cellU = cellProgram?.uniforms ?? {};
        const finalU = finalProgram?.uniforms ?? {};
        if (!cellProgram || !finalProgram || !cellTexture || !fbo) {
          return;
        }

        // ---- 第一趟：细胞纹理（内容 → 字形索引）----
        gl.useProgram(cellProgram.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, contentTexture);
        gl.uniform1i(cellU.uContent, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, shapeTexture);
        gl.uniform1i(cellU.uShapes, 1);
        gl.uniform2f(cellU.uContentRes, contentCanvas.width, contentCanvas.height);
        gl.uniform2f(cellU.uCellPx, layout.cellW, layout.cellH);
        gl.uniform1i(cellU.uGlyphCount, glyphCount);
        gl.uniform1f(cellU.uContrast, Math.min(Math.max(p.contrast, 0.3), 3));
        gl.uniform1f(cellU.uExposure, Math.min(Math.max(p.exposure, 0.2), 3));
        gl.uniform1f(cellU.uThreshold, Math.max(p.threshold, 0.005));
        const bg = hexToRgb(p.background);
        gl.uniform3f(cellU.uBg, bg[0], bg[1], bg[2]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, layout.gridCols, layout.gridRows);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // ---- 第二趟：最终合成 ----
        gl.useProgram(finalProgram.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, contentTexture);
        gl.uniform1i(finalU.uContent, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, cellTexture);
        gl.uniform1i(finalU.uCells, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
        gl.uniform1i(finalU.uAtlas, 2);

        gl.uniform2f(finalU.uRes, layout.rectWidth, layout.rectHeight);
        gl.uniform1f(finalU.uDpr, layout.dpr);
        gl.uniform2f(finalU.uCellPx, layout.cellW, layout.cellH);
        gl.uniform2f(finalU.uGrid, layout.gridCols, layout.gridRows);
        gl.uniform2f(finalU.uAtlasGrid, atlasLayout.cols, atlasLayout.rows);
        gl.uniform2f(finalU.uAtlasPad, atlasPadFrac, atlasPadFrac);
        gl.uniform2f(finalU.uAtlasInner, atlasInnerFrac, atlasInnerFrac);
        gl.uniform1i(finalU.uGlyphCount, glyphCount);
        gl.uniform2f(finalU.uPointer, pointer.x, pointer.y);
        gl.uniform1f(finalU.uActive, pointer.active);
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
        gl.uniform1f(finalU.uTime, time);
        gl.uniform1f(finalU.uMaxX, 1.0);
        gl.uniform1f(finalU.uCrisp, 0);

        gl.viewport(0, 0, layout.w, layout.h);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };

      // 事件监听
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
      window.addEventListener('resize', onWindowResize);
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          applySize();
        });
        resizeObserver.observe(canvas);
      }

      rafId = requestAnimationFrame(frame);

      return () => {
        if (rafId > 0) {
          cancelAnimationFrame(rafId);
        }
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('resize', onWindowResize);
        resizeObserver?.disconnect();
        dispose();
      };
    } catch (error) {
      console.error('[DecryptReveal] WebGL 初始化失败:', error);
      setLoadState('error');
      dispose();
      return undefined;
    }
  }, [image, cell, aspect, contentVersion, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return { containerRef, canvasRef, contentCanvasRef, loadState, reload };
}

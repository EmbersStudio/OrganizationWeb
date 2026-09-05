'use client';

import {useCallback, useEffect, useRef, useState, type RefObject} from 'react';

import type {DecryptRevealRuntimeProps, ResolvedDecryptRevealProps} from '@/types/decrypt-reveal';
import {resolveDecryptRevealProps} from '@/utils/decrypt-reveal-props';
import {DecryptRevealRenderer} from '@/utils/decrypt-reveal-renderer';

/**
 * DecryptReveal 加载状态：
 * - idle：尚未开始加载图片；
 * - loading：正在加载/绘制内容图片；
 * - ready：WebGL 资源就绪，渲染循环运行中；
 * - error：图片加载失败、WebGL2 不可用或 R32F 不受支持。
 */
export type DecryptRevealLoadState = 'idle'|'loading'|'ready'|'error';

/** useDecryptReveal 返回值 */
export interface UseDecryptRevealResult {
  /** 外层容器引用（组件挂载到 root div） */
  containerRef: RefObject<HTMLDivElement|null>;
  /** 可见 WebGL canvas 引用 */
  canvasRef: RefObject<HTMLCanvasElement|null>;
  /** 隐藏内容缓存 canvas 引用（图片先绘制到 2D canvas 再上传 GPU） */
  contentCanvasRef: RefObject<HTMLCanvasElement|null>;
  /** 当前加载状态 */
  loadState: DecryptRevealLoadState;
  /** 重新加载当前 image（图片加载失败后调用） */
  reload: () => void;
}

/**
 * DecryptReveal 单图模式核心逻辑 Hook。
 *
 * 职责：
 * - 将 image 绘制到隐藏 canvas（原始尺寸），内容纹理在初始化时仅上传一次；
 * - 基于 DecryptRevealRenderer 初始化 WebGL 资源并驱动渲染循环；
 * - 监听指针移动 / 容器尺寸变化；
 * - 卸载时取消动画帧、删除全部 GPU 资源。
 *
 * 性能设计：
 * - 几何相关参数（cell / aspect / image）变化才重建引擎；
 * - 其余视觉参数经 ref 保存最新值，渲染循环逐帧读取；
 * - 内容纹理只在图片加载完成后上传一次。
 */
export function useDecryptReveal(props: DecryptRevealRuntimeProps):
    UseDecryptRevealResult {
  const containerRef = useRef<HTMLDivElement|null>(null);
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const contentCanvasRef = useRef<HTMLCanvasElement|null>(null);

  const [loadState, setLoadState] = useState<DecryptRevealLoadState>('idle');
  // 每次图片成功绘制到内容 canvas 后 +1，驱动 WebGL 重新初始化
  const [contentVersion, setContentVersion] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // 渲染期全量参数：最新值存入 ref，动画循环直接读取，避免视觉参数变化触发重建
  const resolved = resolveDecryptRevealProps(props);
  const resolvedRef = useRef<ResolvedDecryptRevealProps>(resolved);
  // ref 属于副作用通道，需在渲染提交后再同步（React 19 hooks 规范）
  useEffect(() => {
    resolvedRef.current = resolved;
  });

  const {image, cell, aspect} = resolved;

  // 图片加载：绘制到隐藏 canvas（原始尺寸，跨域图片需服务器返回 CORS 头）
  useEffect(() => {
    if (!image) {
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
      img.onload = null;
      img.onerror = null;
    };
  }, [image, reloadKey]);

  // WebGL 初始化与渲染循环：内容就绪 / image / cell / aspect 变化时重建
  useEffect(() => {
    if (contentVersion < 1) {
      return undefined;
    }
    const canvas = canvasRef.current;
    const contentCanvas = contentCanvasRef.current;
    if (!canvas || !contentCanvas || contentCanvas.width < 1 ||
        contentCanvas.height < 1) {
      return undefined;
    }

    let renderer: DecryptRevealRenderer|null = null;
    let rafId = 0;
    let readyNotified = false;
    let resizeObserver: ResizeObserver|null = null;

    const readSize = (): {cssWidth: number; cssHeight: number; dpr: number} => {
      const rect = canvas.getBoundingClientRect();
      return {
        cssWidth: Math.max(1, rect.width),
        cssHeight: Math.max(1, rect.height),
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      };
    };

    try {
      const {cssWidth, cssHeight, dpr} = readSize();
      renderer = new DecryptRevealRenderer({
        canvas,
        getProps: () => resolvedRef.current,
        getContentCanvas: () => contentCanvasRef.current,
      });
      renderer.init(cssWidth, cssHeight, dpr);

      // 指针事件（坐标为 canvas CSS 逻辑像素）
      const onPointerMove = (event: PointerEvent): void => {
        const rect = canvas.getBoundingClientRect();
        renderer?.setPointerTarget(
            event.clientX - rect.left, event.clientY - rect.top, 1);
      };
      const onPointerLeave = (): void => {
        renderer?.clearPointer();
      };
      const applySize = (): void => {
        const size = readSize();
        renderer?.setViewport(size.cssWidth, size.cssHeight, size.dpr);
      };
      const onWindowResize = (): void => {
        applySize();
      };

      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
      window.addEventListener('resize', onWindowResize);
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          applySize();
        });
        resizeObserver.observe(canvas);
      }

      const loop = (now: number): void => {
        rafId = requestAnimationFrame(loop);
        if (!readyNotified) {
          readyNotified = true;
          // 首帧回调属异步执行：在此通知 ready（避免 effect 体内同步 setState）
          setLoadState('ready');
        }
        renderer?.frame(now);
      };
      rafId = requestAnimationFrame(loop);

      return () => {
        if (rafId > 0) {
          cancelAnimationFrame(rafId);
        }
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('resize', onWindowResize);
        resizeObserver?.disconnect();
        renderer?.dispose();
        renderer = null;
      };
    } catch (error) {
      console.error('[DecryptReveal] WebGL 初始化失败:', error);
      // 失败状态在异步微任务中更新，避免 effect 体内同步 setState
      queueMicrotask(() => {
        setLoadState('error');
      });
      renderer?.dispose();
      renderer = null;
      return undefined;
    }
  }, [image, cell, aspect, contentVersion, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return {containerRef, canvasRef, contentCanvasRef, loadState, reload};
}

'use client';

import {useEffect, useRef, type RefObject} from 'react';

import type {DecryptRevealRuntimeProps, ResolvedDecryptRevealProps} from '@/types/decrypt-reveal';
import {resolveDecryptRevealProps} from '@/utils/decrypt-reveal-props';
import {DecryptRevealRenderer} from '@/utils/decrypt-reveal-renderer';
import {drawImageWithObjectFit, type CssObjectFit} from '@/utils/image-fit';

/** useDecryptRevealContent 返回值 */
export interface UseDecryptRevealContentResult {
  /** 内容容器引用（组件把 children 挂载其中） */
  wrapperRef: RefObject<HTMLDivElement|null>;
}

/** 图片矩形四周的 border 宽度（px） */
interface BoxBorders {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** 图片渲染入口对象（每个 <img> 一个） */
interface ImgEntry {
  img: HTMLImageElement;
  /** 视口坐标系里的效果画布（挂载在 document.body，pointer-events: none） */
  canvas: HTMLCanvasElement|null;
  renderer: DecryptRevealRenderer|null;
  /** 内容栅格画布（按 object-fit 复刻浏览器渲染，device 像素） */
  raster: HTMLCanvasElement|null;
  /** 几何/样式缓存，避免每帧重复 getComputedStyle */
  borders: BoxBorders;
  objectFit: CssObjectFit;
  objectPosition: string;
  /** 内圆角（px，已扣除 border） */
  innerRadius: number;
  /** 缓存的 border-radius（样式脏时刷新） */
  borderRadiusRaw: string;
  styleDirty: boolean;
  rasterDirty: boolean;
  lastCssW: number;
  lastCssH: number;
  lastDpr: number;
  /** 最近一次指针（画布尚未就绪时暂存，就绪后补投递） */
  lastPointer: {x: number; y: number; active: 0 | 1}|null;
}

const DEFAULT_BORDERS: BoxBorders = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0
};

/** 解析单个长度：px 数字或百分比（相对 outer 尺寸） */
function resolveLength(token: string, outer: number): number {
  const raw = token.trim();
  if (raw.endsWith('%')) {
    const percent = Number.parseFloat(raw);
    return Number.isFinite(percent) ? (percent / 100) * outer : 0;
  }
  const px = Number.parseFloat(raw);
  return Number.isFinite(px) ? px : 0;
}

/**
 * 解析 CSS border-radius 为“内容区内圆角”（px，扣掉边框）。
 * 取水平方向第一个值近似（成员头像等圆形/小圆角场景已足够）。
 */
function resolveInnerRadius(
    borderRadius: string, outerWidth: number, outerHeight: number,
    border: BoxBorders): number {
  const horizontalPart = borderRadius.split('/')[0] ?? '0px';
  const first = horizontalPart.trim().split(/\s+/)[0] ?? '0px';
  const outerRx = resolveLength(first, outerWidth);
  const outerRy = resolveLength(first, outerHeight);
  const maxBorder =
      Math.max(border.left, border.top, border.right, border.bottom);
  return Math.max(0, Math.min(outerRx, outerRy) - maxBorder);
}

/** 读取 border 宽度（getComputedStyle 返回带单位字符串） */
function readBorders(style: CSSStyleDeclaration): BoxBorders {
  const parse = (value: string): number => Number.parseFloat(value) || 0;
  return {
    left: parse(style.borderLeftWidth),
    top: parse(style.borderTopWidth),
    right: parse(style.borderRightWidth),
    bottom: parse(style.borderBottomWidth),
  };
}

/**
 * DecryptReveal 容器模式 Hook。
 *
 * 职责：
 * - 渲染 children 原样不动（文本、按钮、布局等全部保留）；
 * - 找出容器内所有 <img>（跳过嵌套 DecryptReveal 根内的图片），
 *   为每张图片创建视口坐标系的 WebGL 效果层；
 * - 复刻图片自身的 object-fit / object-position / 圆角 / 边框语义，
 *   使叠加层与真实 <img> 像素级对齐（图片本身的 className/style 完全生效）；
 * - 指针事件挂在真实 <img> 上（效果层 pointer-events:
 * none，点击/交互不受影响）；
 * - 每帧跟随图片几何位置（滚动、响应式尺寸变化、transform 均自适应）。
 */
export function useDecryptRevealContent(props: DecryptRevealRuntimeProps):
    UseDecryptRevealContentResult {
  const wrapperRef = useRef<HTMLDivElement|null>(null);

  const resolved = resolveDecryptRevealProps(props);
  const resolvedRef = useRef<ResolvedDecryptRevealProps>(resolved);
  useEffect(() => {
    resolvedRef.current = resolved;
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return undefined;
    }

    const entries = new Map<HTMLImageElement, ImgEntry>();
    let rafId = 0;

    /** 解析效果层圆角并应用到画布（内容区尺寸由几何同步时更新） */
    const applyCanvasGeometry = (entry: ImgEntry, rect: DOMRect): boolean => {
      const cssW =
          Math.max(0, rect.width - entry.borders.left - entry.borders.right);
      const cssH =
          Math.max(0, rect.height - entry.borders.top - entry.borders.bottom);
      if (cssW < 1 || cssH < 1) {
        if (entry.canvas) {
          entry.canvas.style.display = 'none';
        }
        return false;
      }
      if (!entry.canvas) {
        entry.canvas = document.createElement('canvas');
        entry.canvas.setAttribute('aria-hidden', 'true');
        entry.canvas.style.cssText =
            'position:fixed;pointer-events:none;z-index:9999;display:block;left:0;top:0;width:0;height:0;';
        document.body.appendChild(entry.canvas);
      }
      const canvas = entry.canvas;
      canvas.style.display = 'block';
      canvas.style.left = `${rect.left + entry.borders.left}px`;
      canvas.style.top = `${rect.top + entry.borders.top}px`;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const radius = resolveInnerRadius(
          entry.borderRadiusRaw, rect.width, rect.height, entry.borders);
      canvas.style.borderRadius = `${radius}px`;
      canvas.style.clipPath = `inset(0 round ${radius}px)`;
      entry.innerRadius = radius;
      return true;
    };

    /** 同步某张图片：几何 → 栅格内容 → WebGL 引擎 */
    const syncEntry = (entry: ImgEntry): void => {
      const {img} = entry;
      if (!img.isConnected) {
        return;
      }
      if (entry.styleDirty) {
        const style = getComputedStyle(img);
        entry.borders = readBorders(style);
        entry.objectFit = (style.objectFit as CssObjectFit) || 'fill';
        entry.objectPosition = style.objectPosition || '50% 50%';
        entry.borderRadiusRaw = style.borderRadius || '0px';
        entry.styleDirty = false;
        entry.rasterDirty = true;
      }
      const rect = img.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW =
          Math.max(0, rect.width - entry.borders.left - entry.borders.right);
      const cssH =
          Math.max(0, rect.height - entry.borders.top - entry.borders.bottom);
      const loaded = img.complete && img.naturalWidth > 0;
      const sizeChanged = Math.abs(cssW - entry.lastCssW) > 0.5 ||
          Math.abs(cssH - entry.lastCssH) > 0.5 || dpr !== entry.lastDpr;

      if (!applyCanvasGeometry(entry, rect) || !loaded) {
        if (entry.canvas) {
          entry.canvas.style.display = 'none';
        }
        return;
      }

      // 内容栅格：仅在尺寸 / 样式 / 图片变化时重绘（复刻浏览器 object-fit
      // 渲染）
      const needRaster = entry.rasterDirty || sizeChanged || !entry.raster;
      if (needRaster) {
        const w = Math.max(1, Math.round(cssW * dpr));
        const h = Math.max(1, Math.round(cssH * dpr));
        if (!entry.raster) {
          entry.raster = document.createElement('canvas');
        }
        if (entry.raster.width !== w || entry.raster.height !== h) {
          entry.raster.width = w;
          entry.raster.height = h;
        }
        const ctx = entry.raster.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, entry.raster.width, entry.raster.height);
          try {
            drawImageWithObjectFit(
                ctx,
                img,
                entry.raster.width,
                entry.raster.height,
                entry.objectFit,
                entry.objectPosition,
            );
            entry.rasterDirty = false;
          } catch (error) {
            // 跨域图片未授权时会在此抛 SecurityError：回退为普通 <img> 展示
            console.error(
                '[DecryptReveal] 无法读取图片像素（CORS 限制？）:', img.src,
                error);
            entry.rasterDirty = false;
            if (entry.canvas) {
              entry.canvas.style.display = 'none';
            }
            return;
          }
        }
      }

      if (!entry.canvas) {
        return;
      }
      if (!entry.renderer) {
        try {
          const renderer = new DecryptRevealRenderer({
            canvas: entry.canvas,
            getProps: () => resolvedRef.current,
            getContentCanvas: () => entry.raster,
          });
          renderer.init(cssW, cssH, dpr);
          entry.renderer = renderer;
          if (entry.lastPointer?.active === 1) {
            renderer.setPointerTarget(
                entry.lastPointer.x, entry.lastPointer.y, 1);
          }
        } catch (error) {
          console.error(
              '[DecryptReveal] 图片效果初始化失败（已回退为普通图片）:',
              img.src, error);
          if (entry.canvas) {
            entry.canvas.remove();
            entry.canvas = null;
          }
          return;
        }
      } else {
        // 尺寸变化：重建网格/FBO 布局；内容重绘：重新上传纹理
        if (sizeChanged) {
          entry.renderer.setViewport(cssW, cssH, dpr);
        }
        if (needRaster && entry.renderer.ready) {
          entry.renderer.uploadContent();
        }
      }

      entry.lastCssW = cssW;
      entry.lastCssH = cssH;
      entry.lastDpr = dpr;
    };

    /** 销毁一张图片的效果层 */
    const destroyEntry = (entry: ImgEntry): void => {
      entry.renderer?.dispose();
      entry.renderer = null;
      entry.canvas?.remove();
      entry.canvas = null;
      entry.raster = null;
      entry.img.removeEventListener('pointermove', onImgPointerMove);
      entry.img.removeEventListener('pointerleave', onImgPointerLeave);
      entry.img.removeEventListener('load', onImgLoad);
    };

    /** 指针事件处理（挂在真实 img 上，坐标相对图片内容区） */
    const onImgPointerMove = (event: PointerEvent): void => {
      const img = event.currentTarget as HTMLImageElement;
      const entry = entries.get(img);
      if (!entry || !img.isConnected) {
        return;
      }
      const rect = img.getBoundingClientRect();
      const x = event.clientX - (rect.left + entry.borders.left);
      const y = event.clientY - (rect.top + entry.borders.top);
      entry.lastPointer = {x, y, active: 1};
      entry.renderer?.setPointerTarget(x, y, 1);
    };
    const onImgPointerLeave = (event: PointerEvent): void => {
      const img = event.currentTarget as HTMLImageElement;
      const entry = entries.get(img);
      if (!entry) {
        return;
      }
      entry.lastPointer = {
        ...(entry.lastPointer ?? {x: -100000, y: -100000}),
        active: 0
      };
      entry.renderer?.clearPointer();
    };
    const onImgLoad = (event: Event): void => {
      const img = event.currentTarget as HTMLImageElement;
      const entry = entries.get(img);
      if (entry) {
        entry.rasterDirty = true;
      }
    };

    /** 全量扫描：新增/移除容器内 img */
    const ensureEntries = (): void => {
      const imgs = Array.from(wrapper.querySelectorAll('img'));
      const seen = new Set<HTMLImageElement>();
      for (const img of imgs) {
        const root = img.closest('[data-decrypt-reveal-root]');
        // 跳过嵌套在其它 DecryptReveal 容器里的图片
        if (root !== wrapper) {
          continue;
        }
        seen.add(img);
        let entry = entries.get(img);
        if (!entry) {
          entry = {
            img,
            canvas: null,
            renderer: null,
            raster: null,
            borders: DEFAULT_BORDERS,
            objectFit: 'fill',
            objectPosition: '50% 50%',
            innerRadius: 0,
            borderRadiusRaw: '0px',
            styleDirty: true,
            rasterDirty: true,
            lastCssW: 0,
            lastCssH: 0,
            lastDpr: 0,
            lastPointer: null,
          };
          entries.set(img, entry);
          img.addEventListener('pointermove', onImgPointerMove);
          img.addEventListener('pointerleave', onImgPointerLeave);
          img.addEventListener('load', onImgLoad);
        }
        syncEntry(entry);
      }
      for (const [img, entry] of Array.from(entries)) {
        if (!seen.has(img)) {
          destroyEntry(entry);
          entries.delete(img);
        }
      }
    };

    /** 渲染循环：每帧同步几何并驱动所有图片引擎 */
    const loop = (now: number): void => {
      rafId = requestAnimationFrame(loop);
      for (const entry of entries.values()) {
        syncEntry(entry);
        entry.renderer?.frame(now);
      }
    };

    // 首次扫描并启动循环
    ensureEntries();
    if (entries.size > 0) {
      rafId = requestAnimationFrame(loop);
    }

    // 响应 children / img 属性变化（新增图片、src/style/class 变化）
    const observer = new MutationObserver(() => {
      ensureEntries();
      if (entries.size > 0 && rafId === 0) {
        rafId = requestAnimationFrame(loop);
      }
    });
    observer.observe(wrapper, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'src', 'srcset', 'class', 'style', 'crossorigin', 'alt', 'width',
        'height'
      ],
    });

    return () => {
      if (rafId > 0) {
        cancelAnimationFrame(rafId);
      }
      observer.disconnect();
      for (const entry of entries.values()) {
        destroyEntry(entry);
      }
      entries.clear();
    };
  }, []);

  return {wrapperRef};
}

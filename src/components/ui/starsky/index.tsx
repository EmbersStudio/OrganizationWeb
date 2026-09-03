'use client';

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import { Card, type CardProps } from '@/components/ui/card';
import styles from './StarSky.module.css';

/** 星星运动模式：从中心扩散 / 向中心收缩 / 绕中心旋转（顺、逆时针） */
export type StarSkyMode = 'expand' | 'shrink' | 'rotate-cw' | 'rotate-ccw';

/**
 * 中心点横坐标：支持语义关键字（left=0 / mid、center=50% / right=100%）
 * 或具体位置（px / % / number 视为 px）。
 */
export type StarSkyCenterX = 'left' | 'mid' | 'center' | 'right' | `${number}px` | `${number}%` | number;

/** 中心点纵坐标：支持语义关键字（up=0 / mid、center=50% / bottom=100%）或具体位置 */
export type StarSkyCenterY = 'up' | 'mid' | 'center' | 'bottom' | `${number}px` | `${number}%` | number;

/** 中心点位置：x、y 分别对应水平与垂直方向 */
export interface StarSkyCenter {
  readonly x: StarSkyCenterX;
  readonly y: StarSkyCenterY;
}

/**
 * 星空相关配置项。
 * 颜色、数量、尺寸、中心点、运动模式等默认值集中在 DEFAULT_STAR_SKY_CONFIG，
 * 使用时传入对应字段即可覆盖，不传则采用默认配置。
 */
export interface StarSkyConfig {
  /** 星星（拖尾）颜色，默认 rgba(255, 255, 255, 0.5) */
  starColor?: string;
  /** 星星数量；不传时按 (容器宽 + 容器高) / 8 自动计算（与参考示例一致） */
  starCount?: number;
  /** 星星基础尺寸（线宽），默认 3 */
  starSize?: number;
  /** 星星最小缩放比例（z 轴纵深的下限），默认 0.2 */
  starMinScale?: number;
  /** 星星移出容器多少像素后回收重放，默认 50 */
  overflowThreshold?: number;
  /** 运动速度缩放系数，默认 1；扩散/收缩基准 0.0009、旋转基准 0.00009，实际值 = 基准 × speed */
  speed?: number;
  /** 星星整体运动模式，默认 expand（从中心点向外扩散） */
  mode?: StarSkyMode;
  /** 运动中心点位置，默认 { x: 'mid', y: 'mid' }（容器正中） */
  center?: StarSkyCenter;
  /** 是否响应鼠标/触摸产生视差漂移，默认 true */
  interactive?: boolean;
  /** 是否让星星逐帧随机闪烁透明度，默认 true */
  twinkle?: boolean;
  /** 背景三段渐变颜色，默认与 HTMLTest/index.html 相同 */
  backgroundColors?: readonly [string, string, string];
  /** 自定义完整 CSS background（优先级高于 backgroundColors） */
  background?: string;
}

/** 默认星空配置（与 HTMLTest/index.html 中的常量保持一致） */
export const DEFAULT_STAR_SKY_CONFIG = {
  starColor: 'rgba(255, 255, 255, 0.5)',
  starSize: 3,
  starMinScale: 0.2,
  overflowThreshold: 50,
  speed: 1,
  mode: 'expand',
  center: { x: 'mid', y: 'mid' },
  interactive: true,
  twinkle: true,
  backgroundColors: ['#0a1432', 'rgba(40, 10, 60, 0.9)', '#05050f'] as const,
} as const;

/**
 * 基础运动速度（speed 参数为缩放系数，实际速度 = 基准 × speed）：
 * - 扩散/收缩：z 轴纵深速度 0.0009/帧；
 * - 旋转：角速度 0.00009/帧（再按 star.z 缩放，近处星星转得更快以体现纵深）。
 */
const BASE_DEPTH_SPEED = 0.0009;
const BASE_ROTATE_SPEED = 0.00009;

/** 背景渐变注入到 CSS Modules 的自定义属性名 */
type StarSkyStyleVars = CSSProperties & {
  '--starsky-bg-0'?: string;
  '--starsky-bg-1'?: string;
  '--starsky-bg-2'?: string;
};

/** StarSky（星空容器）完整 props */
export interface StarSkyProps extends HTMLAttributes<HTMLDivElement>, StarSkyConfig {
  /** 叠加在星空上的内容（任意组件，可复用 Card/Button 等元件） */
  children?: ReactNode;
  /** 固定铺满整个视口（纯背景模式），默认 false */
  fullScreen?: boolean;
  /** 内容层自定义类名（覆盖默认 flex 居中等样式） */
  contentClassName?: string;
}

/** StarSkyCard props：在 StarSky 基础上追加传入 Card 的容器参数 */
export interface StarSkyCardProps extends StarSkyProps {
  /** 传给内部 Card 的参数（variant/radius/padding/shadow 等），默认全缺省 */
  cardProps?: CardProps;
}

/** 拼接类名（过滤空值） */
function joinClass(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/**
 * 解析中心点锚点：关键字按 CSS 语义映射到 0 / 50% / 100%；
 * 其余按 px / % / number（px）解析为具体坐标。
 */
function resolveAnchor(value: StarSkyCenterX | StarSkyCenterY, size: number): number {
  if (typeof value === 'number') {
    return value;
  }
  switch (value) {
    case 'left':
    case 'up':
      return 0;
    case 'mid':
    case 'center':
      return size / 2;
    case 'right':
    case 'bottom':
      return size;
    default:
      break;
  }
  if (value.endsWith('%')) {
    return (Number.parseFloat(value) / 100) * size;
  }
  // px 或直接数值字符串（模板字面量类型已保证 px 前为数字）
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 计算根节点 style：注入背景渐变 CSS 变量，并保留外部 style */
function buildRootStyle(
  background: string | undefined,
  backgroundColors: readonly [string, string, string] | undefined,
  style: CSSProperties | undefined,
): CSSProperties {
  const [from, mid, to] = backgroundColors ?? DEFAULT_STAR_SKY_CONFIG.backgroundColors;
  const vars: StarSkyStyleVars = {
    '--starsky-bg-0': from,
    '--starsky-bg-1': mid,
    '--starsky-bg-2': to,
  };
  // background 优先级最高：覆盖整段渐变背景
  if (background) {
    vars.background = background;
  }
  return { ...vars, ...style };
}

/** 星星对象：x/y 为坐标（CSS 像素），z 为纵深缩放因子 */
interface Star {
  x: number;
  y: number;
  z: number;
}

/**
 * StarSky 星空背景容器。
 *
 * - 无 children：仅渲染星空（纯背景），配合 className/style 控制尺寸，
 *   或使用 fullScreen 固定铺满视口；
 * - 有 children：内容默认居中叠加在星空之上（可放 Card 等任意组件）；
 * - center 控制星星运动中心（默认正中），mode 控制整体运动模式：
 *   expand 自中心扩散、shrink 向中心收缩、rotate-cw/rotate-ccw 绕中心旋转；
 * - 动画逻辑仿照 HTMLTest/index.html：星星带拖尾、鼠标/触摸产生视差漂移、
 *   星星数量默认按容器面积自动计算。
 */
export function StarSky({
  children,
  className,
  style,
  contentClassName,
  fullScreen = false,
  starColor,
  starCount,
  starSize,
  starMinScale,
  overflowThreshold,
  speed,
  mode,
  center,
  interactive,
  twinkle,
  backgroundColors,
  background,
  ...rest
}: StarSkyProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 解析运动中心与模式（缺省时回退到默认配置，保持现有“从中间扩散”行为）
  const starMode = mode ?? DEFAULT_STAR_SKY_CONFIG.mode;
  const centerX = center?.x ?? DEFAULT_STAR_SKY_CONFIG.center.x;
  const centerY = center?.y ?? DEFAULT_STAR_SKY_CONFIG.center.y;

  // 星空动画：容器尺寸变化时重算画布与星星数量
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return undefined;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    // 解析配置（缺省时回退到默认配置）
    const color = starColor ?? DEFAULT_STAR_SKY_CONFIG.starColor;
    const lineSize = starSize ?? DEFAULT_STAR_SKY_CONFIG.starSize;
    const minScale = starMinScale ?? DEFAULT_STAR_SKY_CONFIG.starMinScale;
    const overflow = overflowThreshold ?? DEFAULT_STAR_SKY_CONFIG.overflowThreshold;
    // speed 为缩放系数：扩散/收缩用 0.0009，旋转用 0.00009，实际值 = 基准 × speed
    const depthSpeed = (speed ?? DEFAULT_STAR_SKY_CONFIG.speed) * BASE_DEPTH_SPEED;
    const rotateSpeed = (speed ?? DEFAULT_STAR_SKY_CONFIG.speed) * BASE_ROTATE_SPEED;
    const withTwinkle = twinkle ?? DEFAULT_STAR_SKY_CONFIG.twinkle;
    const withInteractive = interactive ?? DEFAULT_STAR_SKY_CONFIG.interactive;

    // 星星数量：未指定时按 (容器宽 + 容器高) / 8 计算
    const resolveCount = (width: number, height: number): number => starCount ?? Math.floor((width + height) / 8);

    // 容器尺寸（CSS 像素）与缩放比
    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;
    // 运动中心点（由 center 参数解析后的实际坐标，resize 时随尺寸更新）
    let centerPointX = 0;
    let centerPointY = 0;
    // 星星列表与鼠标指针坐标
    let stars: Star[] = [];
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    // 漂移速度（x/y 为惯性速度，tx/ty 为目标速度，z 为扩散/收缩的纵深速度）
    const velocity = { x: 0, y: 0, tx: 0, ty: 0, z: depthSpeed };
    let frameId = 0;

    // 尊重系统“减少动态效果”偏好：仅静态绘制一次
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const isReducedMotion = (): boolean => motionQuery?.matches === true;

    // 生成一批随机纵深星星（坐标稍后 placeStar 放置）
    const generate = (count: number): void => {
      stars = Array.from({ length: count }, () => ({
        x: 0,
        y: 0,
        z: minScale + Math.random() * (1 - minScale),
      }));
    };

    // 随机放置单颗星星
    const placeStar = (star: Star): void => {
      star.x = Math.random() * cssWidth;
      star.y = Math.random() * cssHeight;
    };

    // 星星是否移出可视范围（含回收阈值）
    const isOutOfBounds = (star: Star): boolean =>
      star.x < -overflow || star.x > cssWidth + overflow || star.y < -overflow || star.y > cssHeight + overflow;

    // 扩散模式下出界后按当前漂移方向回收，保证画面始终有星星补充
    const recycleStar = (star: Star): void => {
      let direction: 'z' | 'l' | 'r' | 't' | 'b' = 'z';
      const vx = Math.abs(velocity.x);
      const vy = Math.abs(velocity.y);
      if (vx > 1 || vy > 1) {
        let axis: 'h' | 'v';
        if (vx > vy) {
          axis = Math.random() < vx / (vx + vy) ? 'h' : 'v';
        } else {
          axis = Math.random() < vy / (vx + vy) ? 'v' : 'h';
        }
        if (axis === 'h') {
          direction = velocity.x > 0 ? 'l' : 'r';
        } else {
          direction = velocity.y > 0 ? 't' : 'b';
        }
      }

      star.z = minScale + Math.random() * (1 - minScale);

      if (direction === 'z') {
        star.z = 0.1;
        star.x = Math.random() * cssWidth;
        star.y = Math.random() * cssHeight;
      } else if (direction === 'l') {
        star.x = -overflow;
        star.y = Math.random() * cssHeight;
      } else if (direction === 'r') {
        star.x = cssWidth + overflow;
        star.y = Math.random() * cssHeight;
      } else if (direction === 't') {
        star.x = Math.random() * cssWidth;
        star.y = -overflow;
      } else {
        star.x = Math.random() * cssWidth;
        star.y = cssHeight + overflow;
      }
    };

    // 旋转模式下星星被指针漂移推出屏幕后：在画布内随机重生，
    // 并恢复正常的 z（与扩散相反，绝不使用 z=0.1 的极淡星星，保证画面亮度/数量稳定）
    const recycleRotateStar = (star: Star): void => {
      star.z = minScale + Math.random() * (1 - minScale);
      placeStar(star);
    };

    // 收缩模式下星星落入中心后：在屏幕边缘外重生，并恢复较大的 z（与扩散相反）
    const recycleShrinkStar = (star: Star): void => {
      star.z = 0.9 + Math.random() * 0.1;
      const side = Math.floor(Math.random() * 4);
      if (side === 0) {
        star.x = -overflow;
        star.y = Math.random() * cssHeight;
      } else if (side === 1) {
        star.x = cssWidth + overflow;
        star.y = Math.random() * cssHeight;
      } else if (side === 2) {
        star.x = Math.random() * cssWidth;
        star.y = -overflow;
      } else {
        star.x = Math.random() * cssWidth;
        star.y = cssHeight + overflow;
      }
    };

    // 根据容器当前尺寸重建画布（高 DPI 下按 devicePixelRatio 放大）
    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      // 后续绘制统一使用 CSS 像素坐标系，由该变换放大到物理像素
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 中心点按当前容器尺寸解析一次，供各运动模式使用
      centerPointX = resolveAnchor(centerX, cssWidth);
      centerPointY = resolveAnchor(centerY, cssHeight);

      const count = resolveCount(cssWidth, cssHeight);
      if (stars.length !== count) {
        generate(count);
      }
      stars.forEach(placeStar);

      // 减少动态效果模式：resize 后静态重绘一次
      if (isReducedMotion()) {
        draw();
      }
    };

    // 更新每颗星星位置与速度（按模式区分整体运动）
    const update = (): void => {
      // 指针惯性缓动（所有模式通用）
      velocity.tx *= 0.96;
      velocity.ty *= 0.96;
      velocity.x += (velocity.tx - velocity.x) * 0.8;
      velocity.y += (velocity.ty - velocity.y) * 0.8;

      for (const star of stars) {
        // 指针造成的整体漂移（所有模式保留，用于视差反馈）
        star.x += velocity.x * star.z;
        star.y += velocity.y * star.z;

        if (starMode === 'shrink') {
          // 收缩：位置与 z 的变化均与“扩散”相反（z 逐渐变小，星星向中心落入）
          const shrinkVz = -velocity.z;
          star.x += (star.x - centerPointX) * shrinkVz * star.z;
          star.y += (star.y - centerPointY) * shrinkVz * star.z;
          star.z += shrinkVz;
          const dx = star.x - centerPointX;
          const dy = star.y - centerPointY;
          // z 过小或已贴近中心时回收，在边缘外重新“吸入”
          if (star.z <= 0.02 || dx * dx + dy * dy < 25) {
            recycleShrinkStar(star);
          }
        } else if (starMode === 'rotate-cw' || starMode === 'rotate-ccw') {
          // 旋转：只改变绕中心的角度（近处 z 大转得快，体现纵深）；
          // z 本身不再增大/减小，即星星不会被拉近或拉远。
          const direction = starMode === 'rotate-cw' ? 1 : -1;
          const dx = star.x - centerPointX;
          const dy = star.y - centerPointY;
          const radius = Math.hypot(dx, dy);
          if (radius > 0.5) {
            const angle = Math.atan2(dy, dx) + direction * rotateSpeed * star.z;
            star.x = centerPointX + Math.cos(angle) * radius;
            star.y = centerPointY + Math.sin(angle) * radius;
          }
          // 旋转会沿圆周运动，星星可能短暂经过屏幕外；仅在指针漂移把它
          // 彻底推出屏幕（超过 overflowThreshold）时，才在画布内重新生成，
          // 保持星星总数与亮度不随时间衰减。
          if (isOutOfBounds(star)) {
            recycleRotateStar(star);
          }
        } else {
          // 默认 expand：从中心点向外扩散（z 逐渐变大，星星向四周飞散）
          star.x += (star.x - centerPointX) * velocity.z * star.z;
          star.y += (star.y - centerPointY) * velocity.z * star.z;
          star.z += velocity.z;
          if (isOutOfBounds(star)) {
            recycleStar(star);
          }
        }
      }
    };

    // 绘制一帧星星（带拖尾；twinkle 开启时逐帧随机透明度）
    const draw = (): void => {
      context.clearRect(0, 0, cssWidth, cssHeight);
      context.lineCap = 'round';
      for (const star of stars) {
        context.globalAlpha = withTwinkle ? 0.5 + 0.5 * Math.random() : 1;
        context.strokeStyle = color;
        context.lineWidth = lineSize * star.z;
        context.beginPath();
        context.moveTo(star.x, star.y);
        // 计算拖尾：静止时给一个极小长度，使星星呈圆点
        let tailX = velocity.x * 2;
        let tailY = velocity.y * 2;
        if (Math.abs(tailX) < 0.1) tailX = 0.5;
        if (Math.abs(tailY) < 0.1) tailY = 0.5;
        context.lineTo(star.x + tailX, star.y + tailY);
        context.stroke();
      }
    };

    // 动画帧循环
    const step = (): void => {
      update();
      draw();
      frameId = window.requestAnimationFrame(step);
    };

    const start = (): void => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = 0;
      if (!isReducedMotion()) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    // 指针移动：累计目标速度，形成“星空随鼠标漂移”的视差效果
    const movePointer = (x: number, y: number): void => {
      if (typeof pointerX === 'number' && typeof pointerY === 'number') {
        const ox = x - pointerX;
        const oy = y - pointerY;
        velocity.tx += ox / 100;
        velocity.ty += oy / 100;
      }
      pointerX = x;
      pointerY = y;
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (!withInteractive || isReducedMotion()) {
        return;
      }
      const rect = container.getBoundingClientRect();
      movePointer(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handlePointerLeave = (): void => {
      pointerX = null;
      pointerY = null;
    };

    const handleTouchMove = (event: TouchEvent): void => {
      if (!withInteractive || isReducedMotion()) {
        return;
      }
      if (event.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        movePointer(event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top);
        event.preventDefault();
      }
    };

    const handleTouchEnd = (): void => {
      pointerX = null;
      pointerY = null;
    };

    // 容器尺寸变化时重建画布（使用 ResizeObserver，回退到 window resize）
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize);
      observer.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    // 系统减少动态效果偏好变化时：切换动画/静态绘制
    const handleMotionChange = (): void => {
      if (isReducedMotion()) {
        if (frameId) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        }
        draw();
      } else if (!frameId) {
        start();
      }
    };
    motionQuery?.addEventListener('change', handleMotionChange);

    // 指针/触摸事件挂载在容器上：内容层可正常点击，指针经过即可产生视差
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    resize();
    start();

    // 清理：取消动画帧、移除监听与观察器
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      motionQuery?.removeEventListener('change', handleMotionChange);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    starColor,
    starCount,
    starSize,
    starMinScale,
    overflowThreshold,
    speed,
    starMode,
    centerX,
    centerY,
    interactive,
    twinkle,
  ]);

  return (
    <div
      ref={containerRef}
      {...rest}
      className={joinClass(styles.root, fullScreen ? styles.fullScreen : null, className)}
      style={buildRootStyle(background, backgroundColors, style)}
    >
      {/* 星空画布 */}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      {/* 可选内容层：叠加在星空之上 */}
      {children !== undefined && children !== null ? (
        <div className={joinClass(styles.content, contentClassName)}>{children}</div>
      ) : null}
    </div>
  );
}

/**
 * StarSkyCard：星空背景 + Card 的组合卡片组件。
 * 复用了基础元件 Card（圆角/内边距/阴影等由 cardProps 控制），
 * children 即卡片内的子组件；也可以不传 children 当纯装饰卡片使用。
 */
export function StarSkyCard({ cardProps, children, ...starProps }: StarSkyCardProps) {
  return (
    <StarSky {...starProps}>
      <Card {...cardProps}>{children}</Card>
    </StarSky>
  );
}

export default StarSky;

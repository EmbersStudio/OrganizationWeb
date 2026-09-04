import type { CSSProperties, ReactNode } from 'react';

/**
 * DecryptReveal 组件对外参数。
 *
 * 两种用法：
 * 1. 单图模式：传入 image，组件自身渲染解码揭示画布；
 * 2. 容器模式：传入 children（内含若干 <img>），组件自动为其中每张图片
 *    叠加解密效果层，其余 DOM（文本、按钮等）原样保留。
 *
 * 所有可选视觉参数均有默认值（见 DECRYPT_REVEAL_DEFAULTS，单一数据源）。
 */
export interface DecryptRevealProps {
  /** 内容图片 URL（单图模式必需；建议同源或支持 CORS，否则画布会被污染） */
  image?: string;
  /** 解密影响半径（CSS 像素），默认 400 */
  radius?: number;
  /** 揭示边缘软度（0~1），默认 0.5 */
  softness?: number;
  /** 字形主色（十六进制），默认 #4ade80 */
  color?: string;
  /** 背景色（十六进制），默认 #000000 */
  background?: string;
  /** 亮度（0.2~3），默认 1 */
  brightness?: number;
  /** 乱码强度（0~1），默认 0.1 */
  scramble?: number;
  /** 乱码滚动速度（0~30），默认 6 */
  scrambleSpeed?: number;
  /** 边缘宽度（0~1），默认 0.2 */
  edgeWidth?: number;
  /** 边缘闪烁（0~1），默认 1 */
  edgeFlicker?: number;
  /** 边缘辉光（0~3），默认 2 */
  edgeGlow?: number;
  /** 边缘色调（0~1），默认 0.75 */
  edgeTint?: number;
  /** 色差强度（>=0），默认 10 */
  aberration?: number;
  /** 原始图像透传度（0~1），默认 0.15 */
  passthrough?: number;
  /** 字形匹配阈值（>=0.005），默认 0.025 */
  threshold?: number;
  /** 字形对比度（0.3~3），默认 1 */
  contrast?: number;
  /** 字形曝光度（0.2~3），默认 1 */
  exposure?: number;
  /** 易读性（0~1），默认 1 */
  legibility?: number;
  /** 彩色化（0~1），默认 1 */
  colored?: number;
  /** 网格单元边长（CSS 像素），默认 10 */
  cell?: number;
  /** 网格单元宽高比（0.35~1.25），默认 0.75 */
  aspect?: number;
  /** 指针平滑系数（>=0.0001），默认 0.2 */
  smoothing?: number;
  /** 容器模式内容：内部包含一系列块，其中的 <img> 会被自动叠加解密效果 */
  children?: ReactNode;
  /** 可选宽度（支持任意 CSS 尺寸值）；单图模式不传时默认填满父容器 */
  width?: CSSProperties['width'];
  /** 可选高度（支持任意 CSS 尺寸值）；单图模式不传时默认填满父容器 */
  height?: CSSProperties['height'];
  /** 附加到外层容器的类名（容器模式可用来承载原布局类，如 flex row） */
  className?: string;
  /** 附加到外层容器的样式（会与默认布局样式合并） */
  style?: CSSProperties;
}

/** 传递给 Hook 的运行时参数（去掉 children/容器透传字段，含 image 可选） */
export type DecryptRevealRuntimeProps = Omit<
  DecryptRevealProps,
  'children' | 'className' | 'style' | 'width' | 'height'
>;

/** 运行时参数（不含 image），用于生成全量解析类型 */
type DecryptRevealRuntimeWithoutImage = Omit<DecryptRevealRuntimeProps, 'image'>;

/** 解析默认值后的运行时参数（视觉/几何字段均为具体值；image 仍可选） */
export type ResolvedDecryptRevealProps = {
  [K in keyof DecryptRevealRuntimeWithoutImage]-?: NonNullable<DecryptRevealRuntimeWithoutImage[K]>;
} & { image?: string };

/** 默认参数（唯一数据源：组件与 Hook 共用） */
export const DECRYPT_REVEAL_DEFAULTS = {
  radius: 400,
  softness: 0.5,
  color: '#4ade80',
  background: '#000000',
  brightness: 1,
  scramble: 0.1,
  scrambleSpeed: 6,
  edgeWidth: 0.2,
  edgeFlicker: 1,
  edgeGlow: 2,
  edgeTint: 0.75,
  aberration: 10,
  passthrough: 0.15,
  threshold: 0.025,
  contrast: 1,
  exposure: 1,
  legibility: 1,
  colored: 1,
  cell: 10,
  aspect: 0.75,
  smoothing: 0.2,
} as const satisfies ResolvedDecryptRevealProps;

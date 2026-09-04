import type { CSSProperties } from 'react';

/**
 * DecryptReveal 组件对外参数。
 *
 * 除 className / style 为容器透传外，其余均为解密揭示效果参数；
 * 每个可选参数都有默认值（见 DECRYPT_REVEAL_DEFAULTS，单一数据源）。
 */
export interface DecryptRevealProps {
  /** 内容图片 URL（必需；建议同源或支持 CORS，否则画布会被污染） */
  image: string;
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
  /** 附加到外层容器的类名 */
  className?: string;
  /** 附加到外层容器的样式（会与 position/width/height 合并） */
  style?: CSSProperties;
}

/** 传递给 Hook 的运行时参数（去掉容器透传字段） */
export type DecryptRevealRuntimeProps = Omit<DecryptRevealProps, 'className' | 'style'>;

/** 解析默认值后的运行时参数（所有字段均为具体值） */
export type ResolvedDecryptRevealProps = {
  [K in keyof DecryptRevealRuntimeProps]-?: NonNullable<DecryptRevealRuntimeProps[K]>;
};

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
} as const satisfies Omit<ResolvedDecryptRevealProps, 'image'>;

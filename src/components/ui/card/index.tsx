import type { HTMLAttributes } from 'react';

import styles from './Card.module.css';

/** Card 视觉变体 */
export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'tinted';

/** 圆角档位 */
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** 内边距档位 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/** 阴影档位 */
export type CardShadow = 'none' | 'sm' | 'md' | 'lg';

/** Card 元件 props：在原生 div 属性基础上增加圆角 / 阴影 / 内边距等参数 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 容器视觉变体，默认 elevated */
  variant?: CardVariant;
  /** 圆角，默认 md */
  radius?: CardRadius;
  /** 内边距，默认 md */
  padding?: CardPadding;
  /** 阴影，默认 md */
  shadow?: CardShadow;
}

const variantClass: Record<CardVariant, string> = {
  elevated: styles.variantElevated,
  outlined: styles.variantOutlined,
  flat: styles.variantFlat,
  tinted: styles.variantTinted,
};

const radiusClass: Record<CardRadius, string> = {
  none: styles.radiusNone,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
  full: styles.radiusFull,
};

const paddingClass: Record<CardPadding, string> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

const shadowClass: Record<CardShadow, string> = {
  none: styles.shadowNone,
  sm: styles.shadowSm,
  md: styles.shadowMd,
  lg: styles.shadowLg,
};

/** 拼接类名（过滤空值） */
function joinClass(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/**
 * 基础 Card 容器元件：可容纳任意子元素，外观由 variant / radius /
 * padding / shadow 参数控制，也支持 className / style 覆盖。
 */
export function Card({
  variant = 'elevated',
  radius = 'md',
  padding = 'md',
  shadow = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={joinClass(
        styles.card,
        variantClass[variant],
        radiusClass[radius],
        paddingClass[padding],
        shadowClass[shadow],
        className,
      )}
    >
      {children}
    </div>
  );
}

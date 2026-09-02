import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './Button.module.css';

/** Button 变体：影响填充色 / 边框 / 文本色 */
export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

/** Button 尺寸 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Button 外形：square 为纯矩形（如“更多”触发器），rounded 带圆角 */
export type ButtonShape = 'rounded' | 'square';

/** Button 通用样式参数（同时作用于 <button> 与 <a> 两种渲染形态） */
interface ButtonStyleProps {
  /** 视觉变体，默认 primary */
  variant?: ButtonVariant;
  /** 尺寸，默认 md */
  size?: ButtonSize;
  /** 外形，默认 rounded */
  shape?: ButtonShape;
  /** 图标（字体图标 / SVG / 任意 ReactNode），可选 */
  icon?: ReactNode;
  /** 图标位置，默认 start */
  iconPosition?: 'start' | 'end';
  /** 占满父容器宽度 */
  fullWidth?: boolean;
}

type ButtonAsButton = ButtonStyleProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonStyleProps> & { href?: undefined };

type ButtonAsAnchor = ButtonStyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonStyleProps> & { href: string };

/** Button 的完整 props：传入 href 时渲染为 <a>，否则渲染为 <button> */
export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

/** 拼接类名（过滤空值，供各 UI 元件内部使用） */
function joinClass(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  outline: styles.variantOutline,
  ghost: styles.variantGhost,
  danger: styles.variantDanger,
};

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

/**
 * 基础 Button 元件。
 *
 * 用法：
 * - 文本：<Button>保存</Button>
 * - 图标：<Button icon={<StarIcon />} aria-label="收藏" />
 * - 图标 + 文本：<Button icon={<Icon />} iconPosition="end">下一步</Button>
 * - 完全留空（占位/装饰）：<Button aria-hidden="true" />
 * - 链接形态：<Button href="/about">关于</Button>
 *
 * 外部可通过 className 追加自定义 CSS Module 类覆盖默认外观。
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    shape = 'rounded',
    icon,
    iconPosition = 'start',
    fullWidth = false,
    children,
    className,
    style,
    ...rest
  } = props;

  const classes = joinClass(
    styles.button,
    variantClass[variant],
    sizeClass[size],
    shape === 'square' ? styles.shapeSquare : styles.shapeRounded,
    fullWidth ? styles.fullWidth : null,
    className,
  );

  const content = (
    <>
      {icon !== undefined && iconPosition === 'start' && <span className={styles.iconWrap}>{icon}</span>}
      {children !== undefined && children !== null && <span className={styles.label}>{children}</span>}
      {icon !== undefined && iconPosition === 'end' && <span className={styles.iconWrap}>{icon}</span>}
    </>
  );

  if ('href' in props && typeof props.href === 'string') {
    const { href } = props;
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a {...anchorProps} href={href} className={classes} style={style}>
        {content}
      </a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...buttonProps} type={buttonProps.type ?? 'button'} className={classes} style={style}>
      {content}
    </button>
  );
}

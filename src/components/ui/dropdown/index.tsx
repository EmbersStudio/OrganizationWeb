'use client';

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Card } from '@/components/ui/card';
import styles from './Dropdown.module.css';

/** 下拉菜单中的一项 */
export interface DropdownMenuItem {
  /** 唯一 ID（React key） */
  id: string;
  /** 显示内容 */
  label: ReactNode;
  /** 可选图标 */
  icon?: ReactNode;
  /** 可选链接地址（原生 <a>） */
  href?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 选中态（例如语言菜单中的当前语言） */
  selected?: boolean;
  /** 点击回调（触发后默认自动收起） */
  onClick?: () => void;
}

/** Dropdown（展开栏/下拉菜单）props */
export interface DropdownProps {
  /** 触发器，通常为 Button；也可传入任意接受 onClick 的元素 */
  trigger: ReactNode;
  /** 面板内的菜单项（传入时渲染 role="menu" 列表） */
  items?: readonly DropdownMenuItem[];
  /** 面板内的任意自定义内容（传入 items 时忽略） */
  children?: ReactNode;
  /** 面板水平对齐方式，默认 end（靠右） */
  align?: 'start' | 'end';
  /** 受控展开状态 */
  open?: boolean;
  /** 非受控模式下的初始状态 */
  defaultOpen?: boolean;
  /** 展开状态变化回调（受控/非受控均触发） */
  onOpenChange?: (open: boolean) => void;
  /** 点击菜单项后是否自动收起，默认 true */
  closeOnSelect?: boolean;
  /** 触发器锚点容器类名（自定义定位等） */
  className?: string;
  /** 面板类名（在 Card 默认样式之后追加） */
  panelClassName?: string;
  /** 菜单项类名 */
  itemClassName?: string;
}

/**
 * Dropdown 展开栏：由触发器（通常为 Button）和弹出面板（基于 Card）组成。
 * 面板内可放置列表项（items）或任意自定义内容（children）。
 */
export function Dropdown({
  trigger,
  items,
  children,
  align = 'end',
  open,
  defaultOpen = false,
  onOpenChange,
  closeOnSelect = true,
  className,
  panelClassName,
  itemClassName,
}: DropdownProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isOpen = open ?? internalOpen;

  const updateOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  const toggle = useCallback(() => {
    updateOpen(!isOpen);
  }, [isOpen, updateOpen]);

  // 点击外部或按下 Escape 时收起
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: globalThis.MouseEvent | globalThis.TouchEvent) => {
      const target = event.target as Node | null;
      if (anchorRef.current && target && !anchorRef.current.contains(target)) {
        updateOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        updateOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updateOpen]);

  type TriggerElementProps = {
    onClick?: MouseEventHandler<Element>;
    'aria-haspopup'?: string;
    'aria-expanded'?: boolean;
  };

  const triggerElement = isValidElement(trigger) ? (trigger as ReactElement<TriggerElementProps>) : null;

  const handleTriggerClick: MouseEventHandler<Element> = (event: ReactMouseEvent<Element>) => {
    const childOnClick = (triggerElement?.props as { onClick?: MouseEventHandler<Element> } | undefined)?.onClick;
    childOnClick?.(event);
    if (!event.defaultPrevented) {
      toggle();
    }
  };

  const triggerNode: ReactNode = triggerElement ? (
    cloneElement(triggerElement, {
      onClick: handleTriggerClick,
      'aria-haspopup': 'menu',
      'aria-expanded': isOpen,
    })
  ) : (
    <button
      type="button"
      className={styles.fallbackTrigger}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={toggle}
    >
      {trigger}
    </button>
  );

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) {
      return;
    }
    item.onClick?.();
    if (closeOnSelect) {
      updateOpen(false);
    }
  };

  const renderItemContent = (item: DropdownMenuItem): ReactNode => (
    <>
      {item.icon !== undefined && <span className={styles.itemIcon}>{item.icon}</span>}
      <span className={styles.itemLabel}>{item.label}</span>
      {item.selected && (
        <span className={styles.itemCheck} aria-hidden="true">
          ✓
        </span>
      )}
    </>
  );

  const renderPanelContent = (): ReactNode => {
    if (items) {
      return (
        <div className={styles.itemList} role="menu">
          {items.map((item) => {
            const itemClasses = [styles.item, item.selected ? styles.itemSelected : null, itemClassName]
              .filter(Boolean)
              .join(' ');

            if (item.href) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  aria-current={item.selected ? 'true' : undefined}
                  className={itemClasses}
                  onClick={() => handleItemClick(item)}
                >
                  {renderItemContent(item)}
                </a>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                aria-current={item.selected ? 'true' : undefined}
                className={itemClasses}
                onClick={() => handleItemClick(item)}
              >
                {renderItemContent(item)}
              </button>
            );
          })}
        </div>
      );
    }
    return children;
  };

  return (
    <div ref={anchorRef} className={[styles.anchor, className].filter(Boolean).join(' ')}>
      {triggerNode}
      {isOpen && (
        <Card
          variant="elevated"
          radius="lg"
          padding="none"
          shadow="lg"
          className={[styles.panel, align === 'start' ? styles.alignStart : styles.alignEnd, panelClassName]
            .filter(Boolean)
            .join(' ')}
        >
          {renderPanelContent()}
        </Card>
      )}
    </div>
  );
}

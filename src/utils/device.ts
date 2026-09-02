/**
 * 设备类型检测工具。
 *
 * getDeviceType 优先使用视口宽度（等价于媒体查询断点），
 * 仅在无法取得宽度时回退到 UA 判断。组件内如需响应式动效开关，
 * 使用本文件重导出的 usePerformanceMode Hook。
 */

/** 设备类型 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/** 响应式断点（px） */
export const DEVICE_BREAKPOINTS = {
  /** 小于等于该宽度视为手机 */
  mobileMaxWidth: 767.98,
  /** 小于等于该宽度视为平板 */
  tabletMaxWidth: 1199.98,
} as const;

/**
 * 基于视口宽度（优先）或 UA（回退）判断设备类型。
 *
 * @param width 视口宽度；缺省时读取 window.innerWidth
 * @param userAgent UA 字符串；缺省时读取 navigator.userAgent
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export function getDeviceType(width?: number, userAgent?: string): DeviceType {
  const resolvedWidth = width ?? (typeof window === 'undefined' ? undefined : window.innerWidth);
  if (typeof resolvedWidth === 'number' && resolvedWidth > 0) {
    if (resolvedWidth <= DEVICE_BREAKPOINTS.mobileMaxWidth) {
      return 'mobile';
    }
    if (resolvedWidth <= DEVICE_BREAKPOINTS.tabletMaxWidth) {
      return 'tablet';
    }
    return 'desktop';
  }

  // 宽度不可用时的 UA 回退（仅兜底，正常场景始终优先宽度）
  const agent = userAgent ?? (typeof navigator === 'undefined' ? '' : navigator.userAgent);
  const isMobileUA = /Android|iPhone|iPod|webOS|Mobile|Opera Mini/i.test(agent);
  const isTabletUA = /iPad|Tablet|Silk/i.test(agent);
  if (isTabletUA && !isMobileUA) {
    return 'tablet';
  }
  if (isMobileUA) {
    return 'mobile';
  }
  return 'desktop';
}

export { usePerformanceMode } from '@/hooks/use-performance-mode';
export type { PerformanceMode } from '@/hooks/use-performance-mode';

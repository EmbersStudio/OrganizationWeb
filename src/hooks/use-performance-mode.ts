'use client';

import {useEffect, useState} from 'react';

import {getDeviceType, type DeviceType} from '@/utils/device';

/** usePerformanceMode 返回值 */
export interface PerformanceMode {
  /** 当前设备类型（宽度优先判定） */
  deviceType: DeviceType;
  /** 系统是否开启“减少动态效果”（prefers-reduced-motion） */
  prefersReducedMotion: boolean;
  /** 是否处于低功耗模式（移动端或系统减少动态效果） */
  lowPower: boolean;
  /** 是否应启用完整动效（桌面端且系统未要求减少动态时为 true） */
  animationsEnabled: boolean;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 性能模式 Hook：根据设备类型与系统“减少动态效果”偏好，返回
 * 是否应启用完整动效。移动端应关闭复杂过渡/粒子等耗电动效，
 * 仅保留 hover 变色等基础反馈。
 *
 * 用法：const { animationsEnabled, lowPower } = usePerformanceMode();
 * 组件中据此切换 CSS class（如关闭 transition / backdrop-filter）。
 */
export function usePerformanceMode(): PerformanceMode {
  const [deviceType, setDeviceType] =
      useState<DeviceType>(() => getDeviceType());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
      () => typeof window === 'undefined' ?
          false :
          window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );

  useEffect(() => {
    const updateDeviceType = () => {
      setDeviceType(getDeviceType());
    };
    updateDeviceType();

    let mediaQuery: MediaQueryList|null = null;
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery?.matches ?? false);
    };
    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
      updateMotionPreference();
      mediaQuery.addEventListener('change', updateMotionPreference);
    }
    window.addEventListener('resize', updateDeviceType);

    return () => {
      mediaQuery?.removeEventListener('change', updateMotionPreference);
      window.removeEventListener('resize', updateDeviceType);
    };
  }, []);

  const lowPower = deviceType === 'mobile' || prefersReducedMotion;

  return {
    deviceType,
    prefersReducedMotion,
    lowPower,
    animationsEnabled: !lowPower,
  };
}

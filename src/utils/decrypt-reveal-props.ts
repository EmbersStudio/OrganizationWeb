/**
 * DecryptReveal 参数解析工具。
 *
 * 组件传入的视觉/几何参数均可选；渲染前统一合并默认值，
 * 得到“全字段均为具体值”的 ResolvedDecryptRevealProps，
 * 供 Hook 与渲染引擎逐帧读取（避免每处重复 ?? 默认值）。
 */

import {
  DECRYPT_REVEAL_DEFAULTS,
  type DecryptRevealRuntimeProps,
  type ResolvedDecryptRevealProps,
} from '@/types/decrypt-reveal';

/**
 * 合并默认值，得到渲染期全量参数。
 *
 * @param props 组件运行时参数（去掉了 className / style）
 * @returns 全量已解析参数
 */
export function resolveDecryptRevealProps(props: DecryptRevealRuntimeProps): ResolvedDecryptRevealProps {
  const d = DECRYPT_REVEAL_DEFAULTS;
  return {
    image: props.image,
    radius: props.radius ?? d.radius,
    softness: props.softness ?? d.softness,
    color: props.color ?? d.color,
    background: props.background ?? d.background,
    brightness: props.brightness ?? d.brightness,
    scramble: props.scramble ?? d.scramble,
    scrambleSpeed: props.scrambleSpeed ?? d.scrambleSpeed,
    edgeWidth: props.edgeWidth ?? d.edgeWidth,
    edgeFlicker: props.edgeFlicker ?? d.edgeFlicker,
    edgeGlow: props.edgeGlow ?? d.edgeGlow,
    edgeTint: props.edgeTint ?? d.edgeTint,
    aberration: props.aberration ?? d.aberration,
    passthrough: props.passthrough ?? d.passthrough,
    threshold: props.threshold ?? d.threshold,
    contrast: props.contrast ?? d.contrast,
    exposure: props.exposure ?? d.exposure,
    legibility: props.legibility ?? d.legibility,
    colored: props.colored ?? d.colored,
    cell: props.cell ?? d.cell,
    aspect: props.aspect ?? d.aspect,
    smoothing: props.smoothing ?? d.smoothing,
  };
}

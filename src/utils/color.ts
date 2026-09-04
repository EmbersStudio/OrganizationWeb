/**
 * 颜色解析工具。
 *
 * 将 `#rrggbb`（含可省略井号）形式的十六进制颜色解析为 0~1 浮点数组，
 * 供 WebGL uniform3f 等调用使用；非法输入返回黑色，避免着色器收到 NaN。
 */

/**
 * 解析十六进制颜色为 [r, g, b]（各分量 0~1）。
 *
 * @param hex 形如 `#4ade80` 或 `4ade80` 的颜色字符串
 * @returns [r, g, b] 浮点数组；格式非法时返回 [0, 0, 0]
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0];
  }
  return [
    Number.parseInt(result[1], 16) / 255,
    Number.parseInt(result[2], 16) / 255,
    Number.parseInt(result[3], 16) / 255,
  ];
}

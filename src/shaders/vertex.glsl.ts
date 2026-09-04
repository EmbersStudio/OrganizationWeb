/**
 * 公共顶点着色器：全屏四边形（屏幕空间），输出 UV。
 * 原样迁移自 HTMLTest/canvas.tsx，未做改动。
 */
export const vertexShaderSource =
  '#version 300 es\nprecision highp float;\nlayout(location = 0) in vec2 aPos;\nout vec2 vUv;\nvoid main () {\n  vUv = aPos * 0.5 + 0.5;\n  gl_Position = vec4(aPos, 0.0, 1.0);\n}';

/* 关于页专属脚本（仅 /about 页面加载，由 about.html 中的 <script src> 声明）。
 * 可在此自由添加该页面独有的交互逻辑。
 */
console.log('[Page JS] about.js loaded');

// 示例：点击成员卡片时短暂高亮
document.querySelectorAll('.member-chip').forEach((chip) => {
  chip.style.cursor = 'pointer';
  chip.addEventListener('click', () => {
    chip.style.outline = '2px solid rgba(232, 146, 78, 0.6)';
    chip.style.borderRadius = '12px';
    setTimeout(() => {
      chip.style.outline = '';
    }, 800);
  });
});

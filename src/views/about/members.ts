/**
 * 核心成员数据（原 about.html 中的成员卡片数据）。
 */

/** 核心成员信息 */
export interface Member {
  /** 唯一 ID（用于交互状态标识） */
  id: string;
  /** 显示名称 */
  name: string;
  /** GitHub 用户名（用于生成头像地址 https://github.com/<github>.png） */
  github: string;
  /** 徽章文本 */
  badge: string;
  /** 角色描述 */
  role: string;
}

/** 核心成员列表 */
export const MEMBERS: readonly Member[] = [
  {
    id: 'crimsonseraph',
    name: 'CrimsonSeraph',
    github: 'CrimsonSeraph',
    badge: '🛠️ 创始人',
    role: '应用 & 游戏开发',
  },
  {
    id: 'kinguang3',
    name: 'kinguang3',
    github: 'kinguang3',
    badge: '💻 核心开发',
    role: 'Next.js',
  },
  {
    id: 'angvannor',
    name: 'Angvannor',
    github: 'Angvannor',
    badge: '🎨 前端开发',
    role: 'Vue 3 · CSS · JS',
  },
];

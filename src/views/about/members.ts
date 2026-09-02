/**
 * 核心成员数据（原 about.html 中的成员卡片数据）。
 *
 * badge/role 改为翻译键，由 AboutPage 通过 t() 渲染，便于 i18n。
 */

/** 核心成员信息 */
export interface Member {
  /** 唯一 ID（用于交互状态标识） */
  id: string;
  /** 显示名称（人名，不翻译） */
  name: string;
  /** GitHub 用户名（用于生成头像地址 https://github.com/<github>.png） */
  github: string;
  /** 徽章文本翻译键 */
  badgeKey: string;
  /** 角色描述翻译键 */
  roleKey: string;
}

/** 核心成员列表 */
export const MEMBERS: readonly Member[] = [
  {
    id: 'crimsonseraph',
    name: 'CrimsonSeraph',
    github: 'CrimsonSeraph',
    badgeKey: 'about.members.crimsonseraphBadge',
    roleKey: 'about.members.crimsonseraphRole',
  },
  {
    id: 'kinguang3',
    name: 'kinguang3',
    github: 'kinguang3',
    badgeKey: 'about.members.kinguangBadge',
    roleKey: 'about.members.kinguangRole',
  },
  {
    id: 'angvannor',
    name: 'Angvannor',
    github: 'Angvannor',
    badgeKey: 'about.members.angvannorBadge',
    roleKey: 'about.members.angvannorRole',
  },
];

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { MEMBERS, type Member } from './members';
import { usePerformanceMode } from '@/utils/device';
import styles from './AboutPage.module.css';

/** 组织仓库地址 */
const REPO_URL = 'https://github.com/EmbersStudio/OrganizationWeb';

/** 贡献者墙地址 */
const CONTRIBUTORS_URL = REPO_URL + '/graphs/contributors';

/** 信息网格数据（wide=true 时占满整行） */
const INFO_ITEMS: readonly { label: string; value: ReactNode; wide?: boolean }[] = [
  { label: '🌐 全栈开发', value: 'Next.js · Node.js · TypeScript' },
  { label: '🎮 游戏开发', value: 'Unreal Engine (C++) · Godot (GDScript)' },
  { label: '🖥️ 桌面 & 底层', value: 'Qt (C++ / PyQt) · C++ · Python' },
  { label: '🎨 前端交互', value: 'Vue 3 · CSS · JavaScript' },
  {
    label: '📦 当前主项目',
    wide: true,
    value: (
      <>
        <a href={REPO_URL} target="_blank" rel="noopener">
          OrganizationWeb
        </a>
        &nbsp;·&nbsp; Next.js + TypeScript 组织官网（开发中）
      </>
    ),
  },
];

/** 技术栈标签 */
const TECH_TAGS = [
  'Next.js',
  'TypeScript',
  'Node.js',
  'Python',
  'C++',
  'Unreal Engine',
  'Godot',
  'Qt',
  'Vue 3',
  'Git',
  'GitHub',
];

/** AboutPage 组件参数 */
interface AboutPageProps {
  /** “返回首页”链接目标（由 src/router/routes.tsx 注册表提供，默认 /） */
  backHref?: string;
}

/**
 * 关于页：余烬工作室介绍（原 about.html 迁移而来）。
 *
 * 客户端组件：成员卡片点击高亮交互由 React 事件系统实现
 * （原 public/scripts/pages/about.js 的行为）。
 */
export default function AboutPage({ backHref = '/' }: AboutPageProps) {
  const { animationsEnabled } = usePerformanceMode();

  // 当前高亮（800ms 后自动清除）的成员卡片 ID
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  // 已被点击过的成员卡片 ID（保留圆角，保持与原 about.js 行为一致）
  const [tappedChipIds, setTappedChipIds] = useState<ReadonlySet<string>>(() => new Set());
  const timerRef = useRef<number | null>(null);

  const handleChipClick = useCallback((member: Member) => {
    setTappedChipIds((prev) => {
      const next = new Set(prev);
      next.add(member.id);
      return next;
    });
    setActiveChipId(member.id);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setActiveChipId(null), 800);
  }, []);

  // 卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <main>
      <div className={[styles.pageWrap, animationsEnabled ? '' : styles.reducedMotion].filter(Boolean).join(' ')}>
        <div className={styles.aboutCard}>
          {/* 页头 */}
          <h1 className={styles.pageTitle}>
            <span className={styles.embersGlow} />
            关于 · 余烬工作室
          </h1>
          <div className={styles.pageSub}>⚙️ EmbersStudio — 始于余烬，重塑新生</div>

          {/* 描述 */}
          <p className={styles.pageLead}>
            <strong>EmbersStudio</strong> 是由 CrimsonSeraph
            发起的个人开发者联盟，以技术驱动为核心。我们相信优秀的工具和作品源于对技术的热爱与对细节的执着。目前团队由三位核心成员组成，致力于全栈、游戏、桌面及底层工具的开发。
          </p>

          {/* 信息网格 */}
          <div className={styles.infoGrid}>
            {INFO_ITEMS.map((item) => (
              <div key={item.label} className={item.wide ? styles.infoItemWide : styles.infoItem}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.value}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* 成员 */}
          <div className={styles.membersSection}>
            <h3>
              👥 核心成员
              <span>— 贡献者 &amp; 维护者</span>
            </h3>
            <div className={styles.memberRow}>
              {MEMBERS.map((member) => (
                <div
                  key={member.id}
                  className={[
                    styles.memberChip,
                    tappedChipIds.has(member.id) ? styles.memberChipTapped : '',
                    activeChipId === member.id ? styles.memberChipActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleChipClick(member)}
                >
                  {/* 保持原 about.html 的普通 img + lazy 加载，避免引入 next/image 优化行为变化 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={'https://github.com/' + member.github + '.png'} alt={member.name} loading="lazy" />
                  <span className={styles.memberName}>{member.name}</span>
                  <span className={styles.memberBadge}>{member.badge}</span>
                  <span className={styles.memberRole}>{member.role}</span>
                </div>
              ))}
            </div>
            <p className={styles.contributorsNote}>
              💡 动态贡献者墙请见{' '}
              <a className={styles.contributorsLink} href={CONTRIBUTORS_URL} target="_blank" rel="noopener">
                GitHub 贡献者
              </a>
            </p>
          </div>

          {/* 技术栈标签 */}
          <div className={styles.techTags}>
            {TECH_TAGS.map((tag) => (
              <span key={tag} className={styles.techTag}>
                {tag}
              </span>
            ))}
          </div>

          {/* 分隔 */}
          <div className={styles.divider} />

          {/* 理念引用 */}
          <div className={styles.quoteBlock}>
            <p>“From the Embers, we build.”</p>
            <div className={styles.attrib}>— 每一次重构都是新生，每一行代码都承载着对品质的追求。</div>
          </div>

          {/* 联系与链接 */}
          <div className={styles.contactRow}>
            <div className={styles.contactLinks}>
              <span>
                📧{' '}
                <a className={styles.contactLink} href="mailto:CrimsonSeraph.QwQ@gmail.com">
                  CrimsonSeraph.QwQ@gmail.com
                </a>
              </span>
              <span>
                🐦{' '}
                <a className={styles.contactLink} href="https://x.com/CrimSeraph_QwQ" target="_blank" rel="noopener">
                  X / Twitter
                </a>
              </span>
              <span>
                🌐{' '}
                <a
                  className={styles.contactLink}
                  href="https://embers-studio.crimsonseraph.top"
                  target="_blank"
                  rel="noopener"
                >
                  embers-studio.crimsonseraph.top
                </a>
              </span>
            </div>
            <Link className={styles.pageLinkFlat} href={backHref}>
              ← 返回首页
            </Link>
          </div>

          {/* 底部小字 */}
          <div className={styles.pageMeta}>
            <span>© 2026 EmbersStudio · 余烬工作室</span>
            <span>⚡ 开源 · 各项目采用不同许可证，详见仓库 LICENSE</span>
          </div>
        </div>
      </div>
    </main>
  );
}

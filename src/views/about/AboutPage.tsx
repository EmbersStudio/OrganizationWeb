'use client';

import Head from 'next/head';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useI18n } from '@/i18n';
import { usePageMeta } from '@/hooks/use-page-meta';
import { usePerformanceMode } from '@/utils/device';
import { MEMBERS, type Member } from './members';
import { DecryptReveal } from '@/components/DecryptReveal';
import styles from './AboutPage.module.css';

/** 组织仓库地址 */
const REPO_URL = 'https://github.com/EmbersStudio/OrganizationWeb';

/** 贡献者墙地址 */
const CONTRIBUTORS_URL = REPO_URL + '/graphs/contributors';

/** 联系链接（文案通过翻译键渲染） */
const CONTACT_LINKS: readonly { key: string; href: string; external?: boolean }[] = [
  { key: 'about.contactEmail', href: 'mailto:CrimsonSeraph.QwQ@gmail.com' },
  { key: 'about.contactX', href: 'https://x.com/CrimSeraph_QwQ', external: true },
  { key: 'about.contactSite', href: 'https://embers-studio.crimsonseraph.top', external: true },
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

/** 信息网格数据（wide=true 时占满整行） */
interface InfoItem {
  labelKey: string;
  value: ReactNode;
  wide?: boolean;
}

/** AboutPage 组件参数 */
interface AboutPageProps {
  /** “返回首页”链接目标（由路由注册表提供，默认 /） */
  backHref?: string;
}

/**
 * 关于页：余烬工作室介绍。
 */
export default function AboutPage({}: AboutPageProps) {
  const { animationsEnabled } = usePerformanceMode();
  const { t } = useI18n();
  const { title, description } = usePageMeta('about');

  // 信息网格（语言变化时重建，文案来自翻译）
  const infoItems = useMemo<readonly InfoItem[]>(
    () => [
      { labelKey: 'about.info.fullstackLabel', value: t('about.info.fullstackValue') },
      { labelKey: 'about.info.gameLabel', value: t('about.info.gameValue') },
      { labelKey: 'about.info.desktopLabel', value: t('about.info.desktopValue') },
      { labelKey: 'about.info.frontendLabel', value: t('about.info.frontendValue') },
      {
        labelKey: 'about.info.projectLabel',
        wide: true,
        value: (
          <>
            <a href={REPO_URL} target="_blank" rel="noopener">
              {t('about.info.projectValueName')}
            </a>
            {t('about.info.projectValueSuffix')}
          </>
        ),
      },
    ],
    [t],
  );

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

  // 语言变化时更新标题
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <main>
        <div className={[styles.pageWrap, animationsEnabled ? '' : styles.reducedMotion].filter(Boolean).join(' ')}>
          <div className={styles.aboutCard}>
            {/* 页头 */}
            <h1 className={styles.pageTitle}>
              <span className={styles.embersGlow} />
              {t('about.title')}
            </h1>
            <div className={styles.pageSub}>{t('about.subtitle')}</div>

            {/* 描述 */}
            <p className={styles.pageLead}>
              <strong>{t('home.brand')}</strong>
              {t('about.lead')}
            </p>

            {/* 信息网格 */}
            <div className={styles.infoGrid}>
              {infoItems.map((item) => (
                <div key={item.labelKey} className={item.wide ? styles.infoItemWide : styles.infoItem}>
                  <span className={styles.label}>{t(item.labelKey)}</span>
                  <span className={styles.value}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 成员 */}
            <div className={styles.membersSection}>
              <h3>
                {t('about.membersHeading')}
                <span>{t('about.membersHeadingSub')}</span>
              </h3>
              {/* 容器模式：DecryptReveal 自动为行内每张头像叠加解密效果，其余文案/交互保持原样 */}
              <DecryptReveal
                className={styles.memberRow}
                radius={100}
                softness={0.5}
                color="#4ade80"
                scramble={0.12}
                cell={5}
              >
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
                    {/* 保持普通 img + lazy 加载；crossOrigin 允许把头像绘制进 WebGL 内容层 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={styles.memberImg}
                      src={`https://unavatar.io/github/${member.github}`}
                      alt={member.name}
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberBadge}>{t(member.badgeKey)}</span>
                    <span className={styles.memberRole}>{t(member.roleKey)}</span>
                  </div>
                ))}
              </DecryptReveal>
              <p className={styles.contributorsNote}>
                {t('about.contributorsNote')}{' '}
                <a className={styles.contributorsLink} href={CONTRIBUTORS_URL} target="_blank" rel="noopener">
                  {t('about.contributorsLink')}
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
              <p>{t('about.quote')}</p>
              <div className={styles.attrib}>{t('about.quoteAttrib')}</div>
            </div>

            {/* 联系与链接 */}
            <div className={styles.contactRow}>
              <div className={styles.contactLinks}>
                {CONTACT_LINKS.map((item) => (
                  <span key={item.key}>
                    <a
                      className={styles.contactLink}
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                    >
                      {t(item.key)}
                    </a>
                  </span>
                ))}
              </div>
            </div>

            {/* 底部小字 */}
            <div className={styles.pageMeta}>
              <span>{t('about.metaCopyright')}</span>
              <span>{t('about.metaLicense')}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

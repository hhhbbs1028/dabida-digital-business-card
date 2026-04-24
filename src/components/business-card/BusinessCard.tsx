/**
 * BusinessCard Component
 *
 * 테마 기반 명함 카드 컴포넌트
 *
 * 설계 원칙:
 * - 카드 크기는 항상 9:5 (landscape) 또는 5:9 (portrait) 고정 비율
 * - 레이아웃은 컴포넌트로, 스타일은 CSS Variables로 관리
 * - layoutId에 따라 다른 레이아웃 렌더링
 * - Tailwind는 구조/간격 담당, 색/폰트/배경은 CSS Variables 담당
 */

import React from 'react';
import { Globe, HardDrive, Mail, Phone } from 'lucide-react';
import type { CardTheme, CardContentTokens, ElementPosition } from '../../theme/types';
import { resolvePositions } from '../../theme/defaultPositions';
import { applyThemeToStyle } from '../../theme/applyTheme';

// lucide-react deprecated 소셜 아이콘 → 인라인 SVG
const IgIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const GhIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);
const LiIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

type Props = {
  theme: CardTheme;
  data: CardContentTokens;
  className?: string;
  style?: React.CSSProperties;
};

// ============================================================================
// PositionedView — elementPositions가 저장된 카드의 정적 뷰 렌더러
// ============================================================================

function AbsElem({ pos, children }: { pos: ElementPosition; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      transform: 'translate(-50%, -50%)',
      opacity: pos.opacity ?? 1,
      zIndex: pos.zIndex != null ? pos.zIndex : undefined,
    }}>
      {children}
    </div>
  );
}

function PositionedView({ theme, data }: Props) {
  const bgStyle = applyThemeToStyle(theme);
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';
  const hasProfile = !!data.profileUrl && theme.style.profileShape !== 'none';
  const pos = resolvePositions(theme.elementPositions, theme.layoutId, orientation, hasProfile);
  const { profileShape } = theme.style;

  const shapeRadius = profileShape === 'circle' ? '50%' : profileShape === 'rounded' ? '12px' : '0';

  const scaledFs = (fs: string, scale: number) =>
    scale === 1 ? fs : `calc(${fs} * ${scale})`;

  const ts = (colorVar: string, fs: string, fsP?: string, scale = 1): React.CSSProperties => ({
    fontFamily: 'var(--card-body-font)',
    fontWeight: 'var(--card-body-weight)',
    color: `var(${colorVar})`,
    fontSize: scaledFs(isPortrait ? (fsP ?? fs) : fs, scale),
    whiteSpace: 'nowrap',
  });

  const linkStyle = (scale = 1): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '3px',
    ...ts('--card-text', '0.58rem', '0.7rem', scale),
  });

  return (
    <div className="absolute inset-0" style={bgStyle}>
      {/* 프로필 */}
      {hasProfile && pos.profile && (
        <div style={{
          position: 'absolute',
          left: `${pos.profile.x}%`,
          top: `${pos.profile.y}%`,
          transform: 'translate(-50%, -50%)',
          width: `${pos.profile.size ?? 22}%`,
          aspectRatio: '1',
          borderRadius: shapeRadius,
          overflow: 'hidden',
          opacity: pos.profile.opacity ?? 1,
          zIndex: pos.profile.zIndex != null ? pos.profile.zIndex : undefined,
        }}>
          <img src={data.profileUrl!} alt={data.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* 이름 */}
      {pos.name && (
        <AbsElem pos={pos.name}>
          <div style={{
            fontFamily: 'var(--card-title-font)',
            fontWeight: 'var(--card-title-weight)',
            color: 'var(--card-primary)',
            fontSize: scaledFs(isPortrait ? '1.3rem' : '1rem', pos.name.fontScale ?? 1),
            whiteSpace: 'nowrap',
          }}>
            {data.name || 'Your Name'}
          </div>
        </AbsElem>
      )}

      {/* 한 줄 소개 */}
      {data.tagline && pos.tagline && (
        <AbsElem pos={pos.tagline}>
          <div style={ts('--card-secondary', '0.7rem', '0.875rem', pos.tagline.fontScale ?? 1)}>
            {data.tagline}
          </div>
        </AbsElem>
      )}

      {/* 소속 */}
      {data.major && pos.major && (
        <AbsElem pos={pos.major}>
          <div style={{ ...ts('--card-accent', '0.6rem', '0.75rem', pos.major.fontScale ?? 1), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {data.major}
          </div>
        </AbsElem>
      )}

      {/* 이메일 (개별) */}
      {data.email && pos.email && (
        <AbsElem pos={pos.email}>
          <span style={linkStyle(pos.email.fontScale ?? 1)}>
            <Mail size={9} />{data.email}
          </span>
        </AbsElem>
      )}

      {/* 전화 (개별) */}
      {data.phone && pos.phone && (
        <AbsElem pos={pos.phone}>
          <span style={linkStyle(pos.phone.fontScale ?? 1)}>
            <Phone size={9} />{data.phone}
          </span>
        </AbsElem>
      )}

      {/* 인스타그램 (개별) */}
      {data.links?.instagram && pos.instagram && (
        <AbsElem pos={pos.instagram}>
          <span style={linkStyle(pos.instagram.fontScale ?? 1)}>
            <IgIcon size={9} />{data.links.instagram}
          </span>
        </AbsElem>
      )}

      {/* 깃허브 (개별) */}
      {data.links?.github && pos.github && (
        <AbsElem pos={pos.github}>
          <span style={linkStyle(pos.github.fontScale ?? 1)}>
            <GhIcon size={9} />{data.links.github}
          </span>
        </AbsElem>
      )}

      {/* 웹사이트 (개별) */}
      {data.links?.website && pos.website && (
        <AbsElem pos={pos.website}>
          <span style={linkStyle(pos.website.fontScale ?? 1)}>
            <Globe size={9} />{data.links.website}
          </span>
        </AbsElem>
      )}

      {/* 링크드인 (개별) */}
      {data.links?.linkedin && pos.linkedin && (
        <AbsElem pos={pos.linkedin}>
          <span style={linkStyle(pos.linkedin.fontScale ?? 1)}>
            <LiIcon size={9} />{data.links.linkedin}
          </span>
        </AbsElem>
      )}

      {/* 구글 드라이브 (개별) */}
      {data.links?.google_drive && pos.google_drive && (
        <AbsElem pos={pos.google_drive}>
          <span style={linkStyle(pos.google_drive.fontScale ?? 1)}>
            <HardDrive size={9} />{data.links.google_drive}
          </span>
        </AbsElem>
      )}
    </div>
  );
}

/**
 * BusinessCard 메인 컴포넌트
 *
 * - landscape: 9:5 비율, 최대 너비 540px
 * - portrait:  5:9 비율, 최대 너비 300px
 */
export function BusinessCard({ theme, data, className, style }: Props) {
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';

  return (
    <div
      className={`mx-auto w-full overflow-hidden rounded-2xl border shadow-md ${className ?? ''}`}
      style={{
        aspectRatio: isPortrait ? '5 / 9' : '9 / 5',
        maxWidth: isPortrait ? '300px' : '540px',
        position: 'relative',
        borderColor: 'var(--card-border, #e2e8f0)',
        ...style,
      }}
    >
      <PositionedView theme={theme} data={data} />

      {/* 스티커 레이어 */}
      {(theme.stickers ?? [])
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((sticker) => (
          <div
            key={sticker.id}
            style={{
              position: 'absolute',
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
              width: `${sticker.width}%`,
              aspectRatio: sticker.type === 'emoji' ? '1' : undefined,
              containerType: sticker.type === 'emoji' ? 'inline-size' as const : undefined,
              opacity: sticker.opacity,
              zIndex: 10 + sticker.zIndex,
              pointerEvents: 'none',
            }}
          >
            {sticker.type === 'emoji' ? (
              <div style={{
                fontSize: '80cqw', lineHeight: 1, textAlign: 'center',
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {sticker.src}
              </div>
            ) : (
              <img src={sticker.src} alt="" style={{ width: '100%', display: 'block' }} />
            )}
          </div>
        ))}
    </div>
  );
}

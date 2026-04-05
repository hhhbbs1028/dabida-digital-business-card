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
import { Instagram, Github, Globe } from "lucide-react";
import type { CardTheme, CardContentTokens, ElementPosition } from '../../theme/types';
import { resolvePositions } from '../../theme/defaultPositions';
import { applyThemeToStyle } from '../../theme/applyTheme';

type Props = {
  theme: CardTheme;
  data: CardContentTokens;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * 프로필 이미지 컴포넌트
 */
function ProfileImage({
  url,
  shape,
  alt,
  size = '4rem',
}: {
  url?: string;
  shape: CardTheme['style']['profileShape'];
  alt: string;
  size?: string;
}) {
  if (shape === 'none' || !url) {
    return null;
  }

  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
      ? 'rounded-xl'
      : '';

  return (
    <img
      src={url}
      alt={alt}
      className={`object-cover shrink-0 ${shapeClass}`}
      style={{ width: size, height: size }}
    />
  );
}

// ============================================================================
// PositionedView — elementPositions가 저장된 카드의 정적 뷰 렌더러
// ============================================================================

function AbsElem({
  pos,
  children,
}: {
  pos: ElementPosition;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        opacity: pos.opacity ?? 1,
        zIndex: pos.zIndex != null ? pos.zIndex : undefined,
      }}
    >
      {children}
    </div>
  );
}

function PositionedView({ theme, data }: Props) {
  const bgStyle = applyThemeToStyle(theme);
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';
  const hasProfile = !!data.profileUrl && theme.style.profileShape !== 'none';
  // 저장된 위치가 없으면 기본 위치로 대체 → CardCanvas와 동일한 좌표 사용
  const pos = resolvePositions(theme.elementPositions, theme.layoutId, orientation, hasProfile);
  const { profileShape } = theme.style;

  const shapeRadius =
    profileShape === 'circle' ? '50%' : profileShape === 'rounded' ? '12px' : '0';

  const scaledFs = (fs: string, scale: number) =>
    scale === 1 ? fs : `calc(${fs} * ${scale})`;

  const ts = (colorVar: string, fs: string, fsP?: string, scale = 1) => ({
    fontFamily: 'var(--card-body-font)',
    fontWeight: 'var(--card-body-weight)',
    color: `var(${colorVar})`,
    fontSize: scaledFs(isPortrait ? (fsP ?? fs) : fs, scale),
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div className="absolute inset-0" style={bgStyle}>
      {/* 프로필 */}
      {hasProfile && pos.profile && (
        <div
          style={{
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
          }}
        >
          <img
            src={data.profileUrl!}
            alt={data.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
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
          <div style={ts('--card-secondary', '0.7rem', '0.875rem', pos.tagline.fontScale ?? 1)}>{data.tagline}</div>
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

      {/* 연락처 */}
      {(data.email || data.phone) && pos.contact && (
        <AbsElem pos={pos.contact}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {data.email && <span style={ts('--card-text', '0.58rem', '0.7rem', pos.contact.fontScale ?? 1)}>{data.email}</span>}
            {data.phone && <span style={ts('--card-text', '0.58rem', '0.7rem', pos.contact.fontScale ?? 1)}>{data.phone}</span>}
          </div>
        </AbsElem>
      )}

      {/* 링크 */}
      {(data.links?.instagram || data.links?.github || data.links?.website) && pos.links && (
        <AbsElem pos={pos.links}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {data.links.instagram && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', pos.links.fontScale ?? 1) }}>
                <Instagram size={9} />{data.links.instagram}
              </span>
            )}
            {data.links.github && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', pos.links.fontScale ?? 1) }}>
                <Github size={9} />{data.links.github}
              </span>
            )}
            {data.links.website && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-text', '0.58rem', '0.7rem', pos.links.fontScale ?? 1) }}>
                <Globe size={9} />{data.links.website}
              </span>
            )}
          </div>
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

      {/* 스티커 레이어 — 렌더링 경로와 무관하게 항상 최상단에 표시 */}
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
                fontSize: '80cqw',
                lineHeight: 1,
                textAlign: 'center',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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

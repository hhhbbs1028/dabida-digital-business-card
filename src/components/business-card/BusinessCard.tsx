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
import type { CardTheme, CardContentTokens, LayoutId, ElementPosition } from '../../theme/types';
import { applyThemeToStyle } from '../../theme/applyTheme';

type Props = {
  theme: CardTheme;
  data: CardContentTokens;
  className?: string;
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

/**
 * Minimal Layout (minimal_01) — 가로 방향
 */
function MinimalLandscape({ theme, data }: Props) {
  const style = applyThemeToStyle(theme);
  const { profileShape } = theme.style;

  return (
    <div
      className="absolute inset-0 flex items-center"
      style={{
        ...style,
        borderColor: 'var(--card-border)',
        padding: 'var(--card-spacing-card)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {/* 프로필 (있는 경우) */}
      {profileShape !== 'none' && data.profileUrl && (
        <div className="shrink-0 mr-4">
          <ProfileImage url={data.profileUrl} shape={profileShape} alt={data.name} size="4.5rem" />
        </div>
      )}

      {/* 텍스트 영역 */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        {/* 이름 */}
        <div
          style={{
            fontFamily: 'var(--card-title-font)',
            fontWeight: 'var(--card-title-weight)',
            color: 'var(--card-primary)',
            fontSize: '1.25rem',
            lineHeight: '1.5rem',
          }}
        >
          {data.name || 'Your Name'}
        </div>

        {/* 한 줄 소개 */}
        {data.tagline && (
          <div
            style={{
              fontFamily: 'var(--card-body-font)',
              fontWeight: 'var(--card-body-weight)',
              color: 'var(--card-secondary)',
              fontSize: '0.75rem',
              lineHeight: '1rem',
            }}
          >
            {data.tagline}
          </div>
        )}

        {/* 소속 */}
        {data.major && (
          <div
            style={{
              fontFamily: 'var(--card-body-font)',
              fontWeight: 'var(--card-body-weight)',
              color: 'var(--card-accent)',
              fontSize: '0.65rem',
              lineHeight: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {data.major}
          </div>
        )}

        {/* 연락처 + 링크 */}
        <div
          className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1"
          style={{
            fontFamily: 'var(--card-body-font)',
            fontWeight: 'var(--card-body-weight)',
            color: 'var(--card-border)',
            fontSize: '0.6rem',
            lineHeight: '0.875rem',
          }}
        >
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.links?.instagram && (
            <span className="flex items-center gap-0.5">
              <Instagram size={9} />{data.links.instagram}
            </span>
          )}
          {data.links?.github && (
            <span className="flex items-center gap-0.5">
              <Github size={9} />{data.links.github}
            </span>
          )}
          {data.links?.website && (
            <span className="flex items-center gap-0.5">
              <Globe size={9} />{data.links.website}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal Layout (minimal_01) — 세로 방향
 */
function MinimalPortrait({ theme, data }: Props) {
  const style = applyThemeToStyle(theme);
  const { profileShape } = theme.style;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
      style={{
        ...style,
        borderColor: 'var(--card-border)',
        padding: 'var(--card-spacing-card)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {profileShape !== 'none' && data.profileUrl && (
        <ProfileImage url={data.profileUrl} shape={profileShape} alt={data.name} size="5rem" />
      )}

      <div
        className="text-center"
        style={{
          fontFamily: 'var(--card-title-font)',
          fontWeight: 'var(--card-title-weight)',
          color: 'var(--card-primary)',
          fontSize: '1.5rem',
          lineHeight: '1.75rem',
        }}
      >
        {data.name || 'Your Name'}
      </div>

      {data.tagline && (
        <div
          className="text-center"
          style={{
            fontFamily: 'var(--card-body-font)',
            fontWeight: 'var(--card-body-weight)',
            color: 'var(--card-secondary)',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
          }}
        >
          {data.tagline}
        </div>
      )}

      {data.major && (
        <div
          className="text-center"
          style={{
            fontFamily: 'var(--card-body-font)',
            fontWeight: 'var(--card-body-weight)',
            color: 'var(--card-accent)',
            fontSize: '0.75rem',
            lineHeight: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {data.major}
        </div>
      )}

      <div
        className="flex flex-col items-center gap-y-0.5"
        style={{
          fontFamily: 'var(--card-body-font)',
          fontWeight: 'var(--card-body-weight)',
          color: 'var(--card-border)',
          fontSize: '0.75rem',
          lineHeight: '1rem',
        }}
      >
        {data.email && <span>{data.email}</span>}
        {data.phone && <span>{data.phone}</span>}
        {data.links?.instagram && (
          <span className="flex items-center gap-1"><Instagram size={11} />{data.links.instagram}</span>
        )}
        {data.links?.github && (
          <span className="flex items-center gap-1"><Github size={11} />{data.links.github}</span>
        )}
        {data.links?.website && (
          <span className="flex items-center gap-1"><Globe size={11} />{data.links.website}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Split Layout (split_01) — 가로 방향
 */
function SplitLandscape({ theme, data }: Props) {
  const style = applyThemeToStyle(theme);
  const { profileShape } = theme.style;

  return (
    <div
      className="absolute inset-0 flex items-stretch"
      style={{
        ...style,
        borderColor: 'var(--card-border)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {/* 좌측: 프로필/소속 */}
      <div
        className="flex flex-none flex-col items-center justify-center px-4 py-5 rounded-l-[inherit]"
        style={{
          backgroundColor: 'var(--card-primary)',
          color: '#ffffff',
          minWidth: '5.5rem',
          gap: 'var(--card-spacing-element)',
        }}
      >
        {data.profileUrl ? (
          <ProfileImage url={data.profileUrl} shape={profileShape} alt={data.name} size="3.5rem" />
        ) : (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: '3.5rem',
              height: '3.5rem',
              backgroundColor: 'var(--card-accent)',
              color: '#ffffff',
              fontFamily: 'var(--card-title-font)',
              fontWeight: 'var(--card-title-weight)',
              fontSize: '1.25rem',
            }}
          >
            {data.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        {data.major && (
          <div
            className="text-center"
            style={{
              fontFamily: 'var(--card-body-font)',
              fontWeight: 'var(--card-body-weight)',
              fontSize: '0.6rem',
              lineHeight: '0.875rem',
              opacity: 0.9,
            }}
          >
            {data.major}
          </div>
        )}
      </div>

      {/* 우측: 정보 */}
      <div
        className="flex min-w-0 flex-1 flex-col justify-center gap-1.5"
        style={{ padding: 'var(--card-spacing-card)' }}
      >
        <div
          style={{
            fontFamily: 'var(--card-title-font)',
            fontWeight: 'var(--card-title-weight)',
            color: 'var(--card-primary)',
            fontSize: '1rem',
            lineHeight: '1.4rem',
          }}
        >
          {data.name || 'Your Name'}
        </div>

        {data.tagline && (
          <div
            style={{
              fontFamily: 'var(--card-body-font)',
              fontWeight: 'var(--card-body-weight)',
              color: 'var(--card-accent)',
              fontSize: '0.75rem',
              lineHeight: '1rem',
            }}
          >
            {data.tagline}
          </div>
        )}

        <div
          className="flex flex-col gap-y-0.5 mt-1"
          style={{
            fontFamily: 'var(--card-body-font)',
            fontWeight: 'var(--card-body-weight)',
            color: 'var(--card-secondary)',
            fontSize: '0.6rem',
            lineHeight: '0.875rem',
          }}
        >
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.links?.instagram && (
            <span className="flex items-center gap-1"><Instagram size={9} />{data.links.instagram}</span>
          )}
          {data.links?.github && (
            <span className="flex items-center gap-1"><Github size={9} />{data.links.github}</span>
          )}
          {data.links?.website && (
            <span className="flex items-center gap-1"><Globe size={9} />{data.links.website}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Split Layout (split_01) — 세로 방향
 */
function SplitPortrait({ theme, data }: Props) {
  const style = applyThemeToStyle(theme);
  const { profileShape } = theme.style;

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        ...style,
        borderColor: 'var(--card-border)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      {/* 상단: 프로필/소속 */}
      <div
        className="flex flex-none flex-col items-center justify-center px-4 py-5 rounded-t-[inherit]"
        style={{
          backgroundColor: 'var(--card-primary)',
          color: '#ffffff',
          flex: '0 0 45%',
          gap: 'var(--card-spacing-element)',
        }}
      >
        {data.profileUrl ? (
          <ProfileImage url={data.profileUrl} shape={profileShape} alt={data.name} size="5rem" />
        ) : (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: '5rem',
              height: '5rem',
              backgroundColor: 'var(--card-accent)',
              color: '#ffffff',
              fontFamily: 'var(--card-title-font)',
              fontWeight: 'var(--card-title-weight)',
              fontSize: '2rem',
            }}
          >
            {data.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        {data.major && (
          <div
            style={{
              fontFamily: 'var(--card-body-font)',
              fontWeight: 'var(--card-body-weight)',
              fontSize: '0.75rem',
              lineHeight: '1rem',
              opacity: 0.9,
            }}
          >
            {data.major}
          </div>
        )}
      </div>

      {/* 하단: 정보 */}
      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2"
        style={{ padding: 'var(--card-spacing-card)' }}
      >
        <div
          className="text-center"
          style={{
            fontFamily: 'var(--card-title-font)',
            fontWeight: 'var(--card-title-weight)',
            color: 'var(--card-primary)',
            fontSize: '1.25rem',
            lineHeight: '1.5rem',
          }}
        >
          {data.name || 'Your Name'}
        </div>

        {data.tagline && (
          <div
            className="text-center"
            style={{
              fontFamily: 'var(--card-body-font)',
              fontWeight: 'var(--card-body-weight)',
              color: 'var(--card-accent)',
              fontSize: '0.75rem',
              lineHeight: '1rem',
            }}
          >
            {data.tagline}
          </div>
        )}

        <div
          className="flex flex-col items-center gap-y-0.5 mt-1"
          style={{
            fontFamily: 'var(--card-body-font)',
            fontWeight: 'var(--card-body-weight)',
            color: 'var(--card-secondary)',
            fontSize: '0.65rem',
            lineHeight: '0.875rem',
          }}
        >
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.links?.instagram && (
            <span className="flex items-center gap-1"><Instagram size={10} />{data.links.instagram}</span>
          )}
          {data.links?.github && (
            <span className="flex items-center gap-1"><Github size={10} />{data.links.github}</span>
          )}
          {data.links?.website && (
            <span className="flex items-center gap-1"><Globe size={10} />{data.links.website}</span>
          )}
        </div>
      </div>
    </div>
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
      }}
    >
      {children}
    </div>
  );
}

function PositionedView({ theme, data }: Props) {
  const bgStyle = applyThemeToStyle(theme);
  const pos = theme.elementPositions!;
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';
  const hasProfile = !!data.profileUrl && theme.style.profileShape !== 'none';
  const { profileShape } = theme.style;

  const shapeRadius =
    profileShape === 'circle' ? '50%' : profileShape === 'rounded' ? '12px' : '0';

  const ts = (colorVar: string, fs: string, fsP?: string) => ({
    fontFamily: 'var(--card-body-font)',
    fontWeight: 'var(--card-body-weight)',
    color: `var(${colorVar})`,
    fontSize: isPortrait ? (fsP ?? fs) : fs,
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
            fontSize: isPortrait ? '1.3rem' : '1rem',
            whiteSpace: 'nowrap',
          }}>
            {data.name || 'Your Name'}
          </div>
        </AbsElem>
      )}

      {/* 한 줄 소개 */}
      {data.tagline && pos.tagline && (
        <AbsElem pos={pos.tagline}>
          <div style={ts('--card-secondary', '0.7rem', '0.875rem')}>{data.tagline}</div>
        </AbsElem>
      )}

      {/* 소속 */}
      {data.major && pos.major && (
        <AbsElem pos={pos.major}>
          <div style={{ ...ts('--card-accent', '0.6rem', '0.75rem'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {data.major}
          </div>
        </AbsElem>
      )}

      {/* 연락처 */}
      {(data.email || data.phone) && pos.contact && (
        <AbsElem pos={pos.contact}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {data.email && <span style={ts('--card-border', '0.58rem', '0.7rem')}>{data.email}</span>}
            {data.phone && <span style={ts('--card-border', '0.58rem', '0.7rem')}>{data.phone}</span>}
          </div>
        </AbsElem>
      )}

      {/* 링크 */}
      {(data.links?.instagram || data.links?.github || data.links?.website) && pos.links && (
        <AbsElem pos={pos.links}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {data.links.instagram && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-border', '0.58rem', '0.7rem') }}>
                <Instagram size={9} />{data.links.instagram}
              </span>
            )}
            {data.links.github && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-border', '0.58rem', '0.7rem') }}>
                <Github size={9} />{data.links.github}
              </span>
            )}
            {data.links.website && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', ...ts('--card-border', '0.58rem', '0.7rem') }}>
                <Globe size={9} />{data.links.website}
              </span>
            )}
          </div>
        </AbsElem>
      )}
    </div>
  );
}

// 레이아웃 × 방향 조합
type LayoutKey = `${LayoutId}:${'landscape' | 'portrait'}`;
const LAYOUT_MAP: Record<LayoutKey, React.ComponentType<Props>> = {
  'minimal_01:landscape': MinimalLandscape,
  'minimal_01:portrait': MinimalPortrait,
  'split_01:landscape': SplitLandscape,
  'split_01:portrait': SplitPortrait,
};

/**
 * BusinessCard 메인 컴포넌트
 *
 * - landscape: 9:5 비율, 최대 너비 540px
 * - portrait:  5:9 비율, 최대 너비 300px
 */
export function BusinessCard({ theme, data, className }: Props) {
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';

  // elementPositions가 저장된 경우 → 절대 위치 기반 뷰
  const hasCustomPositions =
    theme.elementPositions && Object.keys(theme.elementPositions).length > 0;

  const layoutKey: LayoutKey = `${theme.layoutId}:${orientation}`;
  const LayoutComponent = LAYOUT_MAP[layoutKey] ?? MinimalLandscape;

  return (
    <div
      className={`mx-auto w-full overflow-hidden rounded-2xl border shadow-md ${className ?? ''}`}
      style={{
        aspectRatio: isPortrait ? '5 / 9' : '9 / 5',
        maxWidth: isPortrait ? '300px' : '540px',
        position: 'relative',
        borderColor: 'var(--card-border, #e2e8f0)',
      }}
    >
      {hasCustomPositions
        ? <PositionedView theme={theme} data={data} />
        : <LayoutComponent theme={theme} data={data} />}
    </div>
  );
}

/**
 * BusinessCard Component
 * 
 * 테마 기반 명함 카드 컴포넌트
 * 
 * 설계 원칙:
 * - 레이아웃은 컴포넌트로, 스타일은 CSS Variables로 관리
 * - layoutId에 따라 다른 레이아웃 렌더링
 * - profile shape, background type에 따라 적절히 처리
 * - Tailwind는 구조/간격 담당, 색/폰트/배경은 CSS Variables 담당
 */

import React from 'react';
import { Instagram, Github, Globe } from "lucide-react";
import type { CardTheme, CardContentTokens, LayoutId } from '../../theme/types';
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
}: {
  url?: string;
  shape: CardTheme['style']['profileShape'];
  alt: string;
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
      className={`object-cover ${shapeClass}`}
      style={{
        width: '4rem',
        height: '4rem',
      }}
    />
  );
}

/**
 * Minimal Layout (minimal_01)
 * 
 * 미니멀한 디자인, 프로필 선택적
 */
function MinimalLayout({ theme, data }: Props) {
  const style = applyThemeToStyle(theme);
  const { profileShape } = theme.style;

  return (
    <div
      className="relative mx-auto w-full max-w-sm rounded-2xl border shadow-md"
      style={{
        ...style,
        borderColor: 'var(--card-border)',
        padding: 'var(--card-spacing-card)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      <div className="flex flex-col gap-4">
        {/* 프로필 영역 (있는 경우) */}
        {profileShape !== 'none' && data.profileUrl && (
          <div className="flex justify-center">
            <ProfileImage
              url={data.profileUrl}
              shape={profileShape}
              alt={data.name}
            />
          </div>
        )}

        {/* 이름 */}
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

        {/* 한 줄 소개 */}
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

        {/* 전공/소속 */}
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

        {/* 연락처 */}
        {(data.email || data.phone) && (
          <div
            // className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
            className='flex flex-col items-center gap-y-1'
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
          </div>
        )}

        {/* 링크 */}
        {data.links && (data.links.instagram || data.links.github || data.links.website) && (
          <div
            // className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
            className='flex flex-col items-center gap-y-1'
            style={{
              fontFamily: 'var(--card-body-font)',
              fontWeight: 'var(--card-body-weight)',
              color: 'var(--card-border)',
              fontSize: '0.75rem',
              lineHeight: '1rem',
            }}
          >
              {data.links.instagram && (
                <div className="flex items-center gap-1">
                  <Instagram size={12} />
                  <span>{data.links.instagram}</span>
                </div>
              )}

              {data.links.github && (
                <div className="flex items-center gap-1">
                  <Github size={12} />
                  <span>{data.links.github}</span>
                </div>
              )}

              {data.links.website && (
                <div className="flex items-center gap-1">
                  <Globe size={12} />
                  <span>{data.links.website}</span>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Split Layout (split_01)
 * 
 * 좌우 분할 레이아웃, 프로필 필수
 */
function SplitLayout({ theme, data }: Props) {
  const style = applyThemeToStyle(theme);
  const { profileShape } = theme.style;

  return (
    <div
      className="relative mx-auto w-full max-w-sm rounded-2xl border shadow-md"
      style={{
        ...style,
        borderColor: 'var(--card-border)',
        padding: 'var(--card-spacing-card)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      <div className="flex items-stretch gap-4">
        {/* 좌측: 프로필/소속 영역 */}
        <div
          className="flex flex-none flex-col items-center justify-center rounded-xl px-3 py-4"
          style={{
            backgroundColor: 'var(--card-primary)',
            color: '#ffffff',
            minWidth: '5rem',
            gap: 'var(--card-spacing-element)',
          }}
        >
          {/* 프로필 이미지 */}
          {data.profileUrl ? (
            <ProfileImage url={data.profileUrl} shape={profileShape} alt={data.name} />
          ) : (
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '4rem',
                height: '4rem',
                backgroundColor: 'var(--card-accent)',
                color: '#ffffff',
                fontFamily: 'var(--card-title-font)',
                fontWeight: 'var(--card-title-weight)',
                fontSize: '1.5rem',
              }}
            >
              {data.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          {/* 소속 */}
          {data.major && (
            <div
              className="text-center"
              style={{
                fontFamily: 'var(--card-body-font)',
                fontWeight: 'var(--card-body-weight)',
                fontSize: '0.625rem',
                lineHeight: '0.875rem',
                opacity: 0.9,
              }}
            >
              {data.major}
            </div>
          )}
        </div>

        {/* 우측: 정보 영역 */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          {/* 이름 */}
          <div
            style={{
              fontFamily: 'var(--card-title-font)',
              fontWeight: 'var(--card-title-weight)',
              color: 'var(--card-primary)',
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
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
                color: 'var(--card-accent)',
                fontSize: '0.75rem',
                lineHeight: '1rem',
              }}
            >
              {data.tagline}
            </div>
          )}

          {/* 연락처 */}
          {(data.email || data.phone) && (
            <div
              // className="flex flex-wrap gap-x-3 gap-y-1"
              className='flex flex-col items-center gap-y-1'
              style={{
                fontFamily: 'var(--card-body-font)',
                fontWeight: 'var(--card-body-weight)',
                color: 'var(--card-secondary)',
                fontSize: '0.625rem',
                lineHeight: '0.875rem',
              }}
            >
              {data.email && <span>{data.email}</span>}
              {data.phone && <span>{data.phone}</span>}
            </div>
          )}

          {/* 링크 */}
          {data.links && (data.links.instagram || data.links.github || data.links.website) && (
            <div
              // className="flex flex-wrap gap-x-3 gap-y-1"
              className='flex flex-col items-center gap-y-1'
              style={{
                fontFamily: 'var(--card-body-font)',
                fontWeight: 'var(--card-body-weight)',
                color: 'var(--card-accent)',
                fontSize: '0.625rem',
                lineHeight: '0.875rem',
              }}
            >
              {data.links.instagram && (
                <div className="flex items-center gap-1">
                  <Instagram size={12} />
                  <span>{data.links.instagram}</span>
                </div>
              )}

              {data.links.github && (
                <div className="flex items-center gap-1">
                  <Github size={12} />
                  <span>{data.links.github}</span>
                </div>
              )}

              {data.links.website && (
                <div className="flex items-center gap-1">
                  <Globe size={12} />
                  <span>{data.links.website}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * BusinessCard 메인 컴포넌트
 * 
 * layoutId에 따라 적절한 레이아웃 렌더링
 */
export function BusinessCard({ theme, data, className }: Props) {
  const layoutComponents: Record<LayoutId, React.ComponentType<Props>> = {
    minimal_01: MinimalLayout,
    split_01: SplitLayout,
  };

  const LayoutComponent = layoutComponents[theme.layoutId] || MinimalLayout;

  return (
    <div className={className}>
      <LayoutComponent theme={theme} data={data} />
    </div>
  );
}


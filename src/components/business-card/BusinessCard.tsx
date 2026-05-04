/**
 * BusinessCard Component
 *
 * 테마 기반 명함 카드 컴포넌트
 *
 * 설계 원칙:
 * - 카드 크기는 항상 9:5 (landscape) 또는 5:9 (portrait) 고정 비율
 * - 레이아웃은 절대 좌표(elementPositions) 기반, 스타일은 CSS Variables로 관리
 * - Tailwind는 구조/간격 담당, 색/폰트/배경은 CSS Variables 담당
 *
 * 텍스트 요소(이름·태그라인·소속·이메일·전화·5종 링크)의 정의는
 * [cardElements.tsx](./cardElements.tsx)에 모여 있다. 이 파일은 절대 위치
 * 래퍼(`AbsElem`)와 프로필·스티커 정적 렌더만 담당한다.
 */

import React, { useRef } from 'react';
import type { CardTheme, CardContentTokens, ElementPosition } from '../../theme/types';
import { resolvePositions } from '../../theme/defaultPositions';
import { applyThemeToStyle } from '../../theme/applyTheme';
import { getRenderedLeftX, makeRenderHelpers } from '../../theme/renderHelpers';
import { useTextWidthPct } from './useTextWidthPct';
import {
  TEXT_ELEMENTS,
  shouldRenderInStatic,
  resolveElementValue,
} from './cardElements';

type Props = {
  theme: CardTheme;
  data: CardContentTokens;
  className?: string;
  style?: React.CSSProperties;
};

// ============================================================================
// PositionedView — elementPositions가 저장된 카드의 정적 뷰 렌더러
// ============================================================================

/**
 * 좌측 정렬 텍스트 래퍼.
 * - 저장 좌표(pos.x)는 항상 요소 중심(centerX) 기준 — 변경하지 않는다.
 * - 렌더링 시점에만 leftX = clamp(centerX − widthPct/2, 0, 95) 로 변환.
 * - widthPct 는 ResizeObserver 로 실측한 실제 텍스트 폭(컨테이너 폭 대비 %).
 */
function LeftAnchoredText({
  pos,
  containerRef,
  children,
}: {
  pos: ElementPosition;
  containerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const [ref, widthPct] = useTextWidthPct(containerRef);
  const leftX = getRenderedLeftX(pos.x, widthPct);
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: `${leftX}%`,
        top: `${pos.y}%`,
        transform: 'translateY(-50%)',
        opacity: pos.opacity ?? 1,
        zIndex: pos.zIndex != null ? pos.zIndex : undefined,
      }}
    >
      {children}
    </div>
  );
}

function PositionedView({ theme, data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgStyle = applyThemeToStyle(theme);
  const orientation = theme.orientation ?? 'landscape';
  const isPortrait = orientation === 'portrait';
  const hasProfile = !!data.profileUrl && theme.style.profileShape !== 'none';
  const pos = resolvePositions(theme.elementPositions, orientation, hasProfile);
  const { profileShape } = theme.style;
  const shapeRadius = profileShape === 'circle' ? '50%' : profileShape === 'rounded' ? '12px' : '0';
  const helpers = makeRenderHelpers(isPortrait);

  return (
    <div ref={containerRef} className="absolute inset-0" style={bgStyle}>
      {/* 프로필 — 이미지 요소는 기존처럼 center 기준 렌더 유지 */}
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

      {/* 텍스트 요소 — left 기준 렌더로 좌측 정렬되어 보이도록 변환 */}
      {TEXT_ELEMENTS.map((def) => {
        const elemPos = pos[def.key];
        if (!elemPos) return null;
        if (!shouldRenderInStatic(def, data)) return null;
        const value = resolveElementValue(def, data, false);
        return (
          <LeftAnchoredText key={def.key} pos={elemPos} containerRef={containerRef}>
            {def.render({
              helpers,
              fontScale: elemPos.fontScale ?? 1,
              value,
              isEditing: false,
            })}
          </LeftAnchoredText>
        );
      })}
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
        // cqw 기반 폰트·아이콘 단위가 카드 폭을 참조하도록 컨테이너 쿼리 컨텍스트 형성.
        containerType: 'inline-size',
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
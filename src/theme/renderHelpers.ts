/**
 * renderHelpers
 *
 * 명함 렌더 2곳(BusinessCard = 정적 뷰, CardCanvas = 편집 캔버스)이 공유하는
 * 폰트 크기·텍스트 스타일·링크 스타일·아이콘 크기 계산 헬퍼.
 *
 * ## 단위 정책 — `cqw` (컨테이너 쿼리 너비) 기반
 *
 * 폰트와 아이콘은 카드 컨테이너 너비에 비례한 `cqw` 단위로 계산된다.
 * 호출 측은 기존과 동일하게 rem 문자열을 넘기지만, 내부에서 BusinessCard
 * 기준 카드 폭(portrait 300px / landscape 540px)에 대한 비율로 환산해
 * `cqw` 값으로 출력한다.
 *
 * 이렇게 하면 카드 컨테이너 폭이 어떻게 계산되든(CardEditor 미리보기·
 * FullscreenCardEditor·썸네일) **카드 폭 대비 폰트·아이콘 비율이 항상
 * 동일**하다. 진입점별 카드:폰트 비율 divergence가 구조적으로 사라진다.
 *
 * 이 모듈을 사용하는 카드 외곽 div에는 반드시 `containerType: 'inline-size'`
 * 가 적용되어 있어야 한다(BusinessCard.tsx / CardCanvas.tsx).
 *
 * ## 사용법
 *
 *   const { textStyle, linkStyle, nameFontSize, iconSize } = makeRenderHelpers(isPortrait);
 *   // BusinessCard (정적):  linkStyle(scale)
 *   // CardCanvas (편집):    linkStyle(scale, true)   ← pointerEvents: 'none'
 */

import type React from 'react';

// 환산 기준 카드 폭 (BusinessCard 절대 maxWidth와 일치).
const BASE_WIDTH_PORTRAIT_PX = 300;
const BASE_WIDTH_LANDSCAPE_PX = 540;
// 1rem = 16px (html 루트 기본).
const REM_PX = 16;

// 아이콘·gap의 환산 기준 px (BusinessCard 540/300 폭에서 의도된 픽셀 크기).
const ICON_PX = 9;
const LINK_GAP_PX = 3;

/**
 * "0.7rem" 같은 rem 문자열을 카드 폭 기준 cqw 비율로 환산.
 * 카드 폭 540px에서 11.2px → 11.2/540*100 = 2.07cqw.
 *
 * 소수점 4자리 반올림으로 무한 소수 회피(브라우저 round-off 안정화).
 */
function remToCqw(remStr: string, cardWidthPx: number): number {
  const num = parseFloat(remStr);
  const px = num * REM_PX;
  return Math.round((px / cardWidthPx) * 1000000) / 10000;
}

function pxToCqw(px: number, cardWidthPx: number): number {
  return Math.round((px / cardWidthPx) * 1000000) / 10000;
}

export type RenderHelpers = {
  /**
   * orientation 별 base/baseP rem 입력을 카드 폭 기준 cqw로 환산해 반환.
   * scale=1이면 calc() 없이 단순 cqw 값, 아니면 calc(cqw * scale).
   */
  scaledFs: (base: string, baseP: string, scale?: number) => string;

  /** 본문 텍스트용 스타일 — color/font-family/font-weight/font-size/white-space 포함. */
  textStyle: (
    colorVar: string,
    fs: string,
    fsP?: string,
    scale?: number,
    pointerEventsNone?: boolean,
  ) => React.CSSProperties;

  /** 링크·아이콘 동반 텍스트용 스타일 — flex layout + cqw gap + text-color 기본값. */
  linkStyle: (scale?: number, pointerEventsNone?: boolean) => React.CSSProperties;

  /** 이름 필드 전용 font-size — portrait 1.3rem / landscape 1rem 기준. */
  nameFontSize: (scale?: number) => string;

  /** 아이콘 wrapper의 폭/높이 (cqw). 카드 폭에 비례하여 9px 디자인 기준 비율 유지. */
  iconSize: string;
};

export function makeRenderHelpers(isPortrait: boolean): RenderHelpers {
  const cardWidth = isPortrait ? BASE_WIDTH_PORTRAIT_PX : BASE_WIDTH_LANDSCAPE_PX;

  const scaledFs = (base: string, baseP: string, scale = 1): string => {
    const rem = isPortrait ? baseP : base;
    const cqw = remToCqw(rem, cardWidth);
    return scale === 1 ? `${cqw}cqw` : `calc(${cqw}cqw * ${scale})`;
  };

  const textStyle = (
    colorVar: string,
    fs: string,
    fsP?: string,
    scale = 1,
    pointerEventsNone = false,
  ): React.CSSProperties => {
    const style: React.CSSProperties = {
      fontFamily: 'var(--card-body-font)',
      fontWeight: 'var(--card-body-weight)',
      color: `var(${colorVar})`,
      fontSize: scaledFs(fs, fsP ?? fs, scale),
      whiteSpace: 'nowrap',
    };
    if (pointerEventsNone) style.pointerEvents = 'none';
    return style;
  };

  const linkStyle = (scale = 1, pointerEventsNone = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: `${pxToCqw(LINK_GAP_PX, cardWidth)}cqw`,
    ...textStyle('--card-text', '0.58rem', '0.7rem', scale, pointerEventsNone),
  });

  const nameFontSize = (scale = 1): string => scaledFs('1rem', '1.3rem', scale);

  const iconSize = `${pxToCqw(ICON_PX, cardWidth)}cqw`;

  return { scaledFs, textStyle, linkStyle, nameFontSize, iconSize };
}

// ============================================================================
// 좌표 변환 — center 기준 → left 기준 (렌더 전용)
// ============================================================================
//
// ElementPosition.x 는 항상 "요소 중심 %" 의미를 갖는다(드래그·저장 모두 동일).
// 텍스트 요소만 시각적으로 좌측 정렬되어 보이도록 렌더 시점에만 left 좌표로 변환.
//
//   leftX = centerX − widthPct / 2
//
// widthPct 는 ResizeObserver 로 측정한 실제 텍스트 폭(카드 폭 대비 %)이며,
// 측정 전에는 0 으로 시작해 첫 layout effect 에서 즉시 갱신된다.
// 최종 left 값은 카드 안전 영역(0~95%) 으로 clamp.

const RENDERED_LEFT_MAX_PCT = 95;

export function getRenderedLeftX(centerX: number, widthPct: number): number {
  const leftX = centerX - widthPct / 2;
  if (leftX < 0) return 0;
  if (leftX > RENDERED_LEFT_MAX_PCT) return RENDERED_LEFT_MAX_PCT;
  return leftX;
}

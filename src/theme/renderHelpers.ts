/**
 * renderHelpers
 *
 * 명함 렌더 2곳(BusinessCard = 정적 뷰, CardCanvas = 편집 캔버스)이 공유하는
 * 폰트 크기·텍스트 스타일·링크 스타일 계산 헬퍼.
 *
 * 설계 이유:
 *   과거에는 같은 스타일 계산 로직이 두 파일에 중복 구현되어, 한쪽만 수정하면
 *   다른 쪽과 시각적으로 달라 보이는 divergence가 반복 발생했다. 이 모듈에서
 *   일원화하여 새 요소·토큰을 추가할 때 계산식 불일치를 구조적으로 막는다.
 *
 * 사용법:
 *   const { textStyle, linkStyle, nameFontSize } = makeRenderHelpers(isPortrait);
 *   // BusinessCard (정적):  linkStyle(scale)
 *   // CardCanvas (편집):    linkStyle(scale, true)   ← pointerEvents: 'none'
 */

import type React from 'react';

export type RenderHelpers = {
  /** base(landscape)·baseP(portrait) 중 orientation에 맞는 값을 scale 배율로 계산. scale=1이면 calc() 없이 원본 반환. */
  scaledFs: (base: string, baseP: string, scale?: number) => string;

  /** 본문 텍스트용 스타일 — color/font-family/font-weight/font-size/white-space 포함. */
  textStyle: (
    colorVar: string,
    fs: string,
    fsP?: string,
    scale?: number,
    pointerEventsNone?: boolean,
  ) => React.CSSProperties;

  /** 링크·아이콘 동반 텍스트용 스타일 — flex layout + 3px gap + text-color 기본값. */
  linkStyle: (scale?: number, pointerEventsNone?: boolean) => React.CSSProperties;

  /** 이름 필드 전용 font-size — portrait 1.3rem / landscape 1rem 기준. */
  nameFontSize: (scale?: number) => string;
};

export function makeRenderHelpers(isPortrait: boolean): RenderHelpers {
  const scaledFs = (base: string, baseP: string, scale = 1): string => {
    const fs = isPortrait ? baseP : base;
    return scale === 1 ? fs : `calc(${fs} * ${scale})`;
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
    gap: '3px',
    ...textStyle('--card-text', '0.58rem', '0.7rem', scale, pointerEventsNone),
  });

  const nameFontSize = (scale = 1): string => scaledFs('1rem', '1.3rem', scale);

  return { scaledFs, textStyle, linkStyle, nameFontSize };
}
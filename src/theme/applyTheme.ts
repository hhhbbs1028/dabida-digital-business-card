/**
 * Theme 적용 함수
 * 
 * CardTheme을 React.CSSProperties로 변환
 * CSS Variables를 사용하여 동적 스타일 적용
 * 
 * 설계 원칙:
 * - 모든 스타일은 CSS Variables로 관리
 * - 배경 타입(solid/gradient/pattern)에 따라 적절히 처리
 * - Tailwind는 구조/간격 담당, 색/폰트/배경은 CSS Variables 담당
 */

import type { CardTheme } from './types';
import { getGradientPreset, getPatternPreset } from './presets';

/**
 * CardTheme을 React.CSSProperties로 변환
 * 
 * @param theme - 적용할 테마
 * @returns CSS Variables를 포함한 style 객체
 */
export function applyThemeToStyle(theme: CardTheme): React.CSSProperties {
  const { style } = theme;
  const { background } = style;

  // 배경 스타일 결정
  let backgroundStyle: React.CSSProperties = {};
  
  if (background.type === 'solid') {
    backgroundStyle.backgroundColor = background.color;
  } else if (background.type === 'gradient') {
    backgroundStyle.backgroundImage = getGradientPreset(background.presetId);
  } else if (background.type === 'pattern') {
    backgroundStyle.backgroundImage = getPatternPreset(background.patternId);
    backgroundStyle.backgroundRepeat = 'repeat';
    backgroundStyle.backgroundSize = 'auto';
  }

  // CSS Variables 정의
  // 이 변수들은 BusinessCard 컴포넌트 내부에서 사용됨
  return {
    // CSS Variables
    '--card-primary': style.primary,
    '--card-secondary': style.secondary,
    '--card-accent': style.accent,
    '--card-text': style.text,
    '--card-text-muted': style.textMuted,
    '--card-border': style.border,
    '--card-title-font': style.titleFont,
    '--card-body-font': style.bodyFont,
    '--card-title-weight': String(style.titleWeight),
    '--card-body-weight': String(style.bodyWeight),
    '--card-radius': style.borderRadius,
    '--card-spacing-card': style.spacing.card,
    '--card-spacing-section': style.spacing.section,
    '--card-spacing-element': style.spacing.element,
    
    // 배경 스타일 직접 적용
    ...backgroundStyle,
  } as React.CSSProperties;
}

/**
 * CSS Variables를 문자열로 변환 (인라인 스타일용)
 * 
 * @param theme - 적용할 테마
 * @returns CSS Variables 문자열
 */
export function applyThemeToCSSString(theme: CardTheme): string {
  const { style } = theme;
  const { background } = style;

  let backgroundCSS = '';
  if (background.type === 'solid') {
    backgroundCSS = `background-color: ${background.color};`;
  } else if (background.type === 'gradient') {
    backgroundCSS = `background-image: ${getGradientPreset(background.presetId)};`;
  } else if (background.type === 'pattern') {
    backgroundCSS = `background-image: ${getPatternPreset(background.patternId)}; background-repeat: repeat; background-size: auto;`;
  }

  return `
    --card-primary: ${style.primary};
    --card-secondary: ${style.secondary};
    --card-accent: ${style.accent};
    --card-text: ${style.text};
    --card-text-muted: ${style.textMuted};
    --card-border: ${style.border};
    --card-title-font: ${style.titleFont};
    --card-body-font: ${style.bodyFont};
    --card-title-weight: ${style.titleWeight};
    --card-body-weight: ${style.bodyWeight};
    --card-radius: ${style.borderRadius};
    --card-spacing-card: ${style.spacing.card};
    --card-spacing-section: ${style.spacing.section};
    --card-spacing-element: ${style.spacing.element};
    ${backgroundCSS}
  `.trim();
}


/**
 * Theme 병합 함수
 * 
 * 프리셋 + 팔레트 + 폰트 + 오버라이드를 병합하여 최종 CardTheme 생성
 * 
 * 설계 원칙:
 * - 프리셋을 베이스로 하여 오버라이드 적용
 * - DB 저장 시 전체 theme이 아닌 presetId + overrides만 저장
 * - 병합 순서: preset -> palette -> font -> overrides
 */

import type { CardTheme, ThemeOverride, ColorPaletteId, FontSetId } from './types';
import { THEME_PRESETS, COLOR_PALETTES, FONT_SETS } from './presets';

/**
 * 테마 병합
 * 
 * @param presetId - 기본 프리셋 ID
 * @param paletteId - 색상 팔레트 ID (선택적, 프리셋의 색상을 덮어씀)
 * @param fontSetId - 폰트 세트 ID (선택적, 프리셋의 폰트를 덮어씀)
 * @param overrides - 추가 오버라이드 (선택적)
 * @returns 병합된 CardTheme
 */
export function mergeTheme(
  presetId: CardTheme['presetId'],
  paletteId?: ColorPaletteId,
  fontSetId?: FontSetId,
  overrides?: ThemeOverride['style'],
): CardTheme {
  // 1. 프리셋을 베이스로 시작
  const preset = THEME_PRESETS[presetId];
  let mergedStyle = { ...preset };

  // 2. 색상 팔레트 적용 (지정된 경우)
  if (paletteId) {
    const palette = COLOR_PALETTES[paletteId];
    mergedStyle = {
      ...mergedStyle,
      ...palette,
    };
  }

  // 3. 폰트 세트 적용 (지정된 경우)
  if (fontSetId) {
    const fontSet = FONT_SETS[fontSetId];
    mergedStyle = {
      ...mergedStyle,
      ...fontSet,
    };
  }

  // 4. 오버라이드 적용 (가장 마지막, 최우선)
  if (overrides) {
    mergedStyle = {
      ...mergedStyle,
      ...overrides,
      // 중첩된 객체는 별도로 병합
      spacing: {
        ...mergedStyle.spacing,
        ...(overrides.spacing || {}),
      },
    };
  }

  // 레이아웃 ID는 프리셋에서 결정 (v1에서는 프리셋별로 고정)
  // 추후 확장 시 overrides에서 layoutId도 받을 수 있음
  const layoutId: CardTheme['layoutId'] = 
    presetId.includes('minimal') ? 'minimal_01' : 'split_01';

  return {
    layoutId,
    presetId,
    paletteId: paletteId || (presetId.includes('slate') ? 'slate' : 'blue'),
    fontSetId: fontSetId || 'gothic',
    style: mergedStyle,
  };
}

/**
 * 테마 오버라이드에서 최소한의 저장 데이터 추출
 * 
 * DB 저장 시 전체 theme이 아닌 변경된 부분만 저장하기 위함
 * 
 * @param baseTheme - 기본 테마
 * @param currentTheme - 현재 테마
 * @returns 저장할 오버라이드 데이터
 */
export function extractThemeOverrides(
  baseTheme: CardTheme,
  currentTheme: CardTheme,
): ThemeOverride {
  const overrides: ThemeOverride = {};

  // 팔레트 변경 확인
  if (currentTheme.paletteId !== baseTheme.paletteId) {
    overrides.paletteId = currentTheme.paletteId;
  }

  // 폰트 변경 확인
  if (currentTheme.fontSetId !== baseTheme.fontSetId) {
    overrides.fontSetId = currentTheme.fontSetId;
  }

  // 스타일 오버라이드 확인 (프리셋과 다른 부분만)
  const styleOverrides: Partial<CardTheme['style']> = {};
  const baseStyle = baseTheme.style;
  const currentStyle = currentTheme.style;

  // 각 필드 비교
  if (currentStyle.primary !== baseStyle.primary) styleOverrides.primary = currentStyle.primary;
  if (currentStyle.secondary !== baseStyle.secondary) styleOverrides.secondary = currentStyle.secondary;
  if (currentStyle.accent !== baseStyle.accent) styleOverrides.accent = currentStyle.accent;
  if (currentStyle.text !== baseStyle.text) styleOverrides.text = currentStyle.text;
  if (currentStyle.textMuted !== baseStyle.textMuted) styleOverrides.textMuted = currentStyle.textMuted;
  if (currentStyle.border !== baseStyle.border) styleOverrides.border = currentStyle.border;
  if (currentStyle.titleFont !== baseStyle.titleFont) styleOverrides.titleFont = currentStyle.titleFont;
  if (currentStyle.bodyFont !== baseStyle.bodyFont) styleOverrides.bodyFont = currentStyle.bodyFont;
  if (currentStyle.titleWeight !== baseStyle.titleWeight) styleOverrides.titleWeight = currentStyle.titleWeight;
  if (currentStyle.bodyWeight !== baseStyle.bodyWeight) styleOverrides.bodyWeight = currentStyle.bodyWeight;
  if (currentStyle.profileShape !== baseStyle.profileShape) styleOverrides.profileShape = currentStyle.profileShape;
  if (currentStyle.borderRadius !== baseStyle.borderRadius) styleOverrides.borderRadius = currentStyle.borderRadius;
  
  // 배경 비교
  if (JSON.stringify(currentStyle.background) !== JSON.stringify(baseStyle.background)) {
    styleOverrides.background = currentStyle.background;
  }

  // spacing 비교
  if (
    currentStyle.spacing.card !== baseStyle.spacing.card ||
    currentStyle.spacing.section !== baseStyle.spacing.section ||
    currentStyle.spacing.element !== baseStyle.spacing.element
  ) {
    styleOverrides.spacing = currentStyle.spacing;
  }

  if (Object.keys(styleOverrides).length > 0) {
    overrides.style = styleOverrides;
  }

  return overrides;
}

/**
 * 저장된 오버라이드로부터 테마 복원
 * 
 * @param presetId - 기본 프리셋 ID
 * @param overrides - 저장된 오버라이드
 * @returns 복원된 CardTheme
 */
export function restoreThemeFromOverrides(
  presetId: CardTheme['presetId'],
  overrides?: ThemeOverride,
): CardTheme {
  return mergeTheme(
    presetId,
    overrides?.paletteId,
    overrides?.fontSetId,
    overrides?.style,
  );
}


/**
 * Theme 병합 함수
 *
 * 프리셋 + 팔레트 + 폰트 + 오버라이드를 병합하여 최종 CardTheme 생성
 *
 * 설계 원칙:
 * - 프리셋을 베이스로 하여 오버라이드 적용
 * - DB 저장 시 전체 theme이 아닌 presetId + overrides만 저장
 * - 병합 순서: preset → palette → font → overrides
 */

import type { CardTheme, ThemeOverride, ColorPaletteId, FontSetId } from './types';
import {
  THEME_PRESETS,
  COLOR_PALETTES,
  FONT_SETS,
  PRESET_LAYOUT_MAP,
  PRESET_PALETTE_MAP,
  PRESET_FONT_MAP,
} from './presets';

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
    mergedStyle = { ...mergedStyle, ...palette };
  }

  // 3. 폰트 세트 적용 (지정된 경우)
  if (fontSetId) {
    const fontSet = FONT_SETS[fontSetId];
    mergedStyle = { ...mergedStyle, ...fontSet };
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

  return {
    layoutId: PRESET_LAYOUT_MAP[presetId],
    presetId,
    paletteId: paletteId ?? PRESET_PALETTE_MAP[presetId],
    fontSetId: fontSetId ?? PRESET_FONT_MAP[presetId],
    style: mergedStyle,
  };
}

/**
 * 테마 오버라이드에서 최소한의 저장 데이터 추출
 *
 * DB 저장 시 전체 theme이 아닌 변경된 부분만 저장하기 위함
 */
export function extractThemeOverrides(
  baseTheme: CardTheme,
  currentTheme: CardTheme,
): ThemeOverride {
  const overrides: ThemeOverride = {};

  if (currentTheme.paletteId !== baseTheme.paletteId) {
    overrides.paletteId = currentTheme.paletteId;
  }

  if (currentTheme.fontSetId !== baseTheme.fontSetId) {
    overrides.fontSetId = currentTheme.fontSetId;
  }

  const styleOverrides: Partial<CardTheme['style']> = {};
  const baseStyle = baseTheme.style;
  const currentStyle = currentTheme.style;

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

  if (JSON.stringify(currentStyle.background) !== JSON.stringify(baseStyle.background)) {
    styleOverrides.background = currentStyle.background;
  }

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

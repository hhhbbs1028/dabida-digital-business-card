/**
 * Theme Presets
 * 
 * 미리 정의된 테마 프리셋, 색상 팔레트, 폰트 세트, 배경 프리셋
 * 
 * 설계 원칙:
 * - 프리셋은 "레이아웃 + 색상 + 폰트 + 배경" 조합
 * - 새로운 프리셋 추가는 이 파일에만 추가하면 됨
 * - 각 프리셋은 CardStyleTokens 형태로 정의
 */

import type {
  ThemePresetId,
  ColorPaletteId,
  FontSetId,
  LayoutId,
  CardStyleTokens,
  BackgroundToken,
} from './types';

// ============================================================================
// Color Palettes
// ============================================================================
/**
 * 색상 팔레트 정의
 * 각 팔레트는 primary, secondary, accent, text, muted, border 색상을 포함
 */
export const COLOR_PALETTES: Record<ColorPaletteId, {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
}> = {
  slate: {
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#64748b',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
  },
  blue: {
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#dbeafe',
  },
  purple: {
    primary: '#6b21a8',
    secondary: '#9333ea',
    accent: '#a855f7',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#f3e8ff',
  },
  emerald: {
    primary: '#065f46',
    secondary: '#10b981',
    accent: '#34d399',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#d1fae5',
  },
  orange: {
    primary: '#c2410c',
    secondary: '#f97316',
    accent: '#fb923c',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#fed7aa',
  },
  rose: {
    primary: '#be123c',
    secondary: '#f43f5e',
    accent: '#fb7185',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#ffe4e6',
  },
  indigo: {
    primary: '#4338ca',
    secondary: '#6366f1',
    accent: '#818cf8',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e0e7ff',
  },
  teal: {
    primary: '#0f766e',
    secondary: '#14b8a6',
    accent: '#5eead4',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#ccfbf1',
  },
  amber: {
    primary: '#b45309',
    secondary: '#f59e0b',
    accent: '#fbbf24',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#fef3c7',
  },
  pink: {
    primary: '#9f1239',
    secondary: '#ec4899',
    accent: '#f472b6',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#fce7f3',
  },
};

// ============================================================================
// Font Sets
// ============================================================================
/**
 * 폰트 세트 정의
 * 고딕/명조/라운드 세 가지 스타일
 * 각 세트는 title/body 폰트와 weight를 포함
 */
export const FONT_SETS: Record<FontSetId, {
  titleFont: string;
  bodyFont: string;
  titleWeight: number | string;
  bodyWeight: number | string;
}> = {
  gothic: {
    titleFont: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
    bodyFont: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
    titleWeight: 700,
    bodyWeight: 400,
  },
  myeongjo: {
    titleFont: '"Noto Serif KR", "Times New Roman", serif',
    bodyFont: '"Noto Serif KR", "Times New Roman", serif',
    titleWeight: 600,
    bodyWeight: 400,
  },
  round: {
    titleFont: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
    bodyFont: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
    titleWeight: 600,
    bodyWeight: 400,
  },
};

// ============================================================================
// Background Presets
// ============================================================================
/**
 * 배경 프리셋
 * gradient와 pattern 프리셋 정의
 */

// Gradient 프리셋 (CSS linear-gradient 문자열)
export const GRADIENT_PRESETS: Record<string, string> = {
  gradient_blue_purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradient_pink_orange: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  gradient_teal_cyan: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  gradient_purple_pink: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  gradient_warm_sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  gradient_cool_ocean: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
};

// Pattern 프리셋 (CSS background-image 또는 SVG data URI)
export const PATTERN_PRESETS: Record<string, string> = {
  pattern_dots: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.4'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-2zm0 0v2H0v-2h20z'/%3E%3C/g%3E%3C/svg%3E")`,
  pattern_grid: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  pattern_lines: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.2'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
  pattern_circles: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  pattern_hexagons: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e2e8f0' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  pattern_waves: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e2e8f0' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
};

// ============================================================================
// Theme Presets
// ============================================================================
/**
 * 테마 프리셋 정의
 * 각 프리셋은 레이아웃 + 색상 팔레트 + 폰트 세트 + 배경 조합
 */
export const THEME_PRESETS: Record<ThemePresetId, CardStyleTokens> = {
  // 미니멀 라이트
  minimal_light: {
    ...COLOR_PALETTES.slate,
    ...FONT_SETS.gothic,
    background: { type: 'solid', color: '#ffffff' },
    profileShape: 'none',
    borderRadius: '1rem',
    spacing: {
      card: '1.5rem',
      section: '1rem',
      element: '0.75rem',
    },
  },

  // 미니멀 다크
  minimal_dark: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    accent: '#94a3b8',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    ...FONT_SETS.gothic,
    background: { type: 'solid', color: '#0f172a' },
    profileShape: 'none',
    borderRadius: '1rem',
    spacing: {
      card: '1.5rem',
      section: '1rem',
      element: '0.75rem',
    },
  },

  // 모던 그라데이션
  modern_gradient: {
    ...COLOR_PALETTES.blue,
    ...FONT_SETS.gothic,
    background: { type: 'gradient', presetId: 'gradient_blue_purple' },
    profileShape: 'circle',
    borderRadius: '1.5rem',
    spacing: {
      card: '2rem',
      section: '1.25rem',
      element: '1rem',
    },
  },

  // 캠퍼스 바이브런트
  campus_vibrant: {
    ...COLOR_PALETTES.orange,
    ...FONT_SETS.round,
    background: { type: 'gradient', presetId: 'gradient_warm_sunset' },
    profileShape: 'rounded',
    borderRadius: '1.25rem',
    spacing: {
      card: '1.75rem',
      section: '1.125rem',
      element: '0.875rem',
    },
  },

  // 테크 블루
  tech_blue: {
    ...COLOR_PALETTES.indigo,
    ...FONT_SETS.gothic,
    background: { type: 'pattern', patternId: 'pattern_grid' },
    profileShape: 'circle',
    borderRadius: '1rem',
    spacing: {
      card: '1.5rem',
      section: '1rem',
      element: '0.75rem',
    },
  },

  // 엘레강트 세리프
  elegant_serif: {
    ...COLOR_PALETTES.slate,
    ...FONT_SETS.myeongjo,
    background: { type: 'solid', color: '#fefefe' },
    profileShape: 'rounded',
    borderRadius: '0.75rem',
    spacing: {
      card: '1.5rem',
      section: '1rem',
      element: '0.75rem',
    },
  },

  // 크리에이티브 컬러풀
  creative_colorful: {
    ...COLOR_PALETTES.pink,
    ...FONT_SETS.round,
    background: { type: 'gradient', presetId: 'gradient_pink_orange' },
    profileShape: 'circle',
    borderRadius: '2rem',
    spacing: {
      card: '2rem',
      section: '1.25rem',
      element: '1rem',
    },
  },

  // 코퍼레이트 뉴트럴
  corporate_neutral: {
    ...COLOR_PALETTES.slate,
    ...FONT_SETS.gothic,
    background: { type: 'pattern', patternId: 'pattern_dots' },
    profileShape: 'rounded',
    borderRadius: '0.5rem',
    spacing: {
      card: '1.5rem',
      section: '1rem',
      element: '0.75rem',
    },
  },

  // 웜 오텀
  warm_autumn: {
    ...COLOR_PALETTES.amber,
    ...FONT_SETS.round,
    background: { type: 'gradient', presetId: 'gradient_warm_sunset' },
    profileShape: 'rounded',
    borderRadius: '1.25rem',
    spacing: {
      card: '1.75rem',
      section: '1.125rem',
      element: '0.875rem',
    },
  },

  // 쿨 미니멀
  cool_minimal: {
    ...COLOR_PALETTES.teal,
    ...FONT_SETS.gothic,
    background: { type: 'gradient', presetId: 'gradient_teal_cyan' },
    profileShape: 'none',
    borderRadius: '1rem',
    spacing: {
      card: '1.5rem',
      section: '1rem',
      element: '0.75rem',
    },
  },

  // 자유 설정 (사용자 커스텀 - minimal_light와 동일한 기본값)
  custom: {
    ...COLOR_PALETTES.slate,
    ...FONT_SETS.gothic,
    background: { type: 'solid', color: '#ffffff' },
    profileShape: 'none',
    borderRadius: '1rem',
    spacing: {
      card: '1.5rem',
      section: '1rem',
      element: '0.75rem',
    },
  },
};

// ============================================================================
// Preset Metadata Maps
// ============================================================================
/**
 * 프리셋별 레이아웃 ID 매핑
 * minimal_ 접두사 프리셋 → minimal_01, 그 외 → split_01
 */
export const PRESET_LAYOUT_MAP: Record<ThemePresetId, LayoutId> = {
  minimal_light:     'minimal_01',
  minimal_dark:      'minimal_01',
  cool_minimal:      'minimal_01',
  custom:            'minimal_01',
  modern_gradient:   'split_01',
  campus_vibrant:    'split_01',
  tech_blue:         'split_01',
  elegant_serif:     'split_01',
  creative_colorful: 'split_01',
  corporate_neutral: 'split_01',
  warm_autumn:       'split_01',
};

/**
 * 프리셋별 기본 팔레트 ID 매핑
 */
export const PRESET_PALETTE_MAP: Record<ThemePresetId, ColorPaletteId> = {
  minimal_light:     'slate',
  minimal_dark:      'slate',
  modern_gradient:   'blue',
  campus_vibrant:    'orange',
  tech_blue:         'indigo',
  elegant_serif:     'slate',
  creative_colorful: 'pink',
  corporate_neutral: 'slate',
  warm_autumn:       'amber',
  cool_minimal:      'teal',
  custom:            'slate',
};

/**
 * 프리셋별 기본 폰트 세트 ID 매핑
 */
export const PRESET_FONT_MAP: Record<ThemePresetId, FontSetId> = {
  minimal_light:     'gothic',
  minimal_dark:      'gothic',
  modern_gradient:   'gothic',
  campus_vibrant:    'round',
  tech_blue:         'gothic',
  elegant_serif:     'myeongjo',
  creative_colorful: 'round',
  corporate_neutral: 'gothic',
  warm_autumn:       'round',
  cool_minimal:      'gothic',
  custom:            'gothic',
};

// ============================================================================
// Helper Functions
// ============================================================================
/**
 * 그라데이션 프리셋 가져오기
 */
export function getGradientPreset(presetId: string): string {
  return GRADIENT_PRESETS[presetId] || GRADIENT_PRESETS.gradient_blue_purple;
}

/**
 * 패턴 프리셋 가져오기
 */
export function getPatternPreset(patternId: string): string {
  return PATTERN_PRESETS[patternId] || PATTERN_PRESETS.pattern_dots;
}


/**
 * Theme Token 기반 템플릿 커스터마이징 엔진 v1
 * 
 * 설계 원칙:
 * - 레이아웃과 스타일을 분리: 레이아웃은 컴포넌트, 스타일은 CSS Variables 토큰
 * - 추후 확장 가능하지만 v1 범위 외 기능은 포함하지 않음
 * - TypeScript로 엄격한 타입 정의
 */

// ============================================================================
// Layout ID
// ============================================================================
/**
 * 레이아웃 식별자
 * 각 레이아웃은 고유한 컴포넌트로 구현됨
 */
export type LayoutId = 'minimal_01' | 'split_01';

// ============================================================================
// Theme Preset ID
// ============================================================================
/**
 * 테마 프리셋 식별자
 * 미리 정의된 스타일 조합 (레이아웃 + 색상 + 폰트 + 배경)
 */
export type ThemePresetId =
  | 'minimal_light'
  | 'minimal_dark'
  | 'modern_gradient'
  | 'campus_vibrant'
  | 'tech_blue'
  | 'elegant_serif'
  | 'creative_colorful'
  | 'corporate_neutral'
  | 'warm_autumn'
  | 'cool_minimal';

// ============================================================================
// Color Palette ID
// ============================================================================
/**
 * 색상 팔레트 식별자
 * primary, secondary, accent, text, muted, border 색상 세트
 */
export type ColorPaletteId =
  | 'slate'
  | 'blue'
  | 'purple'
  | 'emerald'
  | 'orange'
  | 'rose'
  | 'indigo'
  | 'teal'
  | 'amber'
  | 'pink';

// ============================================================================
// Font Set ID
// ============================================================================
/**
 * 폰트 세트 식별자
 * title/body 폰트와 weight 조합
 */
export type FontSetId = 'gothic' | 'myeongjo' | 'round';

// ============================================================================
// Background Token
// ============================================================================
/**
 * 배경 스타일 토큰
 * solid: 단색 배경
 * gradient: 그라데이션 프리셋 ID
 * pattern: 패턴 ID (예: pattern_dots, pattern_grid)
 */
export type BackgroundToken =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; presetId: string }
  | { type: 'pattern'; patternId: string };

// ============================================================================
// Profile Shape
// ============================================================================
/**
 * 프로필 이미지 모양
 */
export type ProfileShape = 'circle' | 'rounded' | 'none';

// ============================================================================
// Card Style Tokens
// ============================================================================
/**
 * 명함 스타일 토큰
 * CSS Variables로 변환될 값들
 */
export interface CardStyleTokens {
  // 색상
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  background: BackgroundToken;

  // 폰트
  titleFont: string;
  bodyFont: string;
  titleWeight: number | string;
  bodyWeight: number | string;

  // 프로필
  profileShape: ProfileShape;

  // 기타
  borderRadius: string;
  spacing: {
    card: string;
    section: string;
    element: string;
  };
}

// ============================================================================
// Card Content Tokens
// ============================================================================
/**
 * 명함 콘텐츠 데이터
 * 스타일과 분리된 순수 데이터
 */
export interface CardContentTokens {
  name: string;
  major?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  links?: {
    instagram?: string;
    github?: string;
    website?: string;
  };
  logoUrl?: string;
  profileUrl?: string;
}

// ============================================================================
// Card Theme (최상위)
// ============================================================================
/**
 * 명함 테마 (최상위 타입)
 * 레이아웃 + 스타일 토큰 조합
 */
export interface CardTheme {
  layoutId: LayoutId;
  presetId: ThemePresetId;
  paletteId: ColorPaletteId;
  fontSetId: FontSetId;
  style: CardStyleTokens;
}

// ============================================================================
// Theme Override
// ============================================================================
/**
 * 테마 오버라이드
 * 프리셋에서 일부만 변경할 때 사용
 */
export type ThemeOverride = Partial<Pick<CardTheme, 'paletteId' | 'fontSetId'>> & {
  style?: Partial<CardStyleTokens>;
};


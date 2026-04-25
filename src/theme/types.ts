/**
 * Theme Token 기반 템플릿 커스터마이징 엔진 v1
 * 
 * 설계 원칙:
 * - 레이아웃과 스타일을 분리: 레이아웃은 컴포넌트, 스타일은 CSS Variables 토큰
 * - 추후 확장 가능하지만 v1 범위 외 기능은 포함하지 않음
 * - TypeScript로 엄격한 타입 정의
 */

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
  | 'cool_minimal'
  | 'custom';

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
export type FontSetId = 'gothic' | 'myeongjo' | 'round' | 'paperlogy';

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
  | { type: 'pattern'; patternId: string }
  | { type: 'image'; url: string };

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
    linkedin?: string;
    google_drive?: string;
  };
  logoUrl?: string;
  profileUrl?: string;
}

// ============================================================================
// Element Position
// ============================================================================
/**
 * 개별 요소의 위치
 * x, y: 카드 너비/높이 대비 % (0~100), 요소 중심점 기준
 * size: 프로필 이미지 전용 — 카드 너비 대비 % (기본 22)
 */
export interface ElementPosition {
  x: number;
  y: number;
  size?: number;
  /** 투명도 0~1, 기본 1 */
  opacity?: number;
  /** 레이어 순서 (높을수록 위), 기본 undefined (자동) */
  zIndex?: number;
  /** 폰트 크기 배율, 기본 1 (0.5~2.0) */
  fontScale?: number;
}

/**
 * 명함 내 각 요소의 위치 맵
 * 설정되지 않은 요소는 기본 레이아웃 위치를 따름
 */
export interface CardElementPositions {
  profile?: ElementPosition;
  name?: ElementPosition;
  tagline?: ElementPosition;
  major?: ElementPosition;
  /** @deprecated 개별 email/phone 위치 사용 권장 (하위 호환 유지) */
  contact?: ElementPosition;
  /** @deprecated 개별 링크 위치 사용 권장 (하위 호환 유지) */
  links?: ElementPosition;
  // 개별 연락처 요소
  email?: ElementPosition;
  phone?: ElementPosition;
  // 개별 링크 요소
  instagram?: ElementPosition;
  github?: ElementPosition;
  website?: ElementPosition;
  linkedin?: ElementPosition;
  google_drive?: ElementPosition;
}

// ============================================================================
// Sticker Element
// ============================================================================
/**
 * 명함 위에 얹히는 스티커/이미지 레이어
 * x, y: 카드 너비/높이 대비 % (중심점 기준)
 * width: 카드 너비 대비 % (기본 20)
 * rotation: 회전 각도 (degrees)
 * opacity: 0~1
 * zIndex: 렌더 순서 (낮을수록 뒤)
 */
export interface StickerElement {
  id: string;
  type: 'emoji' | 'image';
  /** 이모지 문자(emoji) 또는 Storage URL(image) */
  src: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

// ============================================================================
// Orientation
// ============================================================================
/**
 * 명함 방향
 * landscape: 가로 (90:50 비율)
 * portrait: 세로 (50:90 비율)
 */
export type CardOrientation = 'landscape' | 'portrait';

// ============================================================================
// Card Theme Storage (DB 저장 포맷)
// ============================================================================
/**
 * DB에 저장되는 테마 데이터
 * presetId/paletteId/fontSetId 같은 선택 단축키는 저장하지 않고
 * 실제 적용된 값(색상, 폰트, 배경 등)만 직접 저장
 */
export interface CardThemeStorage {
  orientation: CardOrientation;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
  };
  font: {
    titleFont: string;
    bodyFont: string;
    titleWeight: number | string;
    bodyWeight: number | string;
  };
  background: BackgroundToken;
  profileShape: ProfileShape;
  stickers?: StickerElement[];
  elementPositions?: CardElementPositions;
  customFont?: { name: string; url: string };
}

// ============================================================================
// Card Theme (최상위)
// ============================================================================
/**
 * 명함 테마 (최상위 타입)
 * 레이아웃 + 스타일 토큰 조합
 */
export interface CardTheme {
  orientation: CardOrientation;
  presetId: ThemePresetId;
  paletteId: ColorPaletteId;
  fontSetId: FontSetId;
  style: CardStyleTokens;
  /** 각 요소의 커스텀 위치 (드래그로 조정). 없으면 기본 레이아웃 사용 */
  elementPositions?: CardElementPositions;
  /** 스티커 / 갤러리 이미지 레이어 목록 */
  stickers?: StickerElement[];
  /** 사용자가 업로드한 커스텀 폰트 */
  customFont?: { name: string; url: string };
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


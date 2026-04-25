import type { CardContentTokens, CardElementPositions, CardOrientation, ElementPosition } from './types';
import { estimateTextWidthPct } from './renderHelpers';

type FullPositionMap = {
  profile: ElementPosition;
  name: ElementPosition;
  tagline: ElementPosition;
  major: ElementPosition;
  contact: ElementPosition;
  links: ElementPosition;
  email: ElementPosition;
  phone: ElementPosition;
  instagram: ElementPosition;
  github: ElementPosition;
  website: ElementPosition;
  linkedin: ElementPosition;
  google_drive: ElementPosition;
};

type TextElementKey =
  | 'name' | 'tagline' | 'major'
  | 'email' | 'phone'
  | 'instagram' | 'github' | 'website' | 'linkedin' | 'google_drive';

// 카드 가장자리에서 확보할 좌측 안전 여백(%). 5% ≈ portrait 15px / landscape 27px.
const SAFE_MARGIN_PCT = 5;

// cardElements.tsx의 textStyle/linkStyle 호출에 들어가는 base/baseP rem과 동기화.
// 변경 시 두 곳을 함께 수정해야 한다(폰트가 바뀌면 폭 추정도 함께 바뀜).
const TEXT_FONT_REM: Record<TextElementKey, { landscape: number; portrait: number; withIcon: boolean }> = {
  name:         { landscape: 1.0,  portrait: 1.3,   withIcon: false },
  tagline:      { landscape: 0.7,  portrait: 0.875, withIcon: false },
  major:        { landscape: 0.6,  portrait: 0.75,  withIcon: false },
  email:        { landscape: 0.58, portrait: 0.7,   withIcon: true  },
  phone:        { landscape: 0.58, portrait: 0.7,   withIcon: true  },
  instagram:    { landscape: 0.58, portrait: 0.7,   withIcon: true  },
  github:       { landscape: 0.58, portrait: 0.7,   withIcon: true  },
  website:      { landscape: 0.58, portrait: 0.7,   withIcon: true  },
  linkedin:     { landscape: 0.58, portrait: 0.7,   withIcon: true  },
  google_drive: { landscape: 0.58, portrait: 0.7,   withIcon: true  },
};

function getElementText(key: TextElementKey, data: CardContentTokens): string {
  switch (key) {
    case 'name':         return data.name ?? '';
    case 'tagline':      return data.tagline ?? '';
    case 'major':        return data.major ?? '';
    case 'email':        return data.email ?? '';
    case 'phone':        return data.phone ?? '';
    case 'instagram':    return data.links?.instagram ?? '';
    case 'github':       return data.links?.github ?? '';
    case 'website':      return data.links?.website ?? '';
    case 'linkedin':     return data.links?.linkedin ?? '';
    case 'google_drive': return data.links?.google_drive ?? '';
  }
}

function widthPctOf(key: TextElementKey, data: CardContentTokens, isPortrait: boolean): number {
  const text = getElementText(key, data);
  if (!text) return 0;
  const meta = TEXT_FONT_REM[key];
  const fontRem = isPortrait ? meta.portrait : meta.landscape;
  return estimateTextWidthPct(text, fontRem, isPortrait, meta.withIcon);
}

/**
 * 중앙 기준 좌표를 텍스트 길이에 맞춰 보정.
 * - 텍스트 좌측 가장자리가 안전 여백을 침범하면 우측으로 밀어 좌측 정렬.
 * - 침범하지 않으면 원래 좌표 유지(우측 정렬·우측 컬럼 레이아웃 보존).
 */
function adjustXForOverflow(originalX: number, widthPct: number): number {
  if (widthPct <= 0) return originalX;
  const minX = SAFE_MARGIN_PCT + widthPct / 2;
  return Math.max(minX, originalX);
}

const shiftY = (pos: ElementPosition, dy: number): ElementPosition => ({
  ...pos,
  y: Math.min(95, pos.y + dy),
});

const shiftX = (pos: ElementPosition, dx: number): ElementPosition => ({
  ...pos,
  x: Math.min(95, pos.x + dx),
});

/**
 * orientation, hasProfile 조합에 따른 기본 절대 위치 반환.
 * data가 주어지면 텍스트 길이에 따라 x좌표를 좌측 정렬 방향으로 보정한다.
 * CardCanvas와 BusinessCard(PositionedView) 양쪽에서 동일하게 사용.
 */
export function getDefaultPositions(
  orientation: CardOrientation,
  hasProfile: boolean,
  data?: CardContentTokens,
): FullPositionMap {
  let contact: ElementPosition;
  let links: ElementPosition;
  let profile: ElementPosition;
  let name: ElementPosition;
  let tagline: ElementPosition;
  let major: ElementPosition;

  if (orientation === 'portrait') {
    profile = { x: 50, y: 18, size: 28 };
    name    = { x: 50, y: hasProfile ? 42 : 28 };
    tagline = { x: 50, y: hasProfile ? 53 : 40 };
    major   = { x: 50, y: hasProfile ? 63 : 52 };
    contact = { x: 50, y: hasProfile ? 73 : 65 };
    links   = { x: 50, y: hasProfile ? 83 : 78 };
  } else if (hasProfile) {
    // landscape + 프로필 있음: 좌측 프로필 / 우측 정보 컬럼
    profile = { x: 24, y: 50, size: 32 };
    name    = { x: 55, y: 40 };
    tagline = { x: 55, y: 55 };
    major   = { x: 75, y: 40 };
    contact = { x: 55, y: 65 };
    links   = { x: 55, y: 85 };
  } else {
    // landscape + 프로필 없음: 가운데 정렬 단일 컬럼
    profile = { x: 50, y: 50, size: 30 };
    name    = { x: 50, y: 20 };
    tagline = { x: 50, y: 36 };
    major   = { x: 50, y: 52 };
    contact = { x: 50, y: 67 };
    links   = { x: 50, y: 82 };
  }

  const isPortrait = orientation === 'portrait';
  const adjust = (key: TextElementKey, pos: ElementPosition): ElementPosition => {
    if (!data) return pos;
    const w = widthPctOf(key, data, isPortrait);
    if (w <= 0) return pos;
    return { ...pos, x: adjustXForOverflow(pos.x, w) };
  };

  return {
    profile,
    name:    adjust('name',    name),
    tagline: adjust('tagline', tagline),
    major:   adjust('major',   major),
    contact,
    links,
    // 개별 연락처: contact 위치에서 시작, phone은 10% 아래
    email:        adjust('email',        { ...contact }),
    phone:        adjust('phone',        shiftY(contact, 10)),
    // 개별 링크: links 위치에서 10% 간격으로 쌓임
    instagram:    adjust('instagram',    { ...links }),
    github:       adjust('github',       shiftX(links, 10)),
    website:      adjust('website',      shiftX(links, 20)),
    linkedin:     adjust('linkedin',     shiftX(links, 30)),
    google_drive: adjust('google_drive', shiftX(links, 40)),
  };
}

/**
 * 저장된 elementPositions와 기본 위치를 병합하여 완전한 위치 맵 반환.
 * 개별 위치가 없으면 레거시 contact/links 위치로 폴백, 그것도 없으면 기본값 사용.
 */
export function resolvePositions(
  saved: CardElementPositions | undefined,
  orientation: CardOrientation,
  hasProfile: boolean,
  data?: CardContentTokens,
): FullPositionMap {
  const defaults = getDefaultPositions(orientation, hasProfile, data);
  if (!saved) return defaults;

  // 개별 위치 해석 헬퍼: 개별 저장 → 레거시 그룹 → 기본값 순으로 폴백
  const resolveIndividual = (
    individual: ElementPosition | undefined,
    legacyGroup: ElementPosition | undefined,
    defaultPos: ElementPosition,
  ): ElementPosition => {
    if (individual) return { ...defaultPos, ...individual };
    if (legacyGroup) return { ...defaultPos, ...legacyGroup };
    return defaultPos;
  };

  return {
    profile:      { ...defaults.profile,      ...saved.profile      },
    name:         { ...defaults.name,          ...saved.name         },
    tagline:      { ...defaults.tagline,       ...saved.tagline      },
    major:        { ...defaults.major,         ...saved.major        },
    contact:      { ...defaults.contact,       ...saved.contact      },
    links:        { ...defaults.links,         ...saved.links        },
    // 개별 연락처
    email:        resolveIndividual(saved.email,        saved.contact, defaults.email),
    phone:        resolveIndividual(saved.phone,        saved.contact, defaults.phone),
    // 개별 링크
    instagram:    resolveIndividual(saved.instagram,    saved.links,   defaults.instagram),
    github:       resolveIndividual(saved.github,       saved.links,   defaults.github),
    website:      resolveIndividual(saved.website,      saved.links,   defaults.website),
    linkedin:     resolveIndividual(saved.linkedin,     saved.links,   defaults.linkedin),
    google_drive: resolveIndividual(saved.google_drive, saved.links,   defaults.google_drive),
  };
}

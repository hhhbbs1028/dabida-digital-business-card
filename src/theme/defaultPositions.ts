import type { CardElementPositions, CardOrientation, ElementPosition } from './types';

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
 * CardCanvas와 BusinessCard(PositionedView) 양쪽에서 동일하게 사용.
 */
export function getDefaultPositions(
  orientation: CardOrientation,
  hasProfile: boolean,
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

  return {
    profile,
    name,
    tagline,
    major,
    contact,
    links,
    // 개별 연락처: contact 위치에서 시작, phone은 4% 아래
    email:        { ...contact },
    phone:        shiftY(contact, 10),
    // 개별 링크: links 위치에서 4% 간격으로 쌓임
    instagram:    { ...links },
    github:       shiftX(links, 10),
    website:      shiftX(links, 20),
    linkedin:     shiftX(links, 30),
    google_drive: shiftX(links, 40),
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
): FullPositionMap {
  const defaults = getDefaultPositions(orientation, hasProfile);
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

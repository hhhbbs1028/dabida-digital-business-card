import type { CardElementPositions, LayoutId, CardOrientation, ElementPosition } from './types';

type FullPositionMap = Required<CardElementPositions> & { profile: ElementPosition };

/**
 * layoutId, orientation, hasProfile 조합에 따른 기본 절대 위치 반환.
 * CardCanvas와 BusinessCard(PositionedView) 양쪽에서 동일하게 사용.
 */
export function getDefaultPositions(
  layoutId: LayoutId,
  orientation: CardOrientation,
  hasProfile: boolean,
): FullPositionMap {
  if (orientation === 'portrait') {
    return {
      profile: { x: 50, y: 18, size: 28 },
      name:    { x: 50, y: hasProfile ? 42 : 28 },
      tagline: { x: 50, y: hasProfile ? 53 : 40 },
      major:   { x: 50, y: hasProfile ? 63 : 52 },
      contact: { x: 50, y: hasProfile ? 73 : 65 },
      links:   { x: 50, y: hasProfile ? 83 : 78 },
    };
  }

  // landscape (9:5)
  if (layoutId === 'split_01') {
    return {
      profile: { x: 22, y: 38, size: 30 },
      major:   { x: 22, y: 72 },
      name:    { x: 65, y: 22 },
      tagline: { x: 65, y: 42 },
      contact: { x: 65, y: 62 },
      links:   { x: 65, y: 80 },
    };
  }

  // minimal_01 landscape (9:5)
  if (hasProfile) {
    return {
      profile: { x: 22, y: 50, size: 30 },
      name:    { x: 64, y: 22 },
      tagline: { x: 64, y: 40 },
      major:   { x: 64, y: 57 },
      contact: { x: 64, y: 72 },
      links:   { x: 64, y: 85 },
    };
  }
  return {
    profile: { x: 50, y: 50, size: 30 },
    name:    { x: 50, y: 22 },
    tagline: { x: 50, y: 40 },
    major:   { x: 50, y: 56 },
    contact: { x: 50, y: 70 },
    links:   { x: 50, y: 84 },
  };
}

/**
 * 저장된 elementPositions와 기본 위치를 병합하여 완전한 위치 맵 반환.
 */
export function resolvePositions(
  saved: CardElementPositions | undefined,
  layoutId: LayoutId,
  orientation: CardOrientation,
  hasProfile: boolean,
): FullPositionMap {
  const defaults = getDefaultPositions(layoutId, orientation, hasProfile);
  if (!saved) return defaults;
  return {
    profile: { ...defaults.profile, ...saved.profile },
    name:    { ...defaults.name,    ...saved.name    },
    tagline: { ...defaults.tagline, ...saved.tagline },
    major:   { ...defaults.major,   ...saved.major   },
    contact: { ...defaults.contact, ...saved.contact },
    links:   { ...defaults.links,   ...saved.links   },
  };
}

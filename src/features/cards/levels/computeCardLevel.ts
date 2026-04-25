import type { CardData } from '../types';

export type CardLevel = 'my' | 'social' | 'pro';

const WEIGHTS = {
  display_name: 1,
  headline: 1,
  organization: 2,
  phone: 3,
  email: 3,
  instagram: 2,
  github: 3,
  linkedin: 4,
  website: 3,
  google_drive: 5,
  profile_url: 1,
  logo_url: 1,
} as const;

export function computeCardScore(card: CardData): number {
  let score = 0;
  if (card.display_name) score += WEIGHTS.display_name;
  if (card.headline) score += WEIGHTS.headline;
  if (card.organization) score += WEIGHTS.organization;
  if (card.phone) score += WEIGHTS.phone;
  if (card.email) score += WEIGHTS.email;
  if (card.links?.instagram) score += WEIGHTS.instagram;
  if (card.links?.github) score += WEIGHTS.github;
  if (card.links?.linkedin) score += WEIGHTS.linkedin;
  if (card.links?.website) score += WEIGHTS.website;
  if (card.links?.google_drive) score += WEIGHTS.google_drive;
  if (card.profile_url) score += WEIGHTS.profile_url;
  if (card.logo_url) score += WEIGHTS.logo_url;
  return score;
}

// 이력서(google_drive)가 있으면 점수와 무관하게 Pro로 승격한다.
// 이력서 단독으로도 채용/비즈니스 맥락이 분명해지기 때문.
export function computeCardLevel(card: CardData): CardLevel {
  if (card.links?.google_drive) return 'pro';

  const score = computeCardScore(card);
  if (score >= 12) return 'pro';
  if (score >= 5) return 'social';
  return 'my';
}

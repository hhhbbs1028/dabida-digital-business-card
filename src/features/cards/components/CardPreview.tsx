import React from 'react';
import type { CardData } from '../types';
import { BusinessCard } from '../../../components/business-card/BusinessCard';
import type { CardContentTokens } from '../../../theme/types';

type Props = {
  card: Omit<CardData, 'id'>;
};

export function CardPreview({ card }: Props) {
  if (!card.theme) return null;

  const contentTokens: CardContentTokens = {
    name: card.display_name,
    major: card.organization,
    tagline: card.headline,
    email: card.email || undefined,
    phone: card.phone || undefined,
    links: {
      instagram: card.links.instagram || undefined,
      github: card.links.github || undefined,
      website: card.links.website || undefined,
    },
    logoUrl: card.logo_url || undefined,
    profileUrl: card.profile_url || undefined,
  };

  const isPortrait = card.theme.orientation === 'portrait';

  return (
    <BusinessCard
      theme={card.theme}
      data={contentTokens}
      style={isPortrait ? { maxWidth: '100%' } : undefined}
    />
  );
}

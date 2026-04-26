import React from 'react';
import type { CardData } from '../types';
import { BusinessCard } from '../../../components/business-card/BusinessCard';
import type { CardContentTokens } from '../../../theme/types';
import { storageToTheme, mergeTheme } from '../../../theme/mergeTheme';

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
      instagram:    card.links.instagram    || undefined,
      github:       card.links.github       || undefined,
      website:      card.links.website      || undefined,
      linkedin:     card.links.linkedin     || undefined,
      google_drive: card.links.google_drive || undefined,
    },
    logoUrl:    card.logo_url    || undefined,
    profileUrl: card.profile_url || undefined,
  };

  const storage = card.theme as any;
  const theme = storage.colors ? storageToTheme(card.theme!) : mergeTheme('minimal_light');
  const isPortrait = theme.orientation === 'portrait';

  return (
    <BusinessCard
      theme={theme}
      data={contentTokens}
      style={isPortrait ? { maxWidth: '50%' } : undefined}
    />
  );
}

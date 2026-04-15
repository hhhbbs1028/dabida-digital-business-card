import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { CardData } from '../types';
import { BusinessCard } from '../../../components/business-card/BusinessCard';
import type { CardContentTokens } from '../../../theme/types';
import { storageToTheme, mergeTheme } from '../../../theme/mergeTheme';

type Props = {
  card: Omit<CardData, 'id'>;
  /** true이면 뒷면 보기 버튼을 표시 (기본 false) */
  showFlipButton?: boolean;
};

export function CardPreview({ card, showFlipButton = false }: Props) {
  const [showBack, setShowBack] = useState(false);
  const [flipping, setFlipping] = useState(false);

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

  const frontStorage = card.theme as any;
  const frontTheme = frontStorage.colors ? storageToTheme(card.theme!) : mergeTheme('minimal_light');

  const backStorage = card.back_theme as any;
  const backTheme = backStorage?.colors ? storageToTheme(card.back_theme!) : null;

  const hasBack = !!backTheme;
  const displayTheme = showBack && backTheme ? backTheme : frontTheme;
  const isPortrait = displayTheme.orientation === 'portrait';

  const handleFlip = () => {
    if (!hasBack) return;
    setFlipping(true);
    setTimeout(() => {
      setShowBack((p) => !p);
      setFlipping(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div style={{
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        transform: flipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
        opacity: flipping ? 0 : 1,
      }}>
        <BusinessCard
          theme={displayTheme}
          data={contentTokens}
          style={isPortrait ? { maxWidth: '50%' } : undefined}
        />
      </div>

      {/* 뒷면 보기 버튼 — hasBack이거나 showFlipButton prop이 true일 때 표시 */}
      {(hasBack || showFlipButton) && (
        <button
          type="button"
          onClick={handleFlip}
          disabled={!hasBack}
          className={[
            'absolute bottom-1 right-1 flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition',
            showBack
              ? 'border-slate-800 bg-slate-800 text-white'
              : 'border-white/80 bg-white/80 text-slate-600 hover:bg-white',
            !hasBack ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
          title={showBack ? '앞면 보기' : '뒷면 보기'}
        >
          <RefreshCw size={9} />
          {showBack ? '앞면' : '뒷면'}
        </button>
      )}
    </div>
  );
}

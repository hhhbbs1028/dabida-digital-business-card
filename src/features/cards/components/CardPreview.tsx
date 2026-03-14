import React from 'react';
import type { CardData } from '../types';
import { BusinessCard } from '../../../components/business-card/BusinessCard';
import type { CardContentTokens } from '../../../theme/types';

type Props = {
  card: Omit<CardData, 'id'>;
};

export function CardPreview({ card }: Props) {
  // 고급 테마가 있으면 BusinessCard 렌더링
  if (card.theme) {
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
    return <BusinessCard theme={card.theme} data={contentTokens} />;
  }

  // 방어 코드: style이 없거나 불완전한 경우 기본값 사용
  const safeStyle = {
    template_id: card.style?.template_id ?? 1,
    theme_color: card.style?.theme_color ?? '#111827',
    font_family: card.style?.font_family ?? 'sans',
    orientation: card.style?.orientation ?? 'horizontal',
  };

  const { template_id, theme_color, font_family, orientation } = safeStyle;

  // 디버깅 로그
  console.log('[CardPreview] preview props:', {
    card,
    style: card.style,
    safeStyle,
  });

  const fontClass =
    font_family === 'serif'
      ? 'font-serif'
      : font_family === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const baseCardClass =
    'relative mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 shadow-md shadow-slate-900/5 ' +
    fontClass;

  if (template_id === 2) {
    return (
      <div className={baseCardClass}>
        <div className="absolute inset-x-6 top-5 h-1 rounded-full bg-slate-100">
          <div
            className="h-1 rounded-full"
            style={{ background: theme_color || '#111827' }}
          />
        </div>
        <div className="mt-5 flex flex-col items-center text-center">
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: theme_color || '#111827' }}
          >
            {card.organization || 'Organization'}
          </div>
          <div className="mb-1 text-2xl font-semibold text-slate-900">
            {card.display_name || 'Your Name'}
          </div>
          <div className="mb-3 max-w-xs text-[11px] text-slate-500">
            {card.headline || '간단한 역할/전문 분야를 소개하는 한 줄을 입력하세요.'}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
            {card.email && <span>{card.email}</span>}
            {card.phone && <span>{card.phone}</span>}
            {card.links.website && <span>{card.links.website}</span>}
          </div>
        </div>
      </div>
    );
  }

  const isVertical = orientation === 'vertical';

  return (
    <div className={baseCardClass}>
      <div className={isVertical ? 'flex flex-col gap-3' : 'flex items-stretch gap-4'}>
        <div
          className={
            isVertical
              ? 'flex h-16 w-full items-center justify-between rounded-xl bg-slate-900 px-3 text-[10px] font-medium text-slate-50'
              : 'flex w-20 flex-none flex-col items-center justify-center rounded-xl bg-slate-900 text-[10px] font-medium text-slate-50'
          }
        >
          <div
            className={isVertical ? 'h-6 w-6 rounded-full border border-white/40' : 'mb-1 h-6 w-6 rounded-full border border-white/40'}
            style={{ backgroundColor: theme_color || '#111827' }}
          />
          <span className={isVertical ? 'text-[10px]' : 'mt-1 px-2 text-center leading-snug'}>
            {card.organization || 'Organization'}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="text-[13px] font-semibold text-slate-900">
            {card.display_name || 'Your Name'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {card.headline || '포지션과 주요 역할을 간단히 적어주세요.'}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
            {card.email && <span>{card.email}</span>}
            {card.phone && <span>{card.phone}</span>}
            {card.links.github && <span>GitHub</span>}
            {card.links.instagram && <span>Instagram</span>}
            {card.links.website && <span>{card.links.website}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}



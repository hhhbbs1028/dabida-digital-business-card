import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { CardData } from '../types';

async function getCurrentUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[cardsApi] 사용자 확인 오류:', error);
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

function normalizeCard(row: any): CardData {
  return {
    id: row.id,
    display_name: row.display_name ?? '',
    headline: row.headline ?? '',
    organization: row.organization ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    links: {
      instagram: row.links?.instagram ?? '',
      github: row.links?.github ?? '',
      website: row.links?.website ?? '',
      linkedin: row.links?.linkedin ?? '',
      google_drive: row.links?.google_drive ?? '',
    },
    profile_url: row.profile_url ?? null,
    logo_url: row.logo_url ?? null,
    theme: row.theme ?? null,
    back_theme: row.back_theme ?? null,
  };
}

function buildLinks(links: CardData['links']) {
  return {
    ...(links.instagram    && { instagram:    links.instagram    }),
    ...(links.github       && { github:       links.github       }),
    ...(links.website      && { website:      links.website      }),
    ...(links.linkedin     && { linkedin:     links.linkedin     }),
    ...(links.google_drive && { google_drive: links.google_drive }),
  };
}

export async function getMyCards(): Promise<CardData[]> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[cardsApi] 카드 조회 오류:', error);
    throw error;
  }

  return data ? data.map(normalizeCard) : [];
}

export async function createCard(card: Omit<CardData, 'id'>): Promise<CardData> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('cards')
    .insert({
      user_id: user.id,
      display_name: card.display_name,
      headline: card.headline,
      organization: card.organization,
      email: card.email,
      phone: card.phone,
      links: buildLinks(card.links),
      theme: card.theme ?? null,
      back_theme: card.back_theme ?? null,
      profile_url: card.profile_url ?? null,
    } as any)
    .select('*')
    .single();

  if (error) {
    console.error('[cardsApi] 카드 생성 오류:', error);
    throw error;
  }

  return normalizeCard(data);
}

export async function updateCard(card: CardData): Promise<CardData> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('cards')
    .update({
      display_name: card.display_name,
      headline: card.headline,
      organization: card.organization,
      email: card.email,
      phone: card.phone,
      links: buildLinks(card.links),
      theme: card.theme ?? null,
      back_theme: card.back_theme ?? null,
      profile_url: card.profile_url ?? null,
    } as any)
    .eq('id', card.id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[cardsApi] 카드 수정 오류:', error);
    throw error;
  }

  const { data, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', card.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error('[cardsApi] 카드 조회 오류:', fetchError);
    throw fetchError;
  }

  return normalizeCard(data);
}

export async function deleteCard(id: string): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[cardsApi] 카드 삭제 오류:', error);
    throw error;
  }
}

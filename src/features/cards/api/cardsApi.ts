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
    },
    style: {
      template_id: row.style?.template_id ?? 1,
      theme_color: row.style?.theme_color ?? '#111827',
      font_family: row.style?.font_family ?? 'sans',
      orientation: row.style?.orientation ?? 'horizontal',
    },
  };
}

export async function getMyCards(): Promise<CardData[]> {
  const user = await getCurrentUser();

  console.log('[cardsApi] 카드 조회:', user.id);
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

  console.log('[cardsApi] 카드 생성:', user.id);
  const { data, error } = await supabase
    .from('cards')
    .insert({
      user_id: user.id,
      display_name: card.display_name,
      headline: card.headline,
      organization: card.organization,
      email: card.email,
      phone: card.phone,
      links: {
        instagram: card.links.instagram || null,
        github: card.links.github || null,
        website: card.links.website || null,
      },
      style: {
        template_id: card.style.template_id,
        theme_color: card.style.theme_color,
        font_family: card.style.font_family,
        orientation: card.style.orientation,
      },
    })
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

  console.log('[cardsApi] 카드 수정:', user.id, card.id);
  const { error } = await supabase
    .from('cards')
    .update({
      display_name: card.display_name,
      headline: card.headline,
      organization: card.organization,
      email: card.email,
      phone: card.phone,
      links: {
        instagram: card.links.instagram || null,
        github: card.links.github || null,
        website: card.links.website || null,
      },
      style: {
        template_id: card.style.template_id,
        theme_color: card.style.theme_color,
        font_family: card.style.font_family,
        orientation: card.style.orientation,
      },
    })
    .eq('id', card.id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[cardsApi] 카드 수정 오류:', error);
    throw error;
  }

  // 업데이트 후 전체 카드 정보를 반환하기 위해 다시 조회
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

  console.log('[cardsApi] 카드 삭제:', user.id, id);
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


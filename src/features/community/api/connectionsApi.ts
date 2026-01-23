import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Connection, CommunityProfile } from '../types';

async function getCurrentUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[connectionsApi] 사용자 확인 오류:', error);
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

function normalizeConnection(row: any): Connection {
  return {
    id: row.id,
    owner_id: row.owner_id,
    target_user_id: row.target_user_id,
    source: row.source || 'received_card',
    created_at: row.created_at,
  };
}

// received_cards에서 connections 동기화
export async function syncConnectionsFromReceivedCards(): Promise<Connection[]> {
  const user = await getCurrentUser();

  // received_cards에서 source_card_id가 있는 것들 조회
  const { data: receivedCards, error: rcError } = await supabase
    .from('received_cards')
    .select('id, source_card_id')
    .eq('owner_id', user.id)
    .not('source_card_id', 'is', null);

  if (rcError) {
    console.error('[connectionsApi] 받은 명함 조회 오류:', rcError);
    throw rcError;
  }

  if (!receivedCards || receivedCards.length === 0) {
    return [];
  }

  // source_card_id들을 통해 cards 테이블에서 user_id 조회
  const sourceCardIds = receivedCards
    .map((rc) => rc.source_card_id)
    .filter((id): id is string => id !== null);

  if (sourceCardIds.length === 0) {
    return [];
  }

  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('id, user_id')
    .in('id', sourceCardIds);

  if (cardsError) {
    console.error('[connectionsApi] 카드 조회 오류:', cardsError);
    throw cardsError;
  }

  // connections에 upsert
  const connectionsToUpsert = cards
    .filter((card) => card.user_id !== user.id) // 자기 자신 제외
    .map((card) => ({
      owner_id: user.id,
      target_user_id: card.user_id,
      source: 'received_card' as const,
    }));

  if (connectionsToUpsert.length === 0) {
    return [];
  }

  // upsert (중복 제거를 위해 unique constraint 활용)
  const { data: upserted, error: upsertError } = await supabase
    .from('connections')
    .upsert(connectionsToUpsert, {
      onConflict: 'owner_id,target_user_id,source',
      ignoreDuplicates: false,
    })
    .select('*');

  if (upsertError) {
    console.error('[connectionsApi] connections 동기화 오류:', upsertError);
    throw upsertError;
  }

  return (upserted ?? []).map(normalizeConnection);
}

// 내 1차 인맥 조회
export async function getMyFirstDegree(): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();

  // 내 connections 조회
  const { data: connections, error: connError } = await supabase
    .from('connections')
    .select('target_user_id')
    .eq('owner_id', user.id);

  if (connError) {
    console.error('[connectionsApi] connections 조회 오류:', connError);
    throw connError;
  }

  if (!connections || connections.length === 0) {
    return [];
  }

  const targetUserIds = connections.map((c) => c.target_user_id);

  // profiles 조회
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, created_at, updated_at')
    .in('user_id', targetUserIds);

  if (profilesError) {
    console.error('[connectionsApi] 프로필 조회 오류:', profilesError);
    throw profilesError;
  }

  return (profiles ?? []).map((p: any) => ({
    user_id: p.user_id,
    display_name: p.display_name ?? null,
    university: p.university ?? null,
    major: p.major ?? null,
    bio: p.bio ?? null,
    avatar_url: p.avatar_url ?? null,
    skill_tags: Array.isArray(p.skill_tags) ? p.skill_tags : [],
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}

// 2차 추천 조회 (1차 인맥의 connections 기반)
export async function getSecondDegreeRecommendations(): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();

  // 1차 인맥 조회
  const { data: firstDegree, error: firstError } = await supabase
    .from('connections')
    .select('target_user_id')
    .eq('owner_id', user.id);

  if (firstError) {
    console.error('[connectionsApi] 1차 인맥 조회 오류:', firstError);
    throw firstError;
  }

  if (!firstDegree || firstDegree.length === 0) {
    return [];
  }

  const firstDegreeUserIds = firstDegree.map((c) => c.target_user_id);

  // 1차 인맥들의 connections 조회
  const { data: secondDegree, error: secondError } = await supabase
    .from('connections')
    .select('target_user_id')
    .in('owner_id', firstDegreeUserIds);

  if (secondError) {
    console.error('[connectionsApi] 2차 인맥 조회 오류:', secondError);
    throw secondError;
  }

  if (!secondDegree || secondDegree.length === 0) {
    return [];
  }

  // 내가 이미 아는 사람과 나 자신 제외
  const allKnownUserIds = new Set([
    user.id,
    ...firstDegreeUserIds,
    ...firstDegree.map((c) => c.target_user_id),
  ]);

  const candidateUserIds = secondDegree
    .map((c) => c.target_user_id)
    .filter((id) => !allKnownUserIds.has(id));

  if (candidateUserIds.length === 0) {
    return [];
  }

  // 중복 제거
  const uniqueCandidateIds = [...new Set(candidateUserIds)];

  // profiles 조회
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, created_at, updated_at')
    .in('user_id', uniqueCandidateIds)
    .limit(20); // 최대 20명

  if (profilesError) {
    console.error('[connectionsApi] 프로필 조회 오류:', profilesError);
    throw profilesError;
  }

  return (profiles ?? []).map((p: any) => ({
    user_id: p.user_id,
    display_name: p.display_name ?? null,
    university: p.university ?? null,
    major: p.major ?? null,
    bio: p.bio ?? null,
    avatar_url: p.avatar_url ?? null,
    skill_tags: Array.isArray(p.skill_tags) ? p.skill_tags : [],
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}


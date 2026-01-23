import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { CommunityProfile, CommunityProfileInput, GetProfilesParams } from '../types';

async function getCurrentUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[profilesApi] 사용자 확인 오류:', error);
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

function normalizeCommunityProfile(row: any): CommunityProfile {
  return {
    user_id: row.user_id,
    display_name: row.display_name ?? null,
    university: row.university ?? null,
    major: row.major ?? null,
    bio: row.bio ?? null,
    avatar_url: row.avatar_url ?? null,
    skill_tags: Array.isArray(row.skill_tags) ? row.skill_tags : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// 프로필 목록 조회 (검색/필터링)
export async function getProfiles(params: GetProfilesParams = {}): Promise<CommunityProfile[]> {
  await getCurrentUser(); // 로그인 체크만

  let query = supabase
    .from('profiles')
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, created_at, updated_at')
    .order('created_at', { ascending: false });

  // 검색어 (q) - display_name, university, major, bio 부분검색
  if (params.q?.trim()) {
    const searchTerm = params.q.trim();
    // Supabase or() 메서드는 특정 형식을 요구하므로, 각 필드에 대해 ilike를 개별 적용
    query = query.or(
      `display_name.ilike.%${searchTerm}%,university.ilike.%${searchTerm}%,major.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`
    );
  }

  // university 필터
  if (params.university) {
    query = query.eq('university', params.university);
  }

  // major 필터
  if (params.major) {
    query = query.eq('major', params.major);
  }

  // tags 필터 (overlap)
  if (params.tags && params.tags.length > 0) {
    query = query.contains('skill_tags', params.tags);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[profilesApi] 프로필 목록 조회 오류:', error);
    throw error;
  }

  return (data ?? []).map(normalizeCommunityProfile);
}

// 내 프로필 조회
export async function getMyProfile(): Promise<CommunityProfile | null> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[profilesApi] 내 프로필 조회 오류:', error);
    throw error;
  }

  return data ? normalizeCommunityProfile(data) : null;
}

// 프로필 저장/업데이트
export async function upsertMyProfile(input: CommunityProfileInput): Promise<CommunityProfile> {
  const user = await getCurrentUser();

  const record: any = {
    user_id: user.id,
  };

  if (input.display_name !== undefined) record.display_name = input.display_name;
  if (input.university !== undefined) record.university = input.university;
  if (input.major !== undefined) record.major = input.major;
  if (input.bio !== undefined) record.bio = input.bio;
  if (input.avatar_url !== undefined) record.avatar_url = input.avatar_url;
  if (input.skill_tags !== undefined) record.skill_tags = input.skill_tags;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(record, { onConflict: 'user_id' })
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, created_at, updated_at')
    .single();

  if (error) {
    console.error('[profilesApi] 프로필 저장 오류:', error);
    throw error;
  }

  return normalizeCommunityProfile(data);
}


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

// 프로필 목록 조회 (검색/필터링) - received_cards의 snapshot도 포함
export async function getProfiles(params: GetProfilesParams = {}): Promise<CommunityProfile[]> {
  const user = await getCurrentUser(); // 로그인 체크

  // 1. profiles 테이블에서 조회
  let query = supabase
    .from('profiles')
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, created_at, updated_at')
    .order('created_at', { ascending: false });

  // 검색어 (q) - display_name, university, major, bio 부분검색
  if (params.q?.trim()) {
    const searchTerm = params.q.trim();
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

  const { data: profilesData, error: profilesError } = await query;

  if (profilesError) {
    console.error('[profilesApi] 프로필 목록 조회 오류:', profilesError);
    throw profilesError;
  }

  const profiles = (profilesData ?? []).map(normalizeCommunityProfile);

  // 2. received_cards의 snapshot에서도 프로필 정보 추출
  // source_card_id가 있으면 실제 user_id를 찾아서 사용
  let receivedCardsQuery = supabase
    .from('received_cards')
    .select('id, source_card_id, snapshot, tags')
    .eq('owner_id', user.id);

  // 검색어 필터링 (snapshot 내부 필드)
  if (params.q?.trim()) {
    const searchTerm = params.q.trim().toLowerCase();
    // received_cards는 JSONB이므로 클라이언트 측에서 필터링
  }

  const { data: receivedCards, error: rcError } = await receivedCardsQuery;

  if (rcError) {
    console.warn('[profilesApi] 받은 명함 조회 오류 (무시):', rcError);
  } else if (receivedCards) {
    // source_card_id가 있는 경우: 실제 user_id 찾기
    const cardsWithSourceId = receivedCards.filter((rc) => rc.source_card_id);
    const cardIdToUserId = new Map<string, string>();
    
    if (cardsWithSourceId.length > 0) {
      const sourceCardIds = cardsWithSourceId
        .map((rc) => rc.source_card_id)
        .filter((id): id is string => id !== null);

      if (sourceCardIds.length > 0) {
        const { data: cards } = await supabase
          .from('cards')
          .select('id, user_id')
          .in('id', sourceCardIds);

        if (cards) {
          for (const card of cards) {
            cardIdToUserId.set(card.id, card.user_id);
          }
        }
      }
    }

    // snapshot을 CommunityProfile로 변환
    const snapshotProfiles: CommunityProfile[] = [];
    const seenUserIds = new Set<string>(); // user_id 기준 중복 제거

    for (const rc of receivedCards) {
      const snapshot = rc.snapshot as any;
      if (!snapshot || !snapshot.display_name) continue;

      const displayName = snapshot.display_name;
      
      // 실제 user_id 찾기 (source_card_id가 있으면)
      let actualUserId: string;
      if (rc.source_card_id && cardIdToUserId.has(rc.source_card_id)) {
        actualUserId = cardIdToUserId.get(rc.source_card_id)!;
        // 자기 자신 제외
        if (actualUserId === user.id) continue;
      } else {
        // source_card_id가 없으면 가상의 user_id 사용
        actualUserId = `snapshot_${displayName}_${snapshotProfiles.length}`;
      }

      // user_id 기준 중복 제거 (같은 사용자가 여러 번 나올 수 있음)
      if (seenUserIds.has(actualUserId)) continue;
      seenUserIds.add(actualUserId);

      // 필터링 적용
      let matches = true;

      // 검색어 필터
      if (params.q?.trim()) {
        const searchTerm = params.q.trim().toLowerCase();
        const matchesSearch =
          displayName.toLowerCase().includes(searchTerm) ||
          snapshot.organization?.toLowerCase().includes(searchTerm) ||
          snapshot.headline?.toLowerCase().includes(searchTerm);
        if (!matchesSearch) matches = false;
      }

      // university 필터 (organization을 university로 사용)
      if (params.university && snapshot.organization !== params.university) {
        matches = false;
      }

      // major 필터 (headline을 major로 사용)
      if (params.major && snapshot.headline !== params.major) {
        matches = false;
      }

      // tags 필터
      if (params.tags && params.tags.length > 0) {
        const cardTags = Array.isArray(rc.tags) ? rc.tags : [];
        const hasMatchingTag = params.tags.some((tag) =>
          cardTags.some((cardTag: string) => cardTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) matches = false;
      }

      if (matches) {
        snapshotProfiles.push({
          user_id: actualUserId, // 실제 user_id 또는 가상의 user_id
          display_name: displayName,
          university: snapshot.organization || null,
          major: snapshot.headline || null,
          bio: null,
          avatar_url: null,
          skill_tags: Array.isArray(rc.tags) ? rc.tags : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

  // profiles와 snapshotProfiles 합치기 (user_id 기준 중복 제거)
  const profileMap = new Map<string, CommunityProfile>();
  
  // 실제 profiles 먼저 추가 (자기 자신 제외)
  for (const profile of profiles) {
    if (profile.display_name && profile.user_id !== user.id) {
      profileMap.set(profile.user_id, profile); // user_id를 키로 사용
    }
  }

    // snapshot profiles 추가 (user_id 기준으로, 이미 있으면 덮어쓰기 - 실제 user_id가 우선)
    for (const snapshotProfile of snapshotProfiles) {
      // 실제 user_id인 경우 우선, 가상 user_id는 기존에 없을 때만 추가
      if (snapshotProfile.user_id.startsWith('snapshot_')) {
        // 가상 user_id는 기존에 없을 때만 추가
        if (!profileMap.has(snapshotProfile.user_id)) {
          profileMap.set(snapshotProfile.user_id, snapshotProfile);
        }
      } else {
        // 실제 user_id는 항상 추가 (덮어쓰기 가능 - 실제 프로필이 우선)
        profileMap.set(snapshotProfile.user_id, snapshotProfile);
      }
    }

    return Array.from(profileMap.values());
  }

  return profiles;
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


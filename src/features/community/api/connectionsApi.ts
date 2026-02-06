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
    is_public: row.is_public ?? true,
    created_at: row.created_at,
  };
}

// received_cards에서 connections 동기화
export async function syncConnectionsFromReceivedCards(): Promise<Connection[]> {
  const user = await getCurrentUser();

  console.log('[connectionsApi] syncConnectionsFromReceivedCards 시작:', { userId: user.id });

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

  console.log('[connectionsApi] 받은 명함 조회 결과:', {
    total: receivedCards?.length || 0,
    withSourceCardId: receivedCards?.filter((rc) => rc.source_card_id).length || 0,
    receivedCards: receivedCards?.map((rc) => ({
      id: rc.id,
      source_card_id: rc.source_card_id,
    })),
  });

  if (!receivedCards || receivedCards.length === 0) {
    console.log('[connectionsApi] source_card_id가 있는 받은 명함이 없음');
    return [];
  }

  // source_card_id들을 통해 cards 테이블에서 user_id 조회
  const sourceCardIds = receivedCards
    .map((rc) => rc.source_card_id)
    .filter((id): id is string => id !== null);

  if (sourceCardIds.length === 0) {
    console.log('[connectionsApi] source_card_id가 없음');
    return [];
  }

  console.log('[connectionsApi] cards 조회 시작:', { sourceCardIds, count: sourceCardIds.length });

  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('id, user_id')
    .in('id', sourceCardIds);

  if (cardsError) {
    console.error('[connectionsApi] 카드 조회 오류:', cardsError);
    throw cardsError;
  }

  console.log('[connectionsApi] cards 조회 결과:', {
    count: cards?.length || 0,
    cards: cards?.map((c) => ({
      id: c.id,
      user_id: c.user_id,
    })),
  });

  // connections에 upsert
  const connectionsToUpsert = cards
    .filter((card) => card.user_id !== user.id) // 자기 자신 제외
    .map((card) => ({
      owner_id: user.id,
      target_user_id: card.user_id,
      source: 'received_card' as const,
    }));

  console.log('[connectionsApi] connections 업서트 준비:', {
    count: connectionsToUpsert.length,
    connections: connectionsToUpsert,
  });

  if (connectionsToUpsert.length === 0) {
    console.log('[connectionsApi] 업서트할 connections가 없음');
    return [];
  }

  // upsert (중복 제거를 위해 unique constraint 활용, is_public 기본값 true)
  const { data: upserted, error: upsertError } = await supabase
    .from('connections')
    .upsert(
      connectionsToUpsert.map((c) => ({ ...c, is_public: true })),
      {
        onConflict: 'owner_id,target_user_id,source',
        ignoreDuplicates: false,
      }
    )
    .select('*');

  if (upsertError) {
    console.error('[connectionsApi] connections 동기화 오류:', upsertError);
    throw upsertError;
  }

  console.log('[connectionsApi] connections 동기화 완료:', {
    count: upserted?.length || 0,
    connections: upserted?.map(normalizeConnection),
  });

  return (upserted ?? []).map(normalizeConnection);
}

// 내 1차 인맥 조회 (received_cards의 snapshot도 포함)
export async function getMyFirstDegreeWithSnapshots(): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();

  // 1. connections 테이블에서 조회 (있으면 사용)
  const { data: connections, error: connError } = await supabase
    .from('connections')
    .select('target_user_id, source')
    .eq('owner_id', user.id)
    .eq('source', 'received_card');

  console.log('[connectionsApi] getMyFirstDegreeWithSnapshots - connections 조회 결과:', {
    count: connections?.length || 0,
    connections: connections?.map((c) => ({
      target_user_id: c.target_user_id,
      source: c.source,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.target_user_id),
    })),
    error: connError,
  });

  const profileMap = new Map<string, CommunityProfile>();

  // 2. connections가 있으면 profiles 조회
  if (!connError && connections && connections.length > 0) {
    // 실제 UUID만 필터링 (mock data 제외)
    const targetUserIds = connections
      .map((c) => c.target_user_id)
      .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    console.log('[connectionsApi] profiles 조회 시작:', {
      targetUserIds,
      count: targetUserIds.length,
    });

    if (targetUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, created_at, updated_at')
        .in('user_id', targetUserIds);

      console.log('[connectionsApi] profiles 조회 결과:', {
        count: profiles?.length || 0,
        profiles: profiles?.map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name,
        })),
        error: profilesError,
      });

      if (!profilesError && profiles) {
        for (const p of profiles) {
          // display_name이 없어도 프로필은 추가 (나중에 snapshot으로 보완)
          profileMap.set(p.user_id, {
            user_id: p.user_id,
            display_name: p.display_name ?? null,
            university: p.university ?? null,
            major: p.major ?? null,
            bio: p.bio ?? null,
            avatar_url: p.avatar_url ?? null,
            skill_tags: Array.isArray(p.skill_tags) ? p.skill_tags : [],
            created_at: p.created_at,
            updated_at: p.updated_at,
          });
        }
      } else if (profilesError) {
        console.warn('[connectionsApi] profiles 조회 실패, snapshot으로 보완 시도:', profilesError);
      } else {
        console.warn('[connectionsApi] profiles 조회 결과 없음, snapshot으로 보완 시도');
      }
    }
  }

  // 3. received_cards의 snapshot으로 보완 (connections에 없거나 프로필이 없는 경우)
  const { data: receivedCards } = await supabase
    .from('received_cards')
    .select('source_card_id, snapshot, tags')
    .eq('owner_id', user.id);

  if (receivedCards) {
    // source_card_id가 있는 경우: 실제 user_id 찾기
    const cardsWithSourceId = receivedCards.filter((rc) => rc.source_card_id);
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
          const cardToUserId = new Map(cards.map((c) => [c.id, c.user_id]));
          for (const rc of cardsWithSourceId) {
            if (rc.source_card_id && cardToUserId.has(rc.source_card_id) && rc.snapshot) {
              const userId = cardToUserId.get(rc.source_card_id)!;
              // 자기 자신 제외
              if (userId === user.id) continue;

              // 프로필이 없거나 display_name이 없으면 snapshot으로 보완
              const existingProfile = profileMap.get(userId);
              const snapshot = rc.snapshot as any;
              
              if (!existingProfile) {
                // 프로필이 없으면 snapshot으로 추가
                profileMap.set(userId, {
                  user_id: userId,
                  display_name: snapshot.display_name || null,
                  university: snapshot.organization || null,
                  major: snapshot.headline || null,
                  bio: null,
                  avatar_url: null,
                  skill_tags: Array.isArray(rc.tags) ? rc.tags : [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              } else if (!existingProfile.display_name && snapshot.display_name) {
                // 프로필은 있지만 display_name이 없으면 snapshot에서 보완
                existingProfile.display_name = snapshot.display_name;
                if (!existingProfile.university && snapshot.organization) {
                  existingProfile.university = snapshot.organization;
                }
                if (!existingProfile.major && snapshot.headline) {
                  existingProfile.major = snapshot.headline;
                }
              }
            }
          }
        }
      }
    }

    // source_card_id가 없는 경우: snapshot만으로 가상 프로필 생성
    const seenNames = new Set<string>();
    for (const rc of receivedCards) {
      if (!rc.source_card_id && rc.snapshot) {
        const snapshot = rc.snapshot as any;
        const displayName = snapshot.display_name;
        if (displayName && !seenNames.has(displayName)) {
          seenNames.add(displayName);
          const virtualUserId = `snapshot_${displayName}`;
          if (!profileMap.has(virtualUserId)) {
            profileMap.set(virtualUserId, {
              user_id: virtualUserId,
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
      }
    }
  }

  // 실제 user_id(UUID 형식)만 반환 (mock data 제외)
  // 가상 user_id(snapshot_로 시작)는 제외
  const result = Array.from(profileMap.values())
    .filter((profile) => {
      // UUID 형식인지 확인 (실제 사용자)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.user_id);
      return isUUID;
    })
    .map((profile) => {
      // display_name이 없으면 기본값 설정
      if (!profile.display_name) {
        return {
          ...profile,
          display_name: `User ${profile.user_id.slice(0, 8)}`,
        };
      }
      return profile;
    });

  console.log('[connectionsApi] getMyFirstDegreeWithSnapshots 결과:', {
    total: profileMap.size,
    filtered: result.length,
    excluded: profileMap.size - result.length,
    profiles: result.map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      hasDisplayName: !!p.display_name,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.user_id),
    })),
  });

  return result;
}

// received_cards에서 직접 프로필 정보 추출 (connections가 없을 때)
async function getProfilesFromReceivedCards(): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();

  // source_card_id가 있든 없든 모든 received_cards 조회
  const { data: receivedCards, error } = await supabase
    .from('received_cards')
    .select('source_card_id, snapshot, tags')
    .eq('owner_id', user.id);

  if (error || !receivedCards || receivedCards.length === 0) {
    return [];
  }

  const profiles: CommunityProfile[] = [];
  const seenNames = new Set<string>();

  // source_card_id가 있는 경우: 실제 user_id 찾기
  const cardsWithSourceId = receivedCards.filter((rc) => rc.source_card_id);
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
        const cardToUserId = new Map(cards.map((c) => [c.id, c.user_id]));
        for (const rc of cardsWithSourceId) {
          if (rc.source_card_id && cardToUserId.has(rc.source_card_id) && rc.snapshot) {
            const userId = cardToUserId.get(rc.source_card_id)!;
            const snapshot = rc.snapshot as any;
            const displayName = snapshot.display_name || '이름 없음';
            
            if (!seenNames.has(displayName)) {
              seenNames.add(displayName);
              profiles.push({
                user_id: userId,
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
        }
      }
    }
  }

  // source_card_id가 없는 경우: snapshot만으로 프로필 생성 (가상 user_id)
  for (const rc of receivedCards) {
    if (!rc.source_card_id && rc.snapshot) {
      const snapshot = rc.snapshot as any;
      const displayName = snapshot.display_name;
      
      if (displayName && !seenNames.has(displayName)) {
        seenNames.add(displayName);
        profiles.push({
          user_id: `snapshot_${displayName}_${profiles.length}`, // 가상의 user_id
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
  }

  return profiles;
}

// 1차 인맥 조회 (프라이버시 고려, 공개 필드만 반환)
export async function getFirstDegree(viewerId: string): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();
  const isOwnProfile = viewerId === user.id;

  // 내 connections 조회 (owner_id는 항상 자신의 connections에 접근 가능)
  const { data: connections, error: connError } = await supabase
    .from('connections')
    .select('target_user_id, is_public')
    .eq('owner_id', viewerId)
    .eq('source', 'received_card');

  if (connError) {
    console.error('[connectionsApi] connections 조회 오류:', connError);
    throw connError;
  }

  if (!connections || connections.length === 0) {
    return [];
  }

  // 자신의 connections는 모두 조회 가능, 다른 사람의 connections는 공개된 것만
  const visibleConnections = isOwnProfile
    ? connections
    : connections.filter((c) => c.is_public === true);

  if (visibleConnections.length === 0) {
    return [];
  }

  const targetUserIds = visibleConnections.map((c) => c.target_user_id);

  // profiles 조회 (공개 필드만)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, network_visibility, created_at, updated_at')
    .in('user_id', targetUserIds);

  if (profilesError) {
    console.error('[connectionsApi] 프로필 조회 오류:', profilesError);
    throw profilesError;
  }

  // network_visibility 필터링
  const visibleProfiles = (profiles ?? []).filter((p: any) => {
    if (isOwnProfile) return true; // 자신의 1차 인맥은 모두 보임
    if (p.network_visibility === 'private') return false;
    if (p.network_visibility === 'friends_only') {
      // mutual connection 체크는 API 레벨에서 처리 (복잡하므로 일단 공개로 처리)
      // TODO: mutual connection 체크 구현
      return true; // MVP에서는 friends_only도 공개로 처리
    }
    return true; // public
  });

  return visibleProfiles.map((p: any) => ({
    user_id: p.user_id,
    display_name: p.display_name ?? null,
    university: p.university ?? null,
    major: p.major ?? null,
    bio: p.bio ?? null,
    avatar_url: p.avatar_url ?? null,
    skill_tags: Array.isArray(p.skill_tags) ? p.skill_tags : [],
    network_visibility: p.network_visibility || 'public',
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}

// 내 1차 인맥 조회 (기존 함수, 호환성 유지)
export async function getMyFirstDegree(): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();
  return getFirstDegree(user.id);
}

// 2차 인맥 추천 조회 (프라이버시 고려, 공통 친구 정보 포함)
export async function getSecondDegree(viewerId: string): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();
  const isOwnProfile = viewerId === user.id;

  console.log('[connectionsApi] getSecondDegree 시작:', { viewerId, isOwnProfile, currentUserId: user.id });

  // 1차 인맥 조회
  const firstDegree = await getFirstDegree(viewerId);
  console.log('[connectionsApi] 1차 인맥 조회 결과:', {
    count: firstDegree.length,
    userIds: firstDegree.map((p) => p.user_id),
    displayNames: firstDegree.map((p) => p.display_name),
  });

  if (firstDegree.length === 0) {
    console.log('[connectionsApi] 1차 인맥이 없어서 2차 인맥 조회 중단');
    return [];
  }

  const firstDegreeUserIds = firstDegree.map((p) => p.user_id);
  console.log('[connectionsApi] 1차 인맥들의 connections 조회 시작:', {
    firstDegreeUserIds,
    queryCount: firstDegreeUserIds.length,
  });

  // 1차 인맥들의 공개 connections 조회
  // SECURITY DEFINER 함수를 사용하여 RLS를 우회하고 공개 connections만 조회
  let secondDegreeConnections: any[] | null = null;
  let secondError: any = null;

  try {
    // 먼저 RPC 함수를 시도 (SECURITY DEFINER 함수 사용)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_connections', {
      p_owner_ids: firstDegreeUserIds,
    });

    if (rpcError) {
      console.warn('[connectionsApi] RPC 함수 조회 실패, 직접 쿼리로 폴백:', {
        error: rpcError,
        message: rpcError.message,
      });
      // RPC 함수가 없거나 실패하면 직접 쿼리로 폴백
      const { data: directData, error: directError } = await supabase
        .from('connections')
        .select('owner_id, target_user_id, is_public')
        .in('owner_id', firstDegreeUserIds)
        .eq('is_public', true);

      if (directError) {
        secondError = directError;
      } else {
        secondDegreeConnections = directData;
      }
    } else {
      secondDegreeConnections = rpcData;
    }
  } catch (err: any) {
    console.error('[connectionsApi] connections 조회 중 예외 발생:', err);
    secondError = err;
  }

  if (secondError) {
    console.error('[connectionsApi] 2차 인맥 connections 조회 오류:', {
      error: secondError,
      message: secondError.message,
      details: secondError.details,
      hint: secondError.hint,
      firstDegreeUserIds,
    });
    throw secondError;
  }

  console.log('[connectionsApi] 1차 인맥들의 connections 조회 결과:', {
    count: secondDegreeConnections?.length || 0,
    connections: secondDegreeConnections?.map((c) => ({
      owner_id: c.owner_id,
      target_user_id: c.target_user_id,
      is_public: c.is_public,
    })),
  });

  if (!secondDegreeConnections || secondDegreeConnections.length === 0) {
    console.log('[connectionsApi] 1차 인맥들의 connections가 없음. 가능한 원인:');
    console.log('  - 1차 인맥들이 connections를 동기화하지 않았을 수 있음');
    console.log('  - 1차 인맥들의 connections가 is_public=false로 설정되어 있을 수 있음');
    console.log('  - RLS 정책에 의해 조회가 차단되었을 수 있음');
    return [];
  }

  // 내가 이미 아는 사람과 나 자신 제외
  const allKnownUserIds = new Set([user.id, ...firstDegreeUserIds]);
  console.log('[connectionsApi] 제외할 사용자 ID:', Array.from(allKnownUserIds));

  // 2차 인맥 후보 추출 및 공통 친구 매핑
  const candidateMap = new Map<string, Set<string>>(); // userId -> 공통 친구 user_id Set

  for (const conn of secondDegreeConnections) {
    const candidateId = conn.target_user_id;
    const commonFriendId = conn.owner_id; // 1차 인맥 = 공통 친구

    if (!allKnownUserIds.has(candidateId)) {
      if (!candidateMap.has(candidateId)) {
        candidateMap.set(candidateId, new Set());
      }
      candidateMap.get(candidateId)!.add(commonFriendId);
    }
  }

  const uniqueCandidateIds = Array.from(candidateMap.keys());
  console.log('[connectionsApi] 2차 인맥 후보 추출 결과:', {
    candidateCount: uniqueCandidateIds.length,
    candidateIds: uniqueCandidateIds,
    candidateMap: Array.from(candidateMap.entries()).map(([id, friends]) => ({
      candidateId: id,
      commonFriends: Array.from(friends),
      commonFriendsCount: friends.size,
    })),
  });

  if (uniqueCandidateIds.length === 0) {
    console.log('[connectionsApi] 2차 인맥 후보가 없음 (모두 이미 아는 사람이거나 자기 자신)');
    return [];
  }

  // profiles 조회 (공개 필드만, network_visibility 필터링)
  console.log('[connectionsApi] 2차 인맥 프로필 조회 시작:', {
    candidateIds: uniqueCandidateIds,
    candidateCount: uniqueCandidateIds.length,
  });

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, university, major, bio, avatar_url, skill_tags, network_visibility, created_at, updated_at')
    .in('user_id', uniqueCandidateIds)
    .neq('network_visibility', 'private')
    .limit(20); // 최대 20명

  if (profilesError) {
    console.error('[connectionsApi] 프로필 조회 오류:', {
      error: profilesError,
      message: profilesError.message,
      details: profilesError.details,
      hint: profilesError.hint,
      candidateIds: uniqueCandidateIds,
    });
    throw profilesError;
  }

  console.log('[connectionsApi] 프로필 조회 결과:', {
    count: profiles?.length || 0,
    profiles: profiles?.map((p: any) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      network_visibility: p.network_visibility,
    })),
  });

  // 공통 친구 정보와 함께 프로필 구성
  const result: CommunityProfile[] = (profiles ?? [])
    .filter((p: any) => {
      if (p.network_visibility === 'private') return false;
      // friends_only는 mutual connection 체크 필요하지만 MVP에서는 공개로 처리
      return true;
    })
    .map((p: any) => {
      const commonFriends = Array.from(candidateMap.get(p.user_id) || []);
      return {
        user_id: p.user_id,
        display_name: p.display_name ?? null,
        university: p.university ?? null,
        major: p.major ?? null,
        bio: p.bio ?? null,
        avatar_url: p.avatar_url ?? null,
        skill_tags: Array.isArray(p.skill_tags) ? p.skill_tags : [],
        network_visibility: (p.network_visibility || 'public') as 'public' | 'friends_only' | 'private',
        common_friends: commonFriends,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    })
    .slice(0, 20); // 최대 20명

  console.log('[connectionsApi] getSecondDegree 최종 결과:', {
    resultCount: result.length,
    results: result.map((r) => ({
      user_id: r.user_id,
      display_name: r.display_name,
      commonFriendsCount: r.common_friends?.length || 0,
    })),
  });

  return result;
}

// 2차 추천 조회 (기존 함수, 호환성 유지)
export async function getSecondDegreeRecommendations(): Promise<CommunityProfile[]> {
  const user = await getCurrentUser();
  return getSecondDegree(user.id);
}


import React, { useState, useEffect } from 'react';
import type { CommunityProfile } from '../types';
import {
  syncConnectionsFromReceivedCards,
  getMyFirstDegreeWithSnapshots,
  getSecondDegree,
} from '../api/connectionsApi';
import { supabase } from '../../../shared/infrastructure/supabaseClient';
import { useToast } from '../../../shared/ui/Toast';

type Props = {
  onProfileClick: (profile: CommunityProfile) => void;
  onSendMessage?: (userId: string) => void;
};

export function WaveTab({ onProfileClick, onSendMessage }: Props) {
  const { showToast } = useToast();
  const [firstDegree, setFirstDegree] = useState<CommunityProfile[]>([]);
  const [secondDegree, setSecondDegree] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      // 동기화 먼저 실행
      console.log('[WaveTab] connections 동기화 시작...');
      await syncConnectionsFromReceivedCards();
      console.log('[WaveTab] connections 동기화 완료');
      
      // 1차 인맥 조회 (snapshot 포함)
      console.log('[WaveTab] 1차 인맥 조회 시작...');
      const first = await getMyFirstDegreeWithSnapshots();
      console.log('[WaveTab] 1차 인맥 조회 완료:', first.length, '명');
      setFirstDegree(first);

      // 2차 추천 조회 (새로운 프라이버시 고려 함수 사용)
      try {
        console.log('[WaveTab] 2차 추천 조회 시작...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const second = await getSecondDegree(user.id);
          console.log('[WaveTab] 2차 추천 조회 완료:', second.length, '명');
          setSecondDegree(second);
          
          // 2차 인맥이 없을 때 사용자에게 안내
          if (second.length === 0 && first.length > 0) {
            console.log('[WaveTab] 2차 인맥이 없음. 가능한 원인:');
            console.log('  - 1차 인맥들이 connections를 동기화하지 않았을 수 있음');
            console.log('  - 1차 인맥들의 connections가 공개되지 않았을 수 있음');
            // 사용자에게는 조용히 처리 (너무 많은 알림 방지)
          }
        }
      } catch (err: any) {
        console.warn('[WaveTab] 2차 추천 조회 실패:', err);
        // 2차는 실패해도 계속 진행하되, 사용자에게 안내
        const errorMessage = err?.message || '알 수 없는 오류';
        if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
          console.warn('[WaveTab] RLS 정책 문제로 2차 인맥 조회 실패. 데이터베이스 마이그레이션 확인 필요.');
        }
        // 에러는 조용히 처리 (1차 인맥은 정상 작동하므로)
      }
    } catch (err: any) {
      console.error('[WaveTab] 연결 조회 오류:', err);
      showToast('연결을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncConnectionsFromReceivedCards();
      await loadConnections();
      showToast('연결이 동기화되었습니다.', 'success');
    } catch (err: any) {
      console.error('[WaveTab] 동기화 오류:', err);
      showToast('동기화에 실패했습니다.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const renderProfileList = (
    profiles: CommunityProfile[],
    title: string,
    showCommonFriends = false
  ) => {
    if (profiles.length === 0) {
      return (
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="text-sm text-slate-500">{title}이 없습니다</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {profiles.map((profile) => {
          const displayName = profile.display_name || '이름 없음';
          const initials = displayName.substring(0, 2).toUpperCase();
          const commonFriendsCount = profile.common_friends?.length || 0;
          return (
            <div
              key={profile.user_id}
              className="flex w-full items-center gap-4 rounded-2xl bg-white px-6 py-5"
            >
              <button
                type="button"
                onClick={() => onProfileClick(profile)}
                className="flex flex-1 items-center gap-4 text-left transition active:bg-slate-50"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-base font-semibold text-slate-700">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold leading-tight text-slate-900">
                      {displayName}
                    </p>
                    {showCommonFriends && commonFriendsCount > 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        공통 친구 {commonFriendsCount}명
                      </span>
                    )}
                  </div>
                  {profile.university && (
                    <p className="mt-1.5 text-base leading-relaxed text-slate-500">
                      {profile.university}
                      {profile.major && ` · ${profile.major}`}
                    </p>
                  )}
                </div>
              </button>
              {onSendMessage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendMessage(profile.user_id);
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition hover:bg-primary-100 active:bg-primary-200"
                  title="쪽지 보내기"
                >
                  <span className="text-lg">💬</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 동기화 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          {syncing ? '동기화 중...' : '연결 동기화'}
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center">
          <p className="text-base text-slate-500">불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 1차 인맥 */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">내 1차 인맥</h3>
            {renderProfileList(firstDegree, '1차 인맥')}
          </div>

          {/* 2차 추천 */}
          {secondDegree.length > 0 ? (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">2차 추천</h3>
              <p className="mb-4 text-sm text-slate-500">
                친구의 친구를 통해 만날 수 있는 사람들입니다
              </p>
              {renderProfileList(secondDegree, '2차 추천', true)}
            </div>
          ) : firstDegree.length > 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">
                2차 인맥이 아직 없습니다
              </p>
              <p className="mt-2 text-xs text-slate-500">
                1차 인맥들이 명함을 교환하고 연결을 동기화하면 2차 인맥이 표시됩니다
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}


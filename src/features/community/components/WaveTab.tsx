import React, { useState, useEffect } from 'react';
import type { CommunityProfile } from '../types';
import {
  syncConnectionsFromReceivedCards,
  getMyFirstDegree,
  getSecondDegreeRecommendations,
} from '../api/connectionsApi';
import { useToast } from '../../../shared/ui/Toast';

type Props = {
  onProfileClick: (profile: CommunityProfile) => void;
};

export function WaveTab({ onProfileClick }: Props) {
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
      await syncConnectionsFromReceivedCards();
      
      // 1차 인맥 조회
      const first = await getMyFirstDegree();
      setFirstDegree(first);

      // 2차 추천 조회
      try {
        const second = await getSecondDegreeRecommendations();
        setSecondDegree(second);
      } catch (err) {
        console.warn('[WaveTab] 2차 추천 조회 실패:', err);
        // 2차는 실패해도 계속 진행
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

  const renderProfileList = (profiles: CommunityProfile[], title: string) => {
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
          return (
            <button
              key={profile.user_id}
              type="button"
              onClick={() => onProfileClick(profile)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white px-6 py-5 text-left transition active:bg-slate-50"
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
                <p className="text-xl font-semibold leading-tight text-slate-900">
                  {displayName}
                </p>
                {profile.university && (
                  <p className="mt-1.5 text-base leading-relaxed text-slate-500">
                    {profile.university}
                    {profile.major && ` · ${profile.major}`}
                  </p>
                )}
              </div>
            </button>
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
          {secondDegree.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">2차 추천</h3>
              {renderProfileList(secondDegree, '2차 추천')}
            </div>
          )}
        </>
      )}
    </div>
  );
}


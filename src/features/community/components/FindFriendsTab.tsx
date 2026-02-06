import React, { useState, useEffect } from 'react';
import type { CommunityProfile } from '../types';
import { getProfiles } from '../api/profilesApi';
import { useToast } from '../../../shared/ui/Toast';

type Props = {
  onProfileClick: (profile: CommunityProfile) => void;
  onSendMessage?: (userId: string) => void;
};

export function FindFriendsTab({ onProfileClick, onSendMessage }: Props) {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadProfiles();
  }, [searchQuery, university, major, selectedTags]);

  // 사용 가능한 태그 목록 로드
  useEffect(() => {
    loadAvailableTags();
  }, []);

  const loadAvailableTags = async () => {
    try {
      const data = await getProfiles({});
      const allTags = new Set<string>();
      data.forEach((profile) => {
        profile.skill_tags?.forEach((tag) => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags).sort());
    } catch (err) {
      console.error('[FindFriendsTab] 태그 로드 오류:', err);
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (university) params.university = university;
      if (major) params.major = major;
      if (selectedTags.length > 0) params.tags = selectedTags;

      const data = await getProfiles(params);
      setProfiles(data);
    } catch (err: any) {
      console.error('[FindFriendsTab] 프로필 조회 오류:', err);
      showToast('프로필을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-5">
      {/* 검색/필터 */}
      <div className="space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이름, 학교, 학과, 자기소개 검색"
          className="w-full rounded-2xl border-none bg-white px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="학교"
            className="flex-1 rounded-2xl border-none bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="학과"
            className="flex-1 rounded-2xl border-none bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        
        {/* 태그 필터 */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">관심사 태그</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={[
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 프로필 리스트 */}
      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center">
          <p className="text-base text-slate-500">불러오는 중...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center">
          <p className="text-base text-slate-500">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => {
            const displayName = profile.display_name || '이름 없음';
            const initials = displayName.substring(0, 2).toUpperCase();
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
                    <p className="text-xl font-semibold leading-tight text-slate-900">
                      {displayName}
                    </p>
                    {profile.university && (
                      <p className="mt-1.5 text-base leading-relaxed text-slate-500">
                        {profile.university}
                        {profile.major && ` · ${profile.major}`}
                      </p>
                    )}
                    {profile.bio && (
                      <p className="mt-1 line-clamp-1 text-sm text-slate-400">{profile.bio}</p>
                    )}
                    {profile.skill_tags && profile.skill_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profile.skill_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
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
      )}
    </div>
  );
}


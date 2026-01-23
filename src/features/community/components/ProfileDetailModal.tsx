import React from 'react';
import type { CommunityProfile } from '../types';

type Props = {
  profile: CommunityProfile | null;
  onClose: () => void;
  onSendMessage?: (userId: string) => void;
};

export function ProfileDetailModal({ profile, onClose, onSendMessage }: Props) {
  if (!profile) return null;

  const displayName = profile.display_name || '이름 없음';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-700">
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
          <h3 className="text-xl font-semibold text-slate-900">{displayName}</h3>
          {profile.university && (
            <p className="mt-1 text-sm text-slate-500">
              {profile.university}
              {profile.major && ` · ${profile.major}`}
            </p>
          )}
        </div>
      </div>

      {/* 자기소개 */}
      {profile.bio && (
        <div>
          <p className="text-sm font-medium text-slate-400">자기소개</p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
            {profile.bio}
          </p>
        </div>
      )}

      {/* 태그 */}
      {profile.skill_tags && profile.skill_tags.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-400">관심사</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skill_tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 보내기 버튼 */}
      {onSendMessage && (
        <button
          type="button"
          onClick={() => {
            onSendMessage(profile.user_id);
            onClose();
          }}
          className="w-full rounded-2xl bg-primary-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-primary-700"
        >
          메시지 보내기
        </button>
      )}
    </div>
  );
}


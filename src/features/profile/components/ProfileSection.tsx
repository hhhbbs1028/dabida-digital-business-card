import React from 'react';
import type { Profile } from '../api/profileApi';

type Props = {
  profile: Profile;
  onEditClick: () => void;
};

export function ProfileSection({ profile, onEditClick }: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">내 프로필</h2>
        <button
          type="button"
          onClick={onEditClick}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          수정
        </button>
      </div>
      <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-3">
        {profile.email && (
          <div>
            <span className="font-semibold text-slate-700">이메일:</span>{' '}
            <span className="text-slate-600">{profile.email}</span>
          </div>
        )}
        {profile.phone && (
          <div>
            <span className="font-medium text-slate-700">전화번호:</span>{' '}
            <span className="text-slate-600">{profile.phone}</span>
          </div>
        )}
        {profile.university && (
          <div>
            <span className="font-medium text-slate-700">대학교:</span>{' '}
            <span className="text-slate-600">{profile.university}</span>
          </div>
        )}
        {profile.major && (
          <div>
            <span className="font-medium text-slate-700">전공:</span>{' '}
            <span className="text-slate-600">{profile.major}</span>
          </div>
        )}
        {profile.student_id && (
          <div>
            <span className="font-medium text-slate-700">학번/학년:</span>{' '}
            <span className="text-slate-600">{profile.student_id}</span>
          </div>
        )}
        {profile.sns?.instagram && (
          <div>
            <span className="font-medium text-slate-700">Instagram:</span>{' '}
            <span className="text-slate-600">{profile.sns.instagram}</span>
          </div>
        )}
        {profile.sns?.github && (
          <div>
            <span className="font-medium text-slate-700">GitHub:</span>{' '}
            <span className="text-slate-600">{profile.sns.github}</span>
          </div>
        )}
        {profile.sns?.website && (
          <div>
            <span className="font-medium text-slate-700">Website:</span>{' '}
            <span className="text-slate-600">{profile.sns.website}</span>
          </div>
        )}
      </div>
      {profile.skill_tags && profile.skill_tags.length > 0 && (
        <div className="mt-4">
          <span className="text-sm font-semibold text-slate-700">스킬 태그:</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skill_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


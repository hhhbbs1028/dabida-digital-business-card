import React from 'react';
import type { Profile } from '../api/profileApi';

type Props = {
  profile: Profile;
  onEditClick: () => void;
};

export function ProfileSection({ profile, onEditClick }: Props) {
  return (
    <div className="mb-6 rounded-2xl bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">내 프로필</h2>
        <button
          type="button"
          onClick={onEditClick}
          className="inline-flex items-center rounded-2xl border-none bg-slate-100 px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          수정
        </button>
      </div>
      <div className="grid gap-5 text-base text-slate-600 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-6 border-t border-slate-100 pt-6">
          <span className="text-base font-semibold text-slate-700">스킬 태그</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skill_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
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


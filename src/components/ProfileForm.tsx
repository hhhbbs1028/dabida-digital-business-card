import React, { useEffect, useState } from 'react';
import type { Profile } from '../lib/profileApi';
import { upsertMyProfile } from '../lib/profileApi';

type Props = {
  userEmail?: string | null;
  initialProfile?: Profile | null;
  isOnboarding?: boolean;
  requireStudentId?: boolean;
  requireMajor?: boolean;
  requireUniversity?: boolean;
  onSaved?: (profile: Profile) => void;
  onClose?: () => void;
};

type FormState = {
  email: string;
  name: string;
  university: string;
  major: string;
  student_id: string;
  phone: string;
  sns: {
    instagram: string;
    github: string;
    website: string;
  };
  skill_tags: string[];
};

const emptyState: FormState = {
  email: '',
  name: '',
  university: '',
  major: '',
  student_id: '',
  phone: '',
  sns: {
    instagram: '',
    github: '',
    website: '',
  },
  skill_tags: [],
};

export function ProfileForm({
  userEmail,
  initialProfile,
  isOnboarding = false,
  requireStudentId = false,
  requireMajor = false,
  requireUniversity = false,
  onSaved,
  onClose,
}: Props) {
  const [values, setValues] = useState<FormState>(emptyState);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = initialProfile;
    setValues({
      email: profile?.email ?? userEmail ?? '',
      name: profile?.name ?? '',
      university: profile?.university ?? '',
      major: profile?.major ?? '',
      student_id: profile?.student_id ?? '',
      phone: profile?.phone ?? '',
      sns: {
        instagram: profile?.sns?.instagram ?? '',
        github: profile?.sns?.github ?? '',
        website: profile?.sns?.website ?? '',
      },
      skill_tags: profile?.skill_tags ?? [],
    });
  }, [initialProfile, userEmail]);

  const update = (key: keyof FormState, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const updateSns = (key: keyof FormState['sns'], value: string) => {
    setValues((prev) => ({
      ...prev,
      sns: { ...prev.sns, [key]: value },
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (values.skill_tags.includes(tag)) {
      setTagInput('');
      return;
    }
    setValues((prev) => ({ ...prev, skill_tags: [...prev.skill_tags, tag] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setValues((prev) => ({
      ...prev,
      skill_tags: prev.skill_tags.filter((t) => t !== tag),
    }));
  };

  const validate = () => {
    if (!values.name.trim()) {
      return '이름은 필수입니다.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const saved = await upsertMyProfile({
        email: values.email,
        name: values.name,
        university: values.university,
        major: values.major,
        student_id: values.student_id,
        phone: values.phone,
        sns: values.sns,
        skill_tags: values.skill_tags,
      });
      setSuccess('프로필이 저장되었습니다.');
      onSaved?.(saved);
    } catch (err: any) {
      console.error('[ProfileForm] 저장 실패:', err);
      setError(err?.message ?? '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {isOnboarding ? '프로필 설정' : '내 프로필'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            기본 정보를 입력하면 다른 사용자에게 공유될 프로필이 완성됩니다.
          </p>
        </div>
        {onClose && !isOnboarding && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-300"
          >
            닫기
          </button>
        )}
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">이메일</label>
          <input
            type="email"
            value={values.email}
            readOnly
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">이름 *</label>
          <input
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="홍길동"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">대학교</label>
          <input
            value={values.university}
            onChange={(e) => update('university', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="Dabida University"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">전공</label>
          <input
            value={values.major}
            onChange={(e) => update('major', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="Computer Science"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">학번/학년</label>
          <input
            value={values.student_id}
            onChange={(e) => update('student_id', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="2024 / 3학년"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">전화번호</label>
          <input
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="010-0000-0000"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Instagram</label>
          <input
            value={values.sns.instagram}
            onChange={(e) => updateSns('instagram', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="@username"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">GitHub</label>
          <input
            value={values.sns.github}
            onChange={(e) => updateSns('github', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="github.com/username"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Website</label>
          <input
            value={values.sns.website}
            onChange={(e) => updateSns('website', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-slate-700">스킬 태그</label>
        <div className="flex flex-wrap gap-2">
          {values.skill_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
            placeholder="예: React"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm hover:border-slate-300"
          >
            추가
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onClose && !isOnboarding && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-300"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}



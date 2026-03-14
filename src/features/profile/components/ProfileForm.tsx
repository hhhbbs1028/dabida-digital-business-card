import React, { useEffect, useState } from 'react';
import type { Profile } from '../api/profileApi';
import { upsertMyProfile } from '../api/profileApi';

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

function formatKoreanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.startsWith('02')) {
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40';

const OptionalBadge = () => (
  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
    선택
  </span>
);

function SectionHeader({ required }: { required: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className={`h-4 w-1 rounded-full ${required ? 'bg-slate-900' : 'bg-slate-300'}`} />
      <h3 className={`text-xs font-semibold ${required ? 'text-slate-900' : 'text-slate-500'}`}>
        {required ? '필수 정보' : '선택 정보'}
      </h3>
      {!required && (
        <span className="text-[11px] text-slate-400">입력하지 않아도 됩니다</span>
      )}
    </div>
  );
}

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
    if (!values.name.trim()) return '이름은 필수입니다.';
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
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* 필수 정보 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <SectionHeader required />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              이메일
            </label>
            <input
              type="email"
              value={values.email}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
              placeholder="홍길동"
            />
          </div>
        </div>
      </div>

      {/* 선택 정보 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <SectionHeader required={false} />
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                대학교 <OptionalBadge />
              </label>
              <input
                value={values.university}
                onChange={(e) => update('university', e.target.value)}
                className={inputClass}
                placeholder="Dabida University"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                전공 <OptionalBadge />
              </label>
              <input
                value={values.major}
                onChange={(e) => update('major', e.target.value)}
                className={inputClass}
                placeholder="Computer Science"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                학번/학년 <OptionalBadge />
              </label>
              <input
                value={values.student_id}
                onChange={(e) => update('student_id', e.target.value)}
                className={inputClass}
                placeholder="2024 / 3학년"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                전화번호 <OptionalBadge />
              </label>
              <input
                type="tel"
                value={values.phone}
                onChange={(e) => update('phone', formatKoreanPhone(e.target.value))}
                className={inputClass}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              SNS <OptionalBadge />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={values.sns.instagram}
                onChange={(e) => updateSns('instagram', e.target.value)}
                className={inputClass}
                placeholder="Instagram @username"
              />
              <input
                value={values.sns.github}
                onChange={(e) => updateSns('github', e.target.value)}
                className={inputClass}
                placeholder="GitHub username"
              />
              <input
                value={values.sns.website}
                onChange={(e) => updateSns('website', e.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              스킬 태그 <OptionalBadge />
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
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
            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className={inputClass}
                placeholder="예: React"
              />
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-xs hover:border-slate-300"
              >
                추가
              </button>
            </div>
          </div>
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

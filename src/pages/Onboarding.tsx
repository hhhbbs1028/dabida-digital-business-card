import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getMyProfile, upsertMyProfile, type Profile } from '../features/profile/api/profileApi';

type FormState = {
  name: string;
  university: string;
  major: string;
  phone: string;
  sns: {
    instagram: string;
    github: string;
    website: string;
  };
  skill_tags: string[];
};

const emptyForm: FormState = {
  name: '',
  university: '',
  major: '',
  phone: '',
  sns: {
    instagram: '',
    github: '',
    website: '',
  },
  skill_tags: [],
};

export function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      const p = await getMyProfile();
      if (p) {
        setProfile(p);
        setForm({
          name: p.name ?? '',
          university: p.university ?? '',
          major: p.major ?? '',
          phone: p.phone ?? '',
          sns: {
            instagram: p.sns?.instagram ?? '',
            github: p.sns?.github ?? '',
            website: p.sns?.website ?? '',
          },
          skill_tags: p.skill_tags ?? [],
        });
      }
    };

    void loadProfile();
  }, [user, authLoading, navigate]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSns = (key: keyof FormState['sns'], value: string) => {
    setForm((prev) => ({
      ...prev,
      sns: { ...prev.sns, [key]: value },
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.skill_tags.includes(tag)) {
      setTagInput('');
      return;
    }
    setForm((prev) => ({ ...prev, skill_tags: [...prev.skill_tags, tag] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      skill_tags: prev.skill_tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('이름은 필수입니다.');
      return;
    }

    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    setSaving(true);
    try {
      const saved = await upsertMyProfile({
        email: user.email ?? undefined,
        name: form.name,
        university: form.university || undefined,
        major: form.major || undefined,
        phone: form.phone || undefined,
        sns: {
          instagram: form.sns.instagram || undefined,
          github: form.sns.github || undefined,
          website: form.sns.website || undefined,
        },
        skill_tags: form.skill_tags,
      });

      console.log('[Onboarding] 프로필 저장 완료:', saved);
      navigate('/app');
    } catch (err: any) {
      console.error('[Onboarding] 프로필 저장 실패:', err);
      setError(err?.message ?? '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">프로필 설정</h1>
          <p className="text-sm text-slate-600">
            기본 정보를 입력하면 다른 사용자에게 공유될 프로필이 완성됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* 이름 (필수) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                placeholder="홍길동"
              />
            </div>

            {/* 대학교 / 전공 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">대학교</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => update('university', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="Dabida University"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">전공</label>
                <input
                  type="text"
                  value={form.major}
                  onChange={(e) => update('major', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="Computer Science"
                />
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                placeholder="010-0000-0000"
              />
            </div>

            {/* SNS */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">SNS</label>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <input
                    type="text"
                    value={form.sns.instagram}
                    onChange={(e) => updateSns('instagram', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                    placeholder="Instagram @username"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={form.sns.github}
                    onChange={(e) => updateSns('github', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                    placeholder="GitHub username"
                  />
                </div>
                <div>
                  <input
                    type="url"
                    value={form.sns.website}
                    onChange={(e) => updateSns('website', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* 스킬 태그 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">스킬 태그</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {form.skill_tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="예: React, TypeScript"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  추가
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              나중에
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장하고 시작하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ensureProfileRow, isProfileComplete, maybeAdvanceOnboardingStep, resolveNextRoute } from '../lib/onboardingFlow';
import type { Profile } from '../lib/profileApi';
import { upsertMyProfile } from '../lib/profileApi';

const COLOR_OPTIONS = ['#0f766e', '#2563eb', '#7c3aed', '#f97316', '#ef4444', '#0f172a'];
const FONT_OPTIONS: Array<'sans' | 'serif' | 'mono'> = ['sans', 'serif', 'mono'];

export function TemplateSelectPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null as Profile | null);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [themeColor, setThemeColor] = useState(COLOR_OPTIONS[0]);
  const [fontFamily, setFontFamily] = useState('sans' as 'sans' | 'serif' | 'mono');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!user) return;
      const p = await ensureProfileRow();
      if (!ignore) {
        setProfile(p);
        setSelectedTemplate(p.selected_template_id ?? 1);
        setThemeColor(p.selected_theme_color ?? COLOR_OPTIONS[0]);
        setFontFamily((p.selected_font_family as any) ?? 'sans');
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile && !isProfileComplete(profile)) {
      navigate('/profile-setup');
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (loading) return;
    resolveNextRoute()
      .then((result) => {
        if (result.nextRoute !== '/template' && result.nextRoute !== '/complete') {
          navigate(result.nextRoute);
        }
      })
      .catch((err) => console.error('[TemplateSelectPage] flow error', err));
  }, [loading, navigate]);

  const templateCards = useMemo(
    () => [
      {
        id: 1,
        title: 'Template 1',
        description: '왼쪽 컬러 바 + 정보 중심 레이아웃',
      },
      {
        id: 2,
        title: 'Template 2',
        description: '중앙 정렬 + 심플 카드 레이아웃',
      },
    ],
    [],
  );

  const handleConfirm = async () => {
    setError(null);
    setSaving(true);
    try {
      const saved = await upsertMyProfile({
        selected_template_id: selectedTemplate,
        selected_theme_color: themeColor,
        selected_font_family: fontFamily,
        onboarding_step: 'DONE',
      });
      setProfile(saved);
      await maybeAdvanceOnboardingStep(saved, 'DONE');
      navigate('/complete');
    } catch (err: any) {
      console.error('[TemplateSelectPage] 저장 오류:', err);
      setError(err?.message ?? '템플릿 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">템플릿 선택</h1>
          <p className="text-xs text-slate-500">
            명함에 사용할 기본 템플릿과 스타일을 선택하세요.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {templateCards.map((tpl) => {
            const isActive = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={[
                  'rounded-2xl border px-4 py-4 text-left shadow-sm transition',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
                ].join(' ')}
              >
                <div className="text-sm font-semibold">{tpl.title}</div>
                <div className="mt-1 text-[11px] text-slate-300">
                  {tpl.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[200px,1fr]">
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">테마 컬러</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setThemeColor(color)}
                  className={[
                    'h-8 w-8 rounded-full border-2',
                    themeColor === color ? 'border-slate-900' : 'border-transparent',
                  ].join(' ')}
                >
                  <span
                    className="block h-6 w-6 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">폰트</p>
            <div className="flex gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => setFontFamily(font)}
                  className={[
                    'flex-1 rounded-xl border px-3 py-2 text-xs',
                    fontFamily === font
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '저장 중...' : '선택 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}



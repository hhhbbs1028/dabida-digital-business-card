import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { upsertMyProfile } from '../lib/profileApi';
import { resolveNextRoute } from '../lib/onboardingFlow';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    resolveNextRoute()
      .then((result) => {
        if (result.nextRoute !== '/onboarding') {
          navigate(result.nextRoute);
        }
      })
      .catch((err) => console.error('[OnboardingPage] flow error', err));
  }, [loading, user, navigate]);

  const handleStart = async () => {
    if (user) {
      try {
        await upsertMyProfile({ onboarding_step: 'AUTH' });
      } catch (err) {
        console.error('[OnboardingPage] 온보딩 단계 업데이트 실패:', err);
      }
    }
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">디지털 명함 시작하기</h1>
          <p className="text-sm text-slate-500">
            간단한 단계만 거치면 나만의 명함을 빠르게 만들 수 있어요.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            '간편 소셜/대학 이메일 로그인',
            '학과/학번 기반 프로필 생성',
            '템플릿 기반 명함 제작',
            'QR/블루투스 교환(coming soon)',
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}



import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { resolveNextRoute } from '../lib/onboardingFlow';

export function CompletePage() {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    resolveNextRoute()
      .then((result) => {
        if (result.nextRoute !== '/studio' && result.nextRoute !== '/complete') {
          navigate(result.nextRoute);
        }
      })
      .catch((err) => console.error('[CompletePage] flow error', err));
  }, [loading, navigate]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">설정 완료!</h1>
        <p className="mt-2 text-sm text-slate-500">
          이제 디지털 명함 스튜디오로 이동하여 명함을 만들어보세요.
        </p>
        <button
          type="button"
          onClick={() => navigate('/studio')}
          className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          명함 만들러 가기
        </button>
      </div>
    </div>
  );
}



import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthButtons } from '../features/auth/components/AuthButtons';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  // returnUrl이 있으면 세션 스토리지에 저장 (OAuth 리다이렉트 후 복구용)
  React.useEffect(() => {
    if (returnUrl) {
      sessionStorage.setItem('authReturnUrl', returnUrl);
    }
  }, [returnUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">로그인</h1>
          <p className="text-sm text-slate-600">
            소셜 계정으로 간편하게 로그인하세요.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AuthButtons />
        </div>
      </div>
    </div>
  );
}

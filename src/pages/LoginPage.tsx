import React from 'react';
import { AuthButtons } from '../features/auth/components/AuthButtons';

export function LoginPage() {
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

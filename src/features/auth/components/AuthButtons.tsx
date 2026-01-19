import React, { useState } from 'react';
import { supabase } from '../../../shared/infrastructure/supabaseClient';

type Provider = 'google' | 'github' | 'apple';

export function AuthButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: Provider) => {
    setLoading(provider);
    setError(null);

    try {
      // 현재 접속 주소에 맞게 자동으로 리다이렉트 URL 생성
      // - PC 로컬: http://localhost:5173/auth/callback
      // - 폰 로컬: http://172.30.1.50:5173/auth/callback
      // - 프로덕션: https://dabida-digital-business-card.pages.dev/auth/callback
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      console.log(`[AuthButtons] ${provider} 로그인 시작`, {
        origin: window.location.origin,
        redirectTo,
        fullUrl: window.location.href,
      });

      // redirectTo가 절대 URL인지 확인
      if (!redirectTo.startsWith('http://') && !redirectTo.startsWith('https://')) {
        throw new Error(`잘못된 리다이렉트 URL: ${redirectTo}`);
      }

      // Supabase OAuth 로그인
      // redirectTo를 명시적으로 전달하여 현재 origin으로 리다이렉트되도록 함
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo,
          skipBrowserRedirect: false,
        },
      });

      // 디버깅: 실제 전달되는 URL 확인
      console.log(`[AuthButtons] ${provider} OAuth 응답:`, {
        data,
        error: signInError,
        redirectTo,
        expectedUrl: redirectTo,
      });

      if (signInError) {
        console.error(`[AuthButtons] ${provider} 로그인 오류:`, signInError);
        setError(signInError.message);
        setLoading(null);
      } else {
        console.log(`[AuthButtons] ${provider} 로그인 리다이렉트 완료`);
      }
    } catch (err: any) {
      console.error(`[AuthButtons] ${provider} 로그인 실패:`, err);
      setError(err?.message ?? '로그인 중 오류가 발생했습니다.');
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={() => handleOAuthLogin('google')}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading === 'google' ? (
          <span className="text-xs">로그인 중...</span>
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google로 로그인</span>
          </>
        )}
      </button>

      <button
        onClick={() => handleOAuthLogin('github')}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading === 'github' ? (
          <span className="text-xs">로그인 중...</span>
        ) : (
          <>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>GitHub로 로그인</span>
          </>
        )}
      </button>

      <button
        onClick={() => handleOAuthLogin('apple')}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading === 'apple' ? (
          <span className="text-xs">로그인 중...</span>
        ) : (
          <>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>Apple로 로그인</span>
          </>
        )}
      </button>
    </div>
  );
}

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[SignOutButton] 로그아웃 시작...');
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('[SignOutButton] 로그아웃 오류:', signOutError);
        setError(signOutError.message);
      } else {
        console.log('[SignOutButton] 로그아웃 완료');
      }
    } catch (err: any) {
      console.error('[SignOutButton] 로그아웃 실패:', err);
      setError(err?.message ?? '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? '로그아웃 중...' : '로그아웃'}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}


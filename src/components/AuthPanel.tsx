import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthPanel() {
  const { user, loading, error, signInWithGithub, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setEmailLoading(true);
    setEmailSent(false);
    try {
      await signInWithEmail(email.trim());
      setEmailSent(true);
      setEmail('');
    } catch (err) {
      // 에러는 useAuth에서 처리됨
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setGithubLoading(true);
    try {
      await signInWithGithub();
    } catch (err) {
      // 에러는 useAuth에서 처리됨
    } finally {
      setGithubLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        <span>확인 중...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden text-xs text-slate-600 sm:block">
          <span className="font-medium">{user.email}</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await signOut();
            } catch (err) {
              // 에러는 useAuth에서 처리됨
            }
          }}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          로그아웃
        </button>
        {error && (
          <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {emailSent && (
        <div className="max-w-xs rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700">
          로그인 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* GitHub 로그인 */}
        <button
          type="button"
          disabled={githubLoading || emailLoading}
          onClick={handleGithubLogin}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {githubLoading ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>연결 중...</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub로 로그인</span>
            </>
          )}
        </button>

        {/* 이메일 로그인 */}
        <form onSubmit={handleEmailSubmit} className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            disabled={emailLoading || githubLoading}
            className="w-40 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={emailLoading || githubLoading || !email.trim()}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {emailLoading ? (
              <>
                <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                <span>전송 중...</span>
              </>
            ) : (
              '링크 전송'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}


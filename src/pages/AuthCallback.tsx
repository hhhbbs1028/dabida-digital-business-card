import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../shared/infrastructure/supabaseClient';
import { getMyProfile } from '../features/profile/api/profileApi';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] OAuth callback 처리 시작');

        // URL에서 hash fragment 확인 (OAuth redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const errorParam = hashParams.get('error');

        if (errorParam) {
          console.error('[AuthCallback] OAuth 오류:', errorParam);
          setError(`로그인 실패: ${errorParam}`);
          setStatus('error');
          return;
        }

        // 세션 확인 (타임아웃 추가)
        let session = null;
        let sessionError = null;
        
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null }, error: Error }>((resolve) => {
            setTimeout(() => {
              console.warn('[AuthCallback] 세션 확인 타임아웃 (5초)');
              resolve({
                data: { session: null },
                error: new Error('세션 확인 타임아웃'),
              });
            }, 5000);
          });
          
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result.data.session;
          sessionError = result.error;
        } catch (err: any) {
          console.error('[AuthCallback] 세션 확인 중 오류:', err);
          sessionError = err;
        }

        if (sessionError) {
          console.error('[AuthCallback] 세션 확인 오류:', sessionError);
          // 네트워크 오류는 무시하고 계속 진행
          if (sessionError.message?.includes('타임아웃') || 
              sessionError.message?.includes('Failed to fetch')) {
            console.warn('[AuthCallback] 네트워크 오류 무시하고 로그인 페이지로 이동');
            if (mounted) {
              navigate('/login');
            }
            return;
          }
          setError(`세션 확인 실패: ${sessionError.message}`);
          setStatus('error');
          return;
        }

        if (!session?.user) {
          console.warn('[AuthCallback] 세션이 없습니다. 로그인 페이지로 이동');
          if (mounted) {
            navigate('/login');
          }
          return;
        }

        console.log('[AuthCallback] 로그인 성공:', session.user.email);

        // returnUrl 확인 (쿼리 파라미터 또는 세션 스토리지에서)
        const returnUrl = searchParams.get('returnUrl') || sessionStorage.getItem('authReturnUrl');
        if (returnUrl) {
          sessionStorage.removeItem('authReturnUrl');
          console.log('[AuthCallback] returnUrl로 이동:', returnUrl);
          if (mounted) {
            setStatus('redirecting');
            // returnUrl에 이미 쿼리 파라미터가 있으면 그대로 사용, 없으면 추가
            navigate(returnUrl);
          }
          return;
        }

        // 프로필 확인 (타임아웃 추가)
        let profile = null;
        try {
          const profilePromise = getMyProfile();
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              console.warn('[AuthCallback] 프로필 조회 타임아웃 (5초)');
              resolve(null);
            }, 5000);
          });
          
          profile = await Promise.race([profilePromise, timeoutPromise]);
          console.log('[AuthCallback] 프로필 확인:', profile ? '있음' : '없음');
        } catch (profileError: any) {
          console.error('[AuthCallback] 프로필 조회 오류:', profileError);
          // 프로필 조회 실패해도 계속 진행 (프로필 없음으로 처리)
          profile = null;
        }

        if (mounted) {
          setStatus('redirecting');
          // 프로필이 없으면 온보딩, 있으면 앱으로
          if (!profile || !profile.name) {
            console.log('[AuthCallback] 프로필 없음 → /onboarding');
            navigate('/onboarding');
          } else {
            console.log('[AuthCallback] 프로필 있음 → /app');
            navigate('/app');
          }
        }
      } catch (err: any) {
        console.error('[AuthCallback] 처리 중 오류:', err);
        if (mounted) {
          setError(err?.message ?? '인증 처리 중 오류가 발생했습니다.');
          setStatus('error');
        }
      }
    };

    void handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams]);

  if (status === 'checking' || status === 'redirecting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          <p className="text-sm text-slate-600">
            {status === 'checking' ? '로그인 확인 중...' : '이동 중...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-lg font-semibold text-slate-900">로그인 오류</h1>
          <p className="mb-4 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}


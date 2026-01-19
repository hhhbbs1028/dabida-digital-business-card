import { useEffect, useState } from 'react';
import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
};

type AuthActions = {
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState(null as User | null);
  const [session, setSession] = useState(null as Session | null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    let mounted = true;

    // 초기 세션 확인
    const initSession = async () => {
      try {
        console.log('[useAuth] 초기 세션 확인 중...', {
          location: window.location.href,
          origin: window.location.origin,
        });
        
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[useAuth] 세션 확인 오류:', {
            message: sessionError.message,
            status: sessionError.status,
            error: sessionError,
          });
          // "requested path is invalid" 오류는 무시하고 계속 진행
          if (sessionError.message?.includes('requested path is invalid')) {
            console.warn('[useAuth] 경로 오류 무시하고 계속 진행');
            if (mounted) {
              setSession(null);
              setUser(null);
              setLoading(false);
            }
            return;
          }
          setError(sessionError.message);
          return;
        }

        if (mounted) {
          console.log('[useAuth] 세션 확인 완료:', session ? '로그인됨' : '로그아웃됨');
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[useAuth] 초기화 오류:', {
          message: err?.message,
          error: err,
          stack: err?.stack,
        });
        if (mounted) {
          // 네트워크 오류나 경로 오류는 무시하고 계속 진행
          if (err?.message?.includes('requested path is invalid') || 
              err?.message?.includes('Failed to fetch')) {
            console.warn('[useAuth] 네트워크/경로 오류 무시하고 계속 진행');
            setSession(null);
            setUser(null);
            setLoading(false);
          } else {
            setError(err?.message ?? '인증 초기화 중 오류가 발생했습니다.');
            setLoading(false);
          }
        }
      }
    };

    void initSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] 인증 상태 변경:', event, session ? '세션 있음' : '세션 없음');

      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null);

        if (event === 'SIGNED_OUT') {
          console.log('[useAuth] 로그아웃 완료');
        } else if (event === 'SIGNED_IN') {
          console.log('[useAuth] 로그인 완료:', session?.user?.email);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[useAuth] 토큰 갱신됨');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  const signOut = async () => {
    try {
      setError(null);
      console.log('[useAuth] 로그아웃 시작...');

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('[useAuth] 로그아웃 오류:', signOutError);
        setError(signOutError.message);
        throw signOutError;
      }

      console.log('[useAuth] 로그아웃 완료');
    } catch (err: any) {
      console.error('[useAuth] 로그아웃 실패:', err);
      setError(err?.message ?? '로그아웃 중 오류가 발생했습니다.');
      throw err;
    }
  };

  return {
    user,
    session,
    loading,
    error,
    signOut,
  };
}


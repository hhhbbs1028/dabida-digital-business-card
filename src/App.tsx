import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { Onboarding } from './pages/Onboarding';
import { AppPage } from './pages/AppPage';
import { PublicCardPage } from './pages/PublicCardPage';
import { supabase } from './shared/infrastructure/supabaseClient';
import { getMyProfile } from './features/profile/api/profileApi';
import { consumeBackIntercept } from './shared/utils/backIntercept';

/**
 * Android 뒤로가기 버튼 핸들러.
 * 루트 페이지(/login, /app)에서 뒤로가기 시 앱 종료 확인, 다른 페이지에서는 navigate(-1).
 */
function BackButtonHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let lastBackPress = 0;

    const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (consumeBackIntercept()) return;
      if (canGoBack) {
        navigate(-1);
      } else {
        // 루트에서 연속 2회 뒤로가기 시 종료
        const now = Date.now();
        if (now - lastBackPress < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPress = now;
        }
      }
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, [navigate]);

  return null;
}

/**
 * 네이티브 앱 딥링크 핸들러.
 * Chrome Custom Tab에서 OAuth 완료 후 com.dabida.digitalcard://login-callback 으로
 * 리다이렉트되면 이 컴포넌트가 토큰을 받아 세션을 설정하고 적절한 페이지로 이동.
 */
function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('com.dabida.digitalcard://login-callback')) return;

      console.log('[DeepLinkHandler] 딥링크 수신:', url);

      // PKCE flow: ?code=... (Supabase v2 기본값)
      // Implicit flow: #access_token=... (레거시)
      let urlObj: URL;
      try {
        urlObj = new URL(url);
      } catch {
        console.error('[DeepLinkHandler] URL 파싱 실패:', url);
        await Browser.close();
        navigate('/login');
        return;
      }

      const code = urlObj.searchParams.get('code');
      const errorParam = urlObj.searchParams.get('error')
        || new URLSearchParams(url.split('#')[1] ?? '').get('error');

      // Implicit flow fallback
      const hash = url.split('#')[1] ?? '';
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      await Browser.close();

      if (errorParam) {
        console.error('[DeepLinkHandler] OAuth 오류:', errorParam);
        navigate('/login');
        return;
      }

      let sessionError: unknown = null;

      if (code) {
        // PKCE: authorization code → session 교환
        console.log('[DeepLinkHandler] PKCE code 교환 시작');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        sessionError = error;
      } else if (accessToken && refreshToken) {
        // Implicit: 토큰 직접 설정
        console.log('[DeepLinkHandler] Implicit 토큰으로 세션 설정');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        sessionError = error;
      } else {
        console.error('[DeepLinkHandler] code도 token도 없음. URL:', url);
        navigate('/login');
        return;
      }

      if (sessionError) {
        console.error('[DeepLinkHandler] 세션 설정 실패:', sessionError);
        navigate('/login');
        return;
      }

      const profile = await getMyProfile().catch(() => null);
      navigate(profile?.name ? '/app' : '/onboarding', { replace: true });
    }).then((listener) => {
      cleanup = () => listener.remove();
    });

    return () => cleanup?.();
  }, [navigate]);

  return null;
}

export default function App() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <DeepLinkHandler />
      <BackButtonHandler />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/c/:cardId" element={<PublicCardPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}



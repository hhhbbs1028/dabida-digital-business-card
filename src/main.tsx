import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './shared/ui/Toast';

// 초기화 로그
console.log('[main] 앱 시작', {
  location: window.location.href,
  origin: window.location.origin,
  userAgent: navigator.userAgent,
  mode: import.meta.env.MODE,
});

try {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </React.StrictMode>,
  );
  console.log('[main] 앱 렌더링 완료');
} catch (error) {
  console.error('[main] 앱 렌더링 실패:', error);
  // 오류가 발생해도 사용자에게 표시
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>앱 로드 오류</h1>
        <p>${error instanceof Error ? error.message : '알 수 없는 오류'}</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          콘솔을 확인하세요 (F12)
        </p>
      </div>
    `;
  }
}



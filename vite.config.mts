import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

// HTTPS 사용 여부를 환경변수로 제어 (기본값: false)
const useHttps = process.env.VITE_USE_HTTPS === 'true';

export default defineConfig({
  plugins: [
    react(),
    // HTTPS를 사용할 때만 mkcert 플러그인 활성화
    ...(useHttps ? [mkcert()] : []),
  ],
  root: '.',
  publicDir: 'public',
  server: {
    host: true, // 외부 접근 허용 (--host 플래그와 동일)
    port: 5173,
    https: useHttps, // 환경변수에 따라 HTTPS 활성화
    // ngrok 및 모든 호스트 허용 (개발 환경용)
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok-free.dev',
      'localhost',
      '127.0.0.1',
    ],
    // 또는 모든 호스트 허용 (더 간단하지만 보안상 주의)
    // strictPort: false,
    // 캐시 방지 헤더 추가
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  build: {
    outDir: 'dist',
  },
});


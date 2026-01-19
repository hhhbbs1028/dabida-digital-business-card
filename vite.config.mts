import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    host: true, // 외부 접근 허용 (--host 플래그와 동일)
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});


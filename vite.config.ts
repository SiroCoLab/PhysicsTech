import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Local development: the backend (docker compose or uvicorn) runs on http://localhost:8000;
// requests to /api are proxied there, so the app and the API share one origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || 'http://localhost:8000';
  return {
    base: './',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: false,
      proxy: { '/api': { target, changeOrigin: true } },
    },
    preview: { port: 4173, proxy: { '/api': { target, changeOrigin: true } } },
    build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1500 },
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      testTimeout: 60000,
    },
  };
});

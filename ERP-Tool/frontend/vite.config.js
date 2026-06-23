import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetUrl = env.VITE_API_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api/v1/ai': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/api': {
          target: targetUrl,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: true,
    },
  };
});

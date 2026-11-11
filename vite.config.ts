import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Khi chạy `npm run dev`, cho gõ /admin hoặc /admin/ vào đúng trang quản trị (public/admin/index.html). */
const adminRoute = (): Plugin => ({
  name: 'admin-route',
  configureServer(server) {
    server.middlewares.use((req: { url?: string }, _res: unknown, next: () => void) => {
      const m = req.url?.match(/^\/admin(\/sveltia)?\/?(\?.*)?$/);
      if (m) req.url = `/admin${m[1] ?? ''}/index.html`;
      next();
    });
  },
});

// base './' → thư mục dist chạy được ở mọi nơi (GitHub Pages, Netlify, hosting thường...)
// Build nhiều trang: index.html (trang chủ) + portfolio.html (trang portfolio đầy đủ)
export default defineConfig({
  base: './',
  plugins: [react(), adminRoute()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        portfolio: 'portfolio.html',
      },
    },
  },
});

import { defineConfig } from 'umi';

export default defineConfig({
  title: 'Health Journey',
  metas: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    },
    { name: 'theme-color', content: '#10b981' },
  ],
  routes: [
    {
      path: '/',
      component: '@/layouts/index',
      routes: [
        { path: '/', component: 'index' },
        { path: '/body', component: 'body' },
        { path: '/meals', component: 'meals' },
        { path: '/activity', component: 'activity' },
        { path: '/settings', component: 'settings' },
      ],
    },
  ],
  npmClient: 'npm',
  hash: true,
  // Vercel 静态托管：SPA 回退由 vercel.json rewrites 处理
  history: { type: 'browser' },
  jsMinifier: 'terser',
});

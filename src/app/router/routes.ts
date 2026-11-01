import type { RouteRecordRaw } from 'vue-router'

// 所有页面均通过动态 import 懒加载，配合 Vite 自动代码分割，
// 首屏只加载当前路由所需的 chunk，其余按需加载。
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/home/pages/HomePage.vue'),
    meta: { title: '首页', layout: 'default' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { title: '登录', layout: 'blank' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
    meta: { title: '面板', layout: 'default', requiresAuth: true },
  },
  {
    path: '/notes',
    name: 'notes',
    component: () => import('@/modules/notes/pages/NotesPage.vue'),
    meta: { title: '笔记', layout: 'default', requiresAuth: true },
  },
  {
    path: '/notes/new',
    name: 'note-new',
    component: () => import('@/modules/notes/pages/NotesEditorPage.vue'),
    meta: { title: '新建笔记', layout: 'default', requiresAuth: true, fullBleed: true },
  },
  {
    path: '/notes/:id/edit',
    name: 'note-edit',
    component: () => import('@/modules/notes/pages/NotesEditorPage.vue'),
    meta: { title: '编辑笔记', layout: 'default', requiresAuth: true, fullBleed: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/modules/home/pages/NotFoundPage.vue'),
    meta: { title: '页面未找到', layout: 'default' },
  },
]

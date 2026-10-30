import type { Router } from 'vue-router'

export function setupGuards(router: Router): void {
  router.beforeEach((to) => {
    const title = to.meta.title
    document.title = title ? `${title} · Hello!Note` : 'Hello!Note'
    // 后续接入登录后：若 meta.requiresAuth 为 true 且未登录，则重定向至 /login
    return true
  })
}

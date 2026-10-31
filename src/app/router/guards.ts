import type { Router } from 'vue-router'
import { useAuthStore } from '@/modules/auth'

export function setupGuards(router: Router): void {
  router.beforeEach((to) => {
    const title = to.meta.title
    document.title = title ? `${title} · Hello!Note` : 'Hello!Note'

    // 需要登录但未登录：重定向到登录页，并记录来源以便登录后回跳
    if (to.meta.requiresAuth) {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    }
    return true
  })
}

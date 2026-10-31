<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth'
import AppIcon from '@/components/common/AppIcon.vue'
import ThemeSwitcher from '@/components/feedback/ThemeSwitcher.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const auth = useAuthStore()
const router = useRouter()

function handleLogout(): void {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="topbar-actions">
    <ThemeSwitcher />

    <template v-if="auth.isAuthenticated">
      <span class="topbar-actions__user">
        <AppIcon name="user" :size="16" />
        {{ auth.user?.displayName }}
      </span>
      <BaseButton variant="ghost" size="sm" @click="handleLogout">
        <AppIcon name="logout" :size="16" />
        退出
      </BaseButton>
    </template>

    <RouterLink v-else to="/login" class="topbar-actions__login">
      <AppIcon name="user" :size="16" />
      登录
    </RouterLink>
  </div>
</template>

<style scoped>
.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.topbar-actions__user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-actions__login {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease-standard);
}
.topbar-actions__login:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}
</style>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ThemeSwitcher from '@/components/feedback/ThemeSwitcher.vue'
import { useAppStore } from '@/stores/app.store'

const appStore = useAppStore()

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/dashboard', label: '面板' },
]
</script>

<template>
  <header class="app-header glass-panel">
    <div class="app-header__left">
      <button class="app-header__menu" aria-label="切换菜单" @click="appStore.toggleSidebar()">
        <AppIcon name="menu" :size="20" />
      </button>
      <RouterLink to="/" class="app-header__brand">
        <AppLogo show-text />
      </RouterLink>
    </div>

    <nav class="app-header__nav">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="app-header__link"
        active-class="is-active"
      >
        {{ link.label }}
      </RouterLink>
    </nav>

    <div class="app-header__right">
      <ThemeSwitcher />
      <!-- 登录页后续实现；当前先导向面板作为占位入口 -->
      <RouterLink to="/dashboard">
        <BaseButton variant="primary" size="sm">登录</BaseButton>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  height: var(--header-height);
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--border-default);
}
.app-header__left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.app-header__menu {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.app-header__menu:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.app-header__brand {
  display: inline-flex;
}
.app-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 auto;
}
.app-header__link {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-standard);
}
.app-header__link:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}
.app-header__link.is-active {
  color: var(--text-primary);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

@media (max-width: 768px) {
  .app-header__menu {
    display: inline-flex;
  }
  .app-header__nav {
    display: none;
  }
  .app-header {
    padding: 0 var(--space-4);
  }
}
</style>

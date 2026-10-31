<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import { useAppStore } from '@/stores/app.store'

const appStore = useAppStore()

const mainLinks = [
  { to: '/', label: '首页', icon: 'home' as IconName },
  { to: '/dashboard', label: '面板', icon: 'grid' as IconName },
]
const soonLinks = [
  { label: '笔记', icon: 'note' as IconName },
  { label: '标签', icon: 'tag' as IconName },
  { label: '搜索', icon: 'search' as IconName },
]
</script>

<template>
  <aside class="app-sidebar" :class="{ 'is-open': appStore.sidebarOpen }">
    <nav class="app-sidebar__nav">
      <p class="app-sidebar__group">主导航</p>
      <RouterLink
        v-for="link in mainLinks"
        :key="link.to"
        :to="link.to"
        class="app-sidebar__link"
        active-class="is-active"
        @click="appStore.closeSidebar()"
      >
        <AppIcon :name="link.icon" :size="18" />
        <span>{{ link.label }}</span>
      </RouterLink>

      <p class="app-sidebar__group">即将推出</p>
      <div v-for="link in soonLinks" :key="link.label" class="app-sidebar__link is-disabled">
        <AppIcon :name="link.icon" :size="18" />
        <span>{{ link.label }}</span>
      </div>
    </nav>

    <div class="app-sidebar__foot">
      <p class="app-sidebar__hint">Hello!Note · v0.1</p>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-6) var(--space-4);
  border-right: 1px solid var(--border-default);
  background: var(--bg-primary);
  height: calc(100vh - var(--header-height));
  position: sticky;
  top: var(--header-height);
  overflow-y: auto;
}
.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.app-sidebar__group {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: var(--space-4) var(--space-3) var(--space-2);
}
.app-sidebar__group:first-child {
  padding-top: 0;
}
.app-sidebar__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.app-sidebar__link:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}
.app-sidebar__link.is-active {
  color: var(--text-primary);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.app-sidebar__link.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.app-sidebar__link.is-disabled:hover {
  background: transparent;
  color: var(--text-secondary);
}
.app-sidebar__foot {
  padding: var(--space-3);
}
.app-sidebar__hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    top: var(--header-height);
    left: 0;
    bottom: 0;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-standard);
    box-shadow: var(--shadow-floating);
  }
  .app-sidebar.is-open {
    transform: translateX(0);
  }
}
</style>

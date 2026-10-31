<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/modules/auth'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeSwitcher from '@/components/feedback/ThemeSwitcher.vue'

const app = useAppStore()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const { isMobile, mobileOpen, sidebarCollapsed } = storeToRefs(app)

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const navItems: NavItem[] = [
  { to: '/', label: '首页', icon: 'home' },
  { to: '/dashboard', label: '面板', icon: 'grid' },
]

function handleLogout(): void {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <!-- 移动端浮动菜单按钮 -->
  <button
    v-if="isMobile"
    class="sidebar-fab"
    :class="{ 'is-hidden': mobileOpen }"
    aria-label="打开菜单"
    @click="app.toggleMobile"
  >
    <AppIcon name="menu" :size="20" />
  </button>

  <!-- 移动端遮罩 -->
  <Transition name="fade">
    <div v-if="isMobile && mobileOpen" class="sidebar-backdrop" @click="app.closeMobile" />
  </Transition>

  <aside
    class="sidebar"
    :class="{
      'sidebar--collapsed': sidebarCollapsed,
      'sidebar--mobile': isMobile,
      'is-open': isMobile && mobileOpen,
    }"
  >
    <div class="sidebar__top">
      <RouterLink to="/" class="sidebar__brand" @click="app.closeMobile">
        <AppLogo :show-text="!sidebarCollapsed" />
      </RouterLink>
      <button
        v-if="!isMobile"
        class="sidebar__toggle"
        :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="app.toggleCollapsed"
      >
        <AppIcon :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" :size="18" />
      </button>
      <button v-else class="sidebar__toggle" aria-label="关闭菜单" @click="app.closeMobile">
        <AppIcon name="close" :size="18" />
      </button>
    </div>

    <nav class="sidebar__nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__link"
        :class="{ 'is-active': route.path === item.to }"
        :title="sidebarCollapsed && !isMobile ? item.label : undefined"
        @click="app.closeMobile"
      >
        <AppIcon :name="item.icon" :size="20" class="sidebar__link-icon" />
        <span class="sidebar__link-label">{{ item.label }}</span>
      </RouterLink>

      <div class="sidebar__link sidebar__link--muted" title="即将上线">
        <AppIcon name="note" :size="20" class="sidebar__link-icon" />
        <span class="sidebar__link-label">笔记</span>
      </div>
    </nav>

    <div class="sidebar__footer">
      <ThemeSwitcher />

      <div v-if="auth.isAuthenticated" class="sidebar__user">
        <span class="sidebar__user-name">{{ auth.user?.displayName }}</span>
        <button class="sidebar__logout" @click="handleLogout">
          <AppIcon name="logout" :size="16" />
          <span v-if="!sidebarCollapsed">退出</span>
        </button>
      </div>

      <RouterLink v-else to="/login" class="sidebar__login" @click="app.closeMobile">
        <AppIcon name="user" :size="18" />
        <span v-if="!sidebarCollapsed">登录</span>
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-card);
  border-right: 1px solid var(--border-default);
  backdrop-filter: blur(8px);
  transition: width var(--duration-base) var(--ease-standard);
  z-index: 40;
}
.sidebar--collapsed {
  width: 76px;
}

.sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2);
}
.sidebar--collapsed .sidebar__brand {
  justify-content: center;
  width: 100%;
}
.sidebar__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar__toggle:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}
.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar__link:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.sidebar__link.is-active {
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  color: var(--accent-primary);
}
.sidebar--collapsed .sidebar__link {
  justify-content: center;
  padding: 10px;
}
.sidebar--collapsed .sidebar__link-label {
  display: none;
}
.sidebar__link--muted {
  color: var(--text-muted);
  cursor: default;
}
.sidebar__link--muted:hover {
  background: transparent;
  color: var(--text-muted);
}

.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-default);
}
.sidebar--collapsed .sidebar__footer {
  align-items: center;
}
.sidebar__login {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar__login:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}
.sidebar__user {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.sidebar--collapsed .sidebar__user {
  flex-direction: column;
  gap: var(--space-2);
}
.sidebar__user-name {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar__logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar__logout:hover {
  color: var(--danger, #9a4a3c);
  border-color: var(--danger, #9a4a3c);
}

/* 移动端：抽屉 + 浮动按钮 + 遮罩 */
.sidebar-fab {
  position: fixed;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 70;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-card);
}
.sidebar-fab.is-hidden {
  opacity: 0;
  pointer-events: none;
}
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.4);
}
.sidebar--mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 264px;
  z-index: 65;
  transform: translateX(-100%);
  transition: transform var(--duration-base) var(--ease-standard);
  box-shadow: var(--shadow-floating);
}
.sidebar--mobile.is-open {
  transform: translateX(0);
}
</style>

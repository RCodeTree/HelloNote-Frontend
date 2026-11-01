<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.store'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import SidebarUser from '@/components/layout/SidebarUser.vue'

const app = useAppStore()
const route = useRoute()

const { isMobile, mobileOpen, sidebarCollapsed } = storeToRefs(app)

// 全幅页面（笔记编辑器）自带顶栏与菜单入口，隐藏全局浮动按钮避免重叠
const fullBleed = computed(() => route.meta.fullBleed === true)

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const navItems: NavItem[] = [
  { to: '/', label: '首页', icon: 'home' },
  { to: '/dashboard', label: '面板', icon: 'grid' },
]
</script>

<template>
  <!-- 移动端浮动汉堡按钮（编辑器等全幅页面隐藏，由页面自带菜单按钮承担） -->
  <button
    v-if="isMobile && !fullBleed"
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
      <!-- 移动端抽屉：右上角关闭按钮 -->
      <button v-if="isMobile" class="sidebar__close" aria-label="关闭菜单" @click="app.closeMobile">
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

      <RouterLink
        to="/notes"
        class="sidebar__link"
        :class="{ 'is-active': route.path.startsWith('/notes') }"
        :title="sidebarCollapsed && !isMobile ? '笔记' : undefined"
        @click="app.closeMobile"
      >
        <AppIcon name="note" :size="20" class="sidebar__link-icon" />
        <span class="sidebar__link-label">笔记</span>
      </RouterLink>
    </nav>

    <!-- 侧栏底部：用户登录态 / 资料与退出入口 -->
    <SidebarUser />

    <!-- 桌面端：收起/展开按钮悬浮于侧栏右侧垂直居中 -->
    <button
      v-if="!isMobile"
      class="sidebar__midtoggle"
      :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
      @click="app.toggleCollapsed"
    >
      <AppIcon :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
    </button>
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
  min-height: 44px;
}
.sidebar--collapsed .sidebar__top {
  justify-content: center;
}
.sidebar__brand {
  display: inline-flex;
  align-items: center;
}
.sidebar__close {
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
.sidebar__close:hover {
  color: var(--text-primary);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-height: 0;
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
  white-space: nowrap;
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

/* 桌面端：悬浮于侧栏右侧垂直居中的收起/展开按钮 */
.sidebar__midtoggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar__midtoggle:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

/* 移动端：抽屉 + 浮动汉堡按钮 + 遮罩 */
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

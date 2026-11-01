<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore, type SidebarMode } from '@/stores/app.store'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import SidebarUser from '@/components/layout/SidebarUser.vue'

const app = useAppStore()
const route = useRoute()
const router = useRouter()

const { isMobile, mobileOpen, sidebarCollapsed, effectiveMode } = storeToRefs(app)

// 大屏「自动隐藏」模式下的悬浮弹出态：鼠标靠近左缘弹出，离开自动收起
const peeking = ref(false)

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const navItems: NavItem[] = [
  { to: '/', label: '首页', icon: 'home' },
  { to: '/dashboard', label: '面板', icon: 'grid' },
]

// 切换侧栏显示模式（full / rail / hidden）
function setMode(mode: SidebarMode): void {
  app.setSidebarMode(mode)
  peeking.value = false
}

// 点击品牌标题：大屏展开为完整侧栏（不再导航首页）；移动端保持「回首页 + 收抽屉」
function onBrandClick(): void {
  if (isMobile.value) {
    app.closeMobile()
    void router.push('/')
    return
  }
  peeking.value = false
  if (effectiveMode.value !== 'full') app.setSidebarMode('full')
}

// 导航项点击：收起移动端抽屉 / 关闭悬浮弹出态
function onNavClick(): void {
  app.closeMobile()
  peeking.value = false
}
</script>

<template>
  <!-- 中小屏：侧边垂直居中悬浮小箭头，点击弹出侧栏抽屉；空闲时低调无高亮 -->
  <button
    v-if="isMobile && !mobileOpen"
    class="sidebar-midbtn"
    aria-label="打开菜单"
    @click="app.toggleMobile"
  >
    <AppIcon name="chevron-right" :size="18" />
  </button>

  <!-- 大屏「自动隐藏」：贴近左缘的悬浮感应区，鼠标靠近自动弹出侧栏 -->
  <div
    v-if="!isMobile && effectiveMode === 'hidden'"
    class="sidebar-edgezone"
    @mouseenter="peeking = true"
  />

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
      'sidebar--hidden': !isMobile && effectiveMode === 'hidden',
      'is-peek': peeking,
    }"
    @mouseleave="peeking = false"
  >
    <div class="sidebar__top">
      <!-- 品牌标题：大屏点击展开完整侧栏（不再导航首页） -->
      <button
        type="button"
        class="sidebar__brand"
        :title="!isMobile && effectiveMode !== 'full' ? '展开侧边栏' : undefined"
        @click="onBrandClick"
      >
        <AppLogo :show-text="!sidebarCollapsed" />
      </button>
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
        :title="sidebarCollapsed ? item.label : undefined"
        @click="onNavClick"
      >
        <AppIcon :name="item.icon" :size="20" class="sidebar__link-icon" />
        <span class="sidebar__link-label">{{ item.label }}</span>
      </RouterLink>

      <RouterLink
        to="/notes"
        class="sidebar__link"
        :class="{ 'is-active': route.path.startsWith('/notes') }"
        :title="sidebarCollapsed ? '笔记' : undefined"
        @click="onNavClick"
      >
        <AppIcon name="note" :size="20" class="sidebar__link-icon" />
        <span class="sidebar__link-label">笔记</span>
      </RouterLink>
    </nav>

    <!-- 大屏：三种展开状态切换（完整 / 仅图标 / 自动隐藏），图标置于侧栏内 -->
    <div v-if="!isMobile" class="sidebar__modes" role="group" aria-label="侧栏显示模式">
      <button
        type="button"
        class="sidebar__mode"
        :class="{ 'is-active': effectiveMode === 'full' }"
        title="完整侧栏"
        aria-label="完整侧栏"
        @click="setMode('full')"
      >
        <AppIcon name="layout-full" :size="16" />
      </button>
      <button
        type="button"
        class="sidebar__mode"
        :class="{ 'is-active': effectiveMode === 'rail' }"
        title="仅显示图标"
        aria-label="仅显示图标"
        @click="setMode('rail')"
      >
        <AppIcon name="layout-rail" :size="16" />
      </button>
      <button
        type="button"
        class="sidebar__mode"
        :class="{ 'is-active': effectiveMode === 'hidden' }"
        title="自动隐藏（鼠标靠近左缘弹出）"
        aria-label="自动隐藏"
        @click="setMode('hidden')"
      >
        <AppIcon name="layout-hidden" :size="16" />
      </button>
    </div>

    <!-- 侧栏底部：用户登录态 / 资料与退出入口 -->
    <SidebarUser />
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
/* 真半屏（仅图标） */
.sidebar--collapsed {
  width: 76px;
}
/* 全屏收起（自动隐藏）：脱离文档流，内容区占满；鼠标靠近左缘时滑入弹出 */
.sidebar--hidden {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  transform: translateX(-104%);
  opacity: 0;
  transition: transform var(--duration-base) var(--ease-emphasized),
    opacity var(--duration-base) var(--ease-emphasized);
  will-change: transform, opacity;
  box-shadow: var(--shadow-floating);
}
.sidebar--hidden.is-peek {
  transform: translateX(0);
  opacity: 1;
}

/* 自动隐藏模式下贴近左缘的悬浮感应区（隐形，占满高度） */
.sidebar-edgezone {
  position: fixed;
  top: 0;
  left: 0;
  width: 10px;
  height: 100vh;
  z-index: 40;
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
/* 品牌标题：按钮化，大屏点击展开完整侧栏 */
.sidebar__brand {
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  color: inherit;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}
.sidebar__brand:hover {
  background: var(--bg-secondary);
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

/* 三态模式切换器：完整宽时横排，仅图标时竖排 */
.sidebar__modes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}
.sidebar--collapsed .sidebar__modes {
  flex-direction: column;
  padding: 2px;
}
.sidebar__mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar__mode:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}
.sidebar__mode.is-active {
  color: var(--accent-primary);
  background: var(--bg-card);
}

/* 中小屏：侧边垂直居中悬浮小箭头 —— 默认低调、空闲无高亮，hover 才点亮 */
.sidebar-midbtn {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 65;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 46px;
  border: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.5;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar-midbtn:hover {
  opacity: 1;
  color: var(--accent-primary);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

/* 中小屏：抽屉 + 遮罩（导航入口为侧边中部悬浮小箭头） */
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

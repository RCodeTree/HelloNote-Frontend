<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { useAppStore } from '@/stores/app.store'
import AppIcon from '@/components/common/AppIcon.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const appStore = useAppStore()

const themeOptions = [
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
  { value: 'system', label: '跟随系统', icon: 'monitor' },
] as const

function setMode(v: 'light' | 'dark' | 'system'): void {
  themeStore.setMode(v)
}
function openProfile(): void {
  appStore.openProfile()
}
function handleLogout(): void {
  authStore.logout()
}
</script>

<template>
  <Menu as="div" class="sidebar-user">
    <MenuButton class="sidebar-user__btn">
      <AppIcon name="user" :size="18" />
      <span class="sidebar-user__name">{{ authStore.user?.username }}</span>
      <AppIcon name="chevron-down" :size="14" class="sidebar-user__caret" />
    </MenuButton>

    <Transition name="dropdown">
      <MenuItems class="sidebar-user__menu">
        <p class="sidebar-user__menu-title">外观</p>
        <!-- 普通按钮（非 MenuItem）：切换主题时不关闭菜单 -->
        <div class="sidebar-user__theme">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            class="sidebar-user__theme-btn"
            :class="{ 'is-active': themeStore.mode === opt.value }"
            @click="setMode(opt.value)"
          >
            <AppIcon :name="opt.icon" :size="16" />
            <span>{{ opt.label }}</span>
          </button>
        </div>
        <div class="sidebar-user__divider" />
        <MenuItem class="sidebar-user__menuitem" @click="openProfile">
          <AppIcon name="user" :size="16" /><span>编辑资料</span>
        </MenuItem>
        <MenuItem class="sidebar-user__menuitem" @click="handleLogout">
          <AppIcon name="logout" :size="16" /><span>退出登录</span>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<style scoped>
.sidebar-user {
  position: relative;
}
.sidebar-user__btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar-user__btn:hover {
  background: var(--bg-card);
  border-color: var(--border-default);
}
.sidebar-user__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}
.sidebar-user__caret {
  color: var(--text-muted);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.sidebar-user__menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 75;
  padding: 8px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: var(--shadow-floating);
}
.sidebar-user__menu-title {
  margin: 0 0 4px;
  padding: 2px 8px 6px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.sidebar-user__theme {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-user__theme-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar-user__theme-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}
.sidebar-user__theme-btn.is-active {
  color: var(--accent-primary);
}
.sidebar-user__theme-btn span {
  flex: 1;
  text-align: left;
}
.sidebar-user__divider {
  height: 1px;
  margin: 6px 4px;
  background: var(--border-default);
}
.sidebar-user__menuitem {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar-user__menuitem:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}
.sidebar-user__menuitem span {
  flex: 1;
  text-align: left;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.16s var(--ease-standard),
    transform 0.16s var(--ease-standard);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

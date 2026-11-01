<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth'
import { useTheme } from '@/composables/useTheme'
import ProfileDialog from '@/modules/auth/components/ProfileDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import { useAppStore } from '@/stores/app.store'

const auth = useAuthStore()
const app = useAppStore()
const router = useRouter()
const { themeStore, options, setMode } = useTheme()

const { user, isAuthenticated } = storeToRefs(auth)
const { sidebarCollapsed, isMobile } = storeToRefs(app)

const menuOpen = ref(false)
const profileOpen = ref(false)

function iconFor(mode: string): IconName {
  if (mode === 'light') return 'sun'
  if (mode === 'dark') return 'moon'
  return 'monitor'
}

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function openProfile(): void {
  menuOpen.value = false
  profileOpen.value = true
}

function handleLogout(): void {
  menuOpen.value = false
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="sidebar-user" :class="{ 'is-collapsed': sidebarCollapsed && !isMobile }">
    <!-- 已登录：头像 + 昵称，点击弹出菜单 -->
    <template v-if="isAuthenticated">
      <button class="sidebar-user__trigger" @click="toggleMenu">
        <UserAvatar :name="user?.displayName || user?.username || '?'" :url="user?.avatarUrl" :size="34" />
        <span v-if="!(sidebarCollapsed && !isMobile)" class="sidebar-user__info">
          <span class="sidebar-user__name">{{ user?.displayName }}</span>
          <span class="sidebar-user__sub">@{{ user?.username }}</span>
        </span>
        <AppIcon
          v-if="!(sidebarCollapsed && !isMobile)"
          name="chevron-down"
          :size="14"
          class="sidebar-user__chevron"
          :class="{ 'is-open': menuOpen }"
        />
      </button>

      <!-- 弹出菜单（贴底部向上展开） -->
      <Transition name="pop">
        <div v-if="menuOpen" class="sidebar-user__menu">
          <!-- 主题切换：集成进用户菜单，置于第一行 -->
          <div class="sidebar-user__section">
            <span class="sidebar-user__section-label">主题</span>
            <div class="sidebar-user__themes">
              <button
                v-for="opt in options"
                :key="opt.value"
                class="sidebar-user__theme"
                :class="{ 'is-active': themeStore.mode === opt.value }"
                :title="opt.label"
                :aria-label="opt.label"
                @click="setMode(opt.value)"
              >
                <AppIcon :name="iconFor(opt.value)" :size="16" />
              </button>
            </div>
          </div>

          <div class="sidebar-user__divider" />

          <button class="sidebar-user__item" @click="openProfile">
            <AppIcon name="user" :size="16" />
            <span>编辑资料</span>
          </button>

          <button class="sidebar-user__item sidebar-user__item--danger" @click="handleLogout">
            <AppIcon name="logout" :size="16" />
            <span>退出登录</span>
          </button>
        </div>
      </Transition>

      <!-- 点击其他区域关闭菜单 -->
      <div v-if="menuOpen" class="sidebar-user__backdrop" @click="menuOpen = false" />

      <ProfileDialog :open="profileOpen" @close="profileOpen = false" />
    </template>

    <!-- 未登录：登录入口 -->
    <RouterLink v-else to="/login" class="sidebar-user__trigger sidebar-user__trigger--link" @click="app.closeMobile">
      <UserAvatar name="?" :size="34" />
      <span v-if="!(sidebarCollapsed && !isMobile)" class="sidebar-user__info">
        <span class="sidebar-user__name">登录 / 注册</span>
      </span>
    </RouterLink>
  </div>
</template>

<style scoped>
.sidebar-user {
  position: relative;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-default);
}
.sidebar-user__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition: background var(--duration-fast) var(--ease-standard);
}
.sidebar-user__trigger:hover {
  background: var(--bg-secondary);
}
.is-collapsed .sidebar-user__trigger {
  justify-content: center;
  padding: 8px;
}
.sidebar-user__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.sidebar-user__name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-user__sub {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-user__chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.sidebar-user__chevron.is-open {
  transform: rotate(180deg);
}
.sidebar-user__menu {
  position: absolute;
  left: 8px;
  bottom: calc(100% + 8px);
  z-index: 75;
  /* 固定最小宽度：侧栏收起（76px）时菜单也能完整显示文字而不换行 */
  width: 200px;
  max-width: calc(100vw - 24px);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
}
.sidebar-user__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 9px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar-user__item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.sidebar-user__item--danger:hover {
  color: var(--danger);
}
/* 菜单内的主题切换区块 */
.sidebar-user__section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 4px 12px;
}
.sidebar-user__section-label {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.sidebar-user__themes {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}
.sidebar-user__theme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.sidebar-user__theme:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}
.sidebar-user__theme.is-active {
  color: var(--accent-primary);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.sidebar-user__divider {
  height: 1px;
  margin: 4px 6px;
  background: var(--border-default);
}
.sidebar-user__backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
}
.sidebar-user__trigger--link {
  color: var(--text-secondary);
}

/* 菜单弹出动画：自下而上 */
.pop-enter-active,
.pop-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

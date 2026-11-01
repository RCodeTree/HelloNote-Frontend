<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth'
import ProfileDialog from '@/modules/auth/components/ProfileDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useAppStore } from '@/stores/app.store'

const auth = useAuthStore()
const app = useAppStore()
const router = useRouter()

const { user, isAuthenticated } = storeToRefs(auth)
const { sidebarCollapsed, isMobile } = storeToRefs(app)

const menuOpen = ref(false)
const profileOpen = ref(false)

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
  right: 8px;
  bottom: calc(100% + 8px);
  z-index: 75;
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

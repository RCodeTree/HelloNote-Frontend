<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import { useFriendsStore } from '@/modules/friends/stores/friends.store'
import type { Notification, NotificationType } from '@/modules/notifications/types/notifications.types'

const router = useRouter()
const store = useNotificationsStore()
const friendsStore = useFriendsStore()
const { notifications, unreadCount, loading } = storeToRefs(store)
const acceptingId = ref<number | null>(null)

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const icon: Record<NotificationType, IconName> = {
  system: 'info',
  comment: 'message',
  like: 'heart',
  friend_request: 'user-plus',
  friend_accept: 'check',
}
const label: Record<NotificationType, string> = {
  system: '系统',
  comment: '评论',
  like: '点赞',
  friend_request: '好友申请',
  friend_accept: '好友通过',
}

function formatTime(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function toggle(): void {
  open.value = !open.value
  if (open.value) void store.load()
}

function targetOf(n: Notification): string | null {
  if (n.type === 'friend_request' || n.type === 'friend_accept') return '/friends'
  if (n.relatedId !== null && (n.type === 'comment' || n.type === 'like')) {
    return `/notes/${n.relatedId}/edit`
  }
  return null
}

function onNotifyClick(n: Notification): void {
  if (!n.isRead) void store.markRead(n.id)
  const target = targetOf(n)
  if (target) {
    open.value = false
    void router.push(target)
  }
}

async function acceptRequest(n: Notification): Promise<void> {
  if (n.relatedId === null || acceptingId.value !== null) return
  acceptingId.value = n.id
  const ok = await friendsStore.accept(n.relatedId)
  acceptingId.value = null
  if (!ok) return
  await store.markRead(n.id)
  void store.load()
}

async function ignoreRequest(n: Notification): Promise<void> {
  if (n.relatedId === null) return
  const ok = await friendsStore.remove(n.relatedId)
  if (!ok) return
  await store.markRead(n.id)
  void store.load()
}

function onDocClick(e: MouseEvent): void {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
  void store.refreshCount()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootEl" class="topbar-actions">
    <button
      type="button"
      class="notify-bell"
      :class="{ 'is-active': open }"
      :title="unreadCount > 0 ? `${unreadCount} 条未读通知` : '通知'"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      <AppIcon name="bell" :size="19" />
      <span v-if="unreadCount > 0" class="notify-bell__badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <Transition name="pop">
      <div v-if="open" class="notify-panel" @click.stop>
        <header class="notify-panel__head">
          <h2 class="notify-panel__title">系统通知</h2>
          <BaseButton v-if="notifications.length" variant="ghost" size="sm" @click="store.markAllRead()">
            全部已读
          </BaseButton>
        </header>
        <div class="notify-panel__body">
          <div v-if="loading && !notifications.length" class="notify-panel__loading">加载中…</div>
          <EmptyState v-else-if="!notifications.length" title="暂无通知" />
          <ul v-else class="notify-list">
            <li
              v-for="n in notifications"
              :key="n.id"
              class="notify-item"
              :class="{ 'is-unread': !n.isRead }"
              @click="onNotifyClick(n)"
            >
              <span class="notify-item__icon" :class="`notify-item__icon--${n.type}`">
                <AppIcon :name="icon[n.type]" :size="15" />
              </span>
              <div class="notify-item__body">
                <div class="notify-item__top">
                  <span class="notify-item__label">{{ label[n.type] }}</span>
                  <time class="notify-item__time">{{ formatTime(n.createdAt) }}</time>
                </div>
                <p class="notify-item__content">{{ n.content }}</p>
                <div v-if="n.type === 'friend_request' && n.relatedId !== null" class="notify-item__ops">
                  <BaseButton
                    variant="primary"
                    size="sm"
                    :loading="acceptingId === n.id"
                    @click.stop="acceptRequest(n)"
                  >
                    接受
                  </BaseButton>
                  <BaseButton variant="ghost" size="sm" @click.stop="ignoreRequest(n)">忽略</BaseButton>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.topbar-actions {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.notify-bell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.notify-bell:hover,
.notify-bell.is-active {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.notify-bell__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background: var(--accent-danger);
  color: #fff;
  font-size: 10px;
  line-height: 17px;
  text-align: center;
}

/* 通知下拉面板：定位在铃铛下方右侧，层级高于正文 */
.notify-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 90;
  width: min(380px, calc(100vw - 32px));
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
  overflow: hidden;
}
.notify-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
.notify-panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.notify-panel__loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}
.notify-panel__body {
  max-height: min(420px, calc(100dvh - 140px));
  overflow-y: auto;
}
.notify-list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
.notify-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-default);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}
.notify-item:last-child {
  border-bottom: none;
}
.notify-item:hover {
  background: var(--bg-secondary);
}
.notify-item.is-unread {
  border-left-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 6%, transparent);
}
.notify-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.notify-item__icon--friend_request,
.notify-item__icon--friend_accept {
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  color: var(--accent-primary);
}
.notify-item__icon--like {
  background: color-mix(in srgb, var(--accent-danger) 14%, transparent);
  color: var(--accent-danger);
}
.notify-item__body {
  flex: 1;
  min-width: 0;
}
.notify-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.notify-item__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.notify-item__time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
}
.notify-item__content {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-word;
}
.notify-item__ops {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
</style>

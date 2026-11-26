<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import { useFriendsStore } from '@/modules/friends/stores/friends.store'
import type { Notification, NotificationType } from '@/modules/notifications/types/notifications.types'

const route = useRoute()
const router = useRouter()
const store = useNotificationsStore()
const friendsStore = useFriendsStore()
const { notifications, unreadCount, loading } = storeToRefs(store)
const acceptingId = ref<number | null>(null)

// 铃铛仅首页显示
const isHome = computed(() => route.name === 'home')

const open = ref(false)
const detail = ref<Notification | null>(null)
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

function openDetail(n: Notification): void {
  if (!n.isRead) void store.markRead(n.id)
  open.value = false
  detail.value = n
}

function detailTarget(): string | null {
  const n = detail.value
  if (!n) return null
  if (n.type === 'friend_request' || n.type === 'friend_accept') return '/friends'
  if (n.relatedId !== null && (n.type === 'comment' || n.type === 'like')) {
    return `/notes/${n.relatedId}/edit`
  }
  return null
}

function goDetailTarget(): void {
  const target = detailTarget()
  if (!target) return
  detail.value = null
  void router.push(target)
}

async function acceptRequest(n: Notification): Promise<void> {
  if (n.relatedId === null || acceptingId.value !== null) return
  acceptingId.value = n.id
  const ok = await friendsStore.accept(n.relatedId)
  acceptingId.value = null
  if (!ok) return
  await store.markRead(n.id)
  void store.load()
  if (detail.value?.id === n.id) detail.value = null
}

async function ignoreRequest(n: Notification): Promise<void> {
  if (n.relatedId === null) return
  const ok = await friendsStore.remove(n.relatedId)
  if (!ok) return
  await store.markRead(n.id)
  void store.load()
  if (detail.value?.id === n.id) detail.value = null
}

function onDocClick(e: MouseEvent): void {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape') return
  if (detail.value) detail.value = null
  else open.value = false
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
  <div v-if="isHome" ref="rootEl" class="topbar-actions">
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
              @click="openDetail(n)"
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

  <!-- 通知详情模态框 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="detail" class="detail-modal" @click.self="detail = null">
        <section class="detail-modal__card" role="dialog" aria-modal="true" aria-label="通知详情">
          <header class="detail-modal__head">
            <span class="detail-modal__icon" :class="`detail-modal__icon--${detail.type}`">
              <AppIcon :name="icon[detail.type]" :size="18" />
            </span>
            <div class="detail-modal__heading">
              <h2>{{ label[detail.type] }}</h2>
              <time>{{ formatTime(detail.createdAt) }}</time>
            </div>
            <button type="button" class="detail-modal__close" aria-label="关闭" @click="detail = null">
              <AppIcon name="close" :size="17" />
            </button>
          </header>
          <div class="detail-modal__body">
            <div v-if="detail.actorName" class="detail-modal__actor">
              <UserAvatar :name="detail.actorName" :url="detail.actorAvatar" :size="30" />
              <span>{{ detail.actorName }}</span>
            </div>
            <p class="detail-modal__content">{{ detail.content }}</p>
          </div>
          <footer class="detail-modal__foot">
            <div v-if="detail.type === 'friend_request' && detail.relatedId !== null" class="detail-modal__ops">
              <BaseButton
                variant="primary"
                size="sm"
                :loading="acceptingId === detail.id"
                @click="acceptRequest(detail)"
              >
                接受
              </BaseButton>
              <BaseButton variant="ghost" size="sm" @click="ignoreRequest(detail)">忽略</BaseButton>
            </div>
            <BaseButton v-if="detailTarget()" variant="ghost" size="sm" @click="goDetailTarget">
              查看详情
            </BaseButton>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
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

/* 通知详情模态框 */
.detail-modal {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.detail-modal__card {
  width: min(480px, 100%);
  max-height: min(72dvh, 620px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
  overflow: hidden;
}
.detail-modal__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
.detail-modal__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.detail-modal__icon--friend_request,
.detail-modal__icon--friend_accept {
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  color: var(--accent-primary);
}
.detail-modal__icon--like {
  background: color-mix(in srgb, var(--accent-danger) 14%, transparent);
  color: var(--accent-danger);
}
.detail-modal__heading {
  flex: 1;
  min-width: 0;
}
.detail-modal__heading h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.detail-modal__heading time {
  font-size: 11px;
  color: var(--text-muted);
}
.detail-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.detail-modal__close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.detail-modal__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
}
.detail-modal__actor {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.detail-modal__content {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.detail-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-default);
}
.detail-modal__foot:empty {
  display: none;
}
.detail-modal__ops {
  display: flex;
  gap: var(--space-2);
  margin-right: auto;
}
/* 模态框进出过渡 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms var(--ease-standard);
}
.modal-enter-active .detail-modal__card,
.modal-leave-active .detail-modal__card {
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .detail-modal__card,
.modal-leave-to .detail-modal__card {
  transform: translateY(12px) scale(0.97);
}
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .detail-modal__card,
  .modal-leave-active .detail-modal__card {
    transition: none;
  }
}
</style>

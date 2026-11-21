<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useToast } from '@/composables/useToast'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import type { Notification, NotificationType } from '@/modules/notifications/types/notifications.types'
import { useFriendsStore } from '../stores/friends.store'
import type {
  Friend,
  FriendBrief,
  FriendCloseness,
  FriendPrivacy,
} from '../types/friends.types'

const router = useRouter()
const store = useFriendsStore()
const notificationStore = useNotificationsStore()
const toast = useToast()
const { friends, loading, error } = storeToRefs(store)
const { notifications, unreadCount, loading: notificationsLoading } = storeToRefs(notificationStore)

const addOpen = ref(false)
const notifOpen = ref(false)
const keyword = ref('')
const results = ref<FriendBrief[]>([])
const searching = ref(false)
const searched = ref(false)
const adding = ref(false)
const acceptingId = ref<number | null>(null)

const settingsTarget = ref<Friend | null>(null)
const settingsOpen = computed(() => settingsTarget.value !== null)
const settingsSaving = ref(false)
const formNote = ref('')
const formPrivacy = ref<FriendPrivacy>('all')
const formRelationType = ref('')
const formCloseness = ref<FriendCloseness>('acquaintance')

const deleteTarget = ref<Friend | null>(null)
const deleteOpen = computed(() => deleteTarget.value !== null)

const notificationIcon: Record<NotificationType, IconName> = {
  system: 'info',
  comment: 'message',
  like: 'heart',
  friend_request: 'user-plus',
  friend_accept: 'check',
}
const notificationLabel: Record<NotificationType, string> = {
  system: '系统',
  comment: '评论',
  like: '点赞',
  friend_request: '好友申请',
  friend_accept: '好友通过',
}
const privacyLabel: Record<FriendPrivacy, string> = {
  all: '公开',
  friends: '仅好友',
  hidden: '隐藏',
}
const closenessLabel: Record<FriendCloseness, string> = {
  acquaintance: '认识',
  friend: '好友',
  close: '亲密',
  intimate: '至交',
}

let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  void Promise.all([store.init(), notificationStore.load()])
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

watch(keyword, (val) => {
  if (timer) clearTimeout(timer)
  searched.value = val.trim().length > 0
  if (!searched.value) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  timer = setTimeout(async () => {
    results.value = await store.search(val)
    searching.value = false
  }, 300)
})

function displayName(friend: Friend): string {
  return friend.note || friend.displayName
}

function formatTime(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toggleAdd(): void {
  addOpen.value = !addOpen.value
  if (!addOpen.value) {
    keyword.value = ''
    results.value = []
    searched.value = false
  }
}

function openChat(userId: number): void {
  void router.push(`/chats/${userId}`)
}

async function addByName(): Promise<void> {
  const name = keyword.value.trim()
  if (!name || adding.value) return
  adding.value = true
  const ok = await store.add(name)
  adding.value = false
  if (ok) {
    toast.success('已发送申请')
    keyword.value = ''
  } else {
    toast.error(error.value || '添加失败')
  }
}

async function addFromResult(brief: FriendBrief): Promise<void> {
  if (adding.value) return
  adding.value = true
  const ok = await store.add(brief.username)
  adding.value = false
  if (ok) toast.success('已发送申请')
  else toast.error(error.value || '添加失败')
}

async function acceptRequest(n: Notification): Promise<void> {
  if (n.relatedId === null || acceptingId.value !== null) return
  acceptingId.value = n.id
  const ok = await store.accept(n.relatedId)
  acceptingId.value = null
  if (!ok) {
    toast.error(error.value || '操作失败')
    return
  }
  toast.success('已接受')
  await notificationStore.markRead(n.id)
  await notificationStore.load()
}

async function ignoreRequest(n: Notification): Promise<void> {
  if (n.relatedId === null) return
  const ok = await store.remove(n.relatedId)
  if (!ok) {
    toast.error(error.value || '操作失败')
    return
  }
  await notificationStore.markRead(n.id)
  await notificationStore.load()
}

function openNotifications(): void {
  notifOpen.value = true
  void notificationStore.load()
}

function notificationTarget(n: Notification): string | null {
  if (n.type === 'friend_request' || n.type === 'friend_accept') return '/friends'
  if (n.relatedId !== null && (n.type === 'comment' || n.type === 'like')) {
    return `/notes/${n.relatedId}/edit`
  }
  return null
}

function onNotificationClick(n: Notification): void {
  if (!n.isRead) void notificationStore.markRead(n.id)
  const target = notificationTarget(n)
  if (target) void router.push(target)
}

async function readAll(): Promise<void> {
  const ok = await notificationStore.markAllRead()
  if (!ok) toast.error(error.value || '操作失败')
}

function openSettings(friend: Friend): void {
  settingsTarget.value = friend
  formNote.value = friend.note
  formPrivacy.value = friend.privacy
  formRelationType.value = friend.relationType
  formCloseness.value = friend.closeness
}

async function saveSettings(): Promise<void> {
  const target = settingsTarget.value
  if (!target || settingsSaving.value) return
  settingsSaving.value = true
  const ok = await store.updateSettings(target.id, {
    note: formNote.value.trim(),
    privacy: formPrivacy.value,
    relationType: formRelationType.value.trim(),
    closeness: formCloseness.value,
  })
  settingsSaving.value = false
  if (!ok) {
    toast.error(error.value || '保存失败')
    return
  }
  settingsTarget.value = null
  toast.success('已保存')
}

function requestDeleteFromSettings(): void {
  if (!settingsTarget.value) return
  deleteTarget.value = settingsTarget.value
  settingsTarget.value = null
}

async function onDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  deleteTarget.value = null
  const ok = await store.remove(target.id)
  if (ok) toast.success('已删除')
  else toast.error(error.value || '删除失败')
}
</script>

<template>
  <div class="friends-page">
    <header class="friends-page__head">
      <h1 class="friends-page__title">笔友</h1>
      <div class="friends-page__ops">
        <button
          type="button"
          class="icon-button"
          :class="{ 'is-active': addOpen }"
          aria-label="添加笔友"
          @click="toggleAdd"
        >
          <AppIcon name="user-plus" :size="18" />
        </button>
        <button type="button" class="icon-button" aria-label="刷新" @click="store.init()">
          <AppIcon name="refresh" :size="17" />
        </button>
      </div>
    </header>

    <section v-if="addOpen" class="friend-add">
      <BaseInput v-model="keyword" placeholder="搜索用户名" class="friend-add__input" />
      <ul v-if="results.length" class="friend-add__results">
        <li v-for="brief in results" :key="brief.id" class="friend-row">
          <UserAvatar :name="brief.displayName" :url="brief.avatarUrl" :size="36" />
          <div class="friend-row__info">
            <span class="friend-row__name">{{ brief.displayName }}</span>
            <span class="friend-row__sub">@{{ brief.username }}</span>
          </div>
          <BaseButton variant="secondary" size="sm" :loading="adding" @click="addFromResult(brief)">
            <AppIcon name="user-plus" :size="14" />
            <span>添加</span>
          </BaseButton>
        </li>
      </ul>
      <EmptyState v-else-if="searched && !searching" title="暂无结果" />
      <div v-if="keyword.trim()" class="friend-add__actions">
        <BaseButton variant="secondary" size="sm" :disabled="adding" @click="addByName">按用户名添加</BaseButton>
      </div>
    </section>

    <!-- 统一列表：系统通知（固定首项）+ 笔友项 -->
    <div class="friend-list-panel">
      <!-- 系统通知：默认入口，点击进入系统消息 -->
      <button type="button" class="list-item list-item--system" @click="openNotifications">
        <span class="list-item__icon list-item__icon--system">
          <AppIcon name="bell" :size="20" />
        </span>
        <span class="list-item__body">
          <span class="list-item__line">
            <span class="list-item__name">系统通知</span>
            <span v-if="unreadCount > 0" class="list-item__badge">{{ unreadCount }}</span>
          </span>
          <span class="list-item__sub">{{ unreadCount > 0 ? `${unreadCount} 条未读` : '查看系统消息' }}</span>
        </span>
        <AppIcon name="chevron-right" :size="16" class="list-item__arrow" />
      </button>

      <!-- 笔友项 -->
      <template v-if="loading && !friends.length">
        <div class="friend-list-loading">加载中…</div>
      </template>
      <template v-else-if="friends.length">
        <div
          v-for="friend in friends"
          :key="friend.id"
          class="list-item list-item--friend"
          @click="openChat(friend.userId)"
        >
          <span class="list-item__avatar">
            <UserAvatar :name="friend.displayName" :url="friend.avatarUrl" :size="42" />
            <span v-if="friend.unreadCount > 0" class="list-item__dot">{{ friend.unreadCount }}</span>
          </span>
          <span class="list-item__body">
            <span class="list-item__line">
              <span class="list-item__name">{{ displayName(friend) }}</span>
              <span class="friend-tag">{{ friend.relationType || '笔友' }}</span>
              <span class="friend-tag friend-tag--soft">{{ closenessLabel[friend.closeness] }}</span>
              <span v-if="friend.privacy !== 'all'" class="friend-tag friend-tag--soft">
                {{ privacyLabel[friend.privacy] }}
              </span>
            </span>
            <span class="list-item__sub">@{{ friend.username }}</span>
          </span>
          <button
            type="button"
            class="friend-row__setting"
            aria-label="好友设置"
            @click.stop="openSettings(friend)"
          >
            <AppIcon name="settings" :size="16" />
          </button>
        </div>
      </template>
      <EmptyState v-else title="暂无笔友" />
    </div>

    <!-- 系统消息详情（抽屉） -->
    <Teleport to="body">
      <div v-if="notifOpen" class="notif-drawer">
        <div class="notif-drawer__scrim" @click="notifOpen = false" />
        <aside class="notif-drawer__panel" role="dialog" aria-modal="true">
          <header class="notif-drawer__head">
            <h2 class="notif-drawer__title">系统通知</h2>
            <div class="notif-drawer__ops">
              <BaseButton v-if="notifications.length" variant="ghost" size="sm" @click="readAll">全部已读</BaseButton>
              <button type="button" class="settings__close" aria-label="关闭" @click="notifOpen = false">
                <AppIcon name="close" :size="16" />
              </button>
            </div>
          </header>
          <div class="notif-drawer__body">
            <div v-if="notificationsLoading && !notifications.length" class="friend-section__loading">加载中…</div>
            <EmptyState v-else-if="!notifications.length" title="暂无通知" />
            <ul v-else class="notification-list">
              <li
                v-for="n in notifications"
                :key="n.id"
                class="notification"
                :class="{ 'is-unread': !n.isRead }"
                @click="onNotificationClick(n)"
              >
                <span class="notification__icon" :class="`notification__icon--${n.type}`">
                  <AppIcon :name="notificationIcon[n.type]" :size="15" />
                </span>
                <div class="notification__body">
                  <div class="notification__top">
                    <span class="notification__label">{{ notificationLabel[n.type] }}</span>
                    <time class="notification__time">{{ formatTime(n.createdAt) }}</time>
                  </div>
                  <p class="notification__content">{{ n.content }}</p>
                  <div v-if="n.type === 'friend_request' && n.relatedId !== null" class="notification__ops">
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
        </aside>
      </div>
    </Teleport>

    <!-- 好友设置 -->
    <Teleport to="body">
      <div v-if="settingsOpen" class="settings">
        <div class="settings__scrim" @click="settingsTarget = null" />
        <div class="settings__card" role="dialog" aria-modal="true">
          <div class="settings__head">
            <h2 class="settings__title">好友设置</h2>
            <button type="button" class="settings__close" aria-label="关闭" @click="settingsTarget = null">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="settings__body">
            <BaseInput v-model="formNote" label="备注" placeholder="备注" />
            <label class="settings__field">
              <span>关系类别</span>
              <input v-model="formRelationType" class="settings__control" placeholder="如：笔友" />
            </label>
            <label class="settings__field">
              <span>隐私</span>
              <select v-model="formPrivacy" class="settings__control">
                <option value="all">公开</option>
                <option value="friends">仅好友</option>
                <option value="hidden">隐藏</option>
              </select>
            </label>
            <label class="settings__field">
              <span>亲密程度</span>
              <select v-model="formCloseness" class="settings__control">
                <option value="acquaintance">认识</option>
                <option value="friend">好友</option>
                <option value="close">亲密</option>
                <option value="intimate">至交</option>
              </select>
            </label>
            <button type="button" class="settings__delete" @click="requestDeleteFromSettings">删除笔友</button>
          </div>
          <div class="settings__actions">
            <BaseButton variant="ghost" size="sm" @click="settingsTarget = null">取消</BaseButton>
            <BaseButton variant="primary" size="sm" :loading="settingsSaving" @click="saveSettings">保存</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmDialog
      :open="deleteOpen"
      title="删除笔友"
      message="删除后将移除这段笔友关系"
      confirm-text="删除"
      danger
      @confirm="onDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
.friends-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.friends-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.friends-page__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}
.friends-page__ops {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.icon-button:hover,
.icon-button.is-active {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.friend-add {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.friend-add__input {
  max-width: 420px;
}
.friend-add__results {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
.friend-add__actions {
  display: flex;
  justify-content: flex-end;
}
/* 列表容器：仅负责纵向排列与间距，每个 item 是独立卡片 */
.friend-list-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.list-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}
.list-item:hover {
  border-color: color-mix(in srgb, var(--accent-primary) 45%, var(--border-default));
  transform: translateY(-1px);
  box-shadow: var(--shadow-floating);
}
.list-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.list-item__icon--system {
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  color: var(--accent-primary);
}
.list-item__avatar {
  position: relative;
  flex-shrink: 0;
}
.list-item__dot {
  position: absolute;
  top: -4px;
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
.list-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.list-item__line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.list-item__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.list-item__badge {
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--accent-danger);
  color: #fff;
  font-size: 10px;
  line-height: 17px;
  text-align: center;
}
.list-item__sub {
  font-size: 12px;
  color: var(--text-muted);
}
.list-item__arrow {
  flex-shrink: 0;
  color: var(--text-muted);
}
.friend-list-loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

/* 系统消息抽屉 */
.notif-drawer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: modal-fade var(--duration-fast) var(--ease-standard);
}
.notif-drawer__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.notif-drawer__panel {
  position: relative;
  z-index: 1;
  width: min(440px, 100vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-left: 1px solid var(--border-default);
  box-shadow: var(--shadow-floating);
}
.notif-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
.notif-drawer__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
.notif-drawer__ops {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.notif-drawer__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.friend-section__loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
}
.friend-list,
.notification-list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
.friend-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-default);
}
.friend-row:last-child {
  border-bottom: none;
}
.friend-row--friend {
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-standard);
}
.friend-row--friend:hover {
  background: var(--bg-secondary);
}
.friend-row__avatar {
  position: relative;
  flex-shrink: 0;
}
.friend-row__badge {
  position: absolute;
  top: -4px;
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
.friend-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.friend-row__line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.friend-row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.friend-row__sub {
  font-size: 12px;
  color: var(--text-muted);
}
.friend-tag {
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
  color: var(--accent-primary);
  font-size: 11px;
  white-space: nowrap;
}
.friend-tag--soft {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.friend-row__setting {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.friend-row__setting:hover {
  color: var(--accent-primary);
  background: var(--bg-card);
}
.notification {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-default);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}
.notification:last-child {
  border-bottom: none;
}
.notification:hover {
  background: var(--bg-secondary);
}
.notification.is-unread {
  border-left-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 6%, transparent);
}
.notification__icon {
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
.notification__icon--friend_request,
.notification__icon--friend_accept {
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  color: var(--accent-primary);
}
.notification__icon--like {
  background: color-mix(in srgb, var(--accent-danger) 14%, transparent);
  color: var(--accent-danger);
}
.notification__body {
  flex: 1;
  min-width: 0;
}
.notification__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.notification__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.notification__time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
}
.notification__content {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-word;
}
.notification__ops {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.settings {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: modal-fade var(--duration-fast) var(--ease-standard);
}
@keyframes modal-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.settings__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.settings__card {
  position: relative;
  z-index: 1;
  width: min(92vw, 420px);
  padding: 22px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-floating);
}
.settings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.settings__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.settings__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.settings__close:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}
.settings__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.settings__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--text-secondary);
}
.settings__control {
  width: 100%;
  padding: 9px 12px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.settings__control:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.settings__delete {
  align-self: flex-start;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--danger);
  font-size: 13px;
  cursor: pointer;
}
.settings__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

@media (max-width: 640px) {
  .list-item {
    padding: var(--space-3);
  }
  .list-item__name {
    font-size: 13px;
  }
}
</style>

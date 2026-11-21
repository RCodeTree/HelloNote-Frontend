<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import { useChatStore } from '../stores/chat.store'
import type { Conversation } from '../types/chat.types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useChatStore()
const notifications = useNotificationsStore()
const toast = useToast()
const { conversations, messagesByConv, messagesLoading, sending, error } = storeToRefs(store)

const activeId = ref<number | null>(null)
const draft = ref('')
const messageListEl = ref<HTMLElement | null>(null)
let pollTimer: number | undefined
const MSG_POLL_MS = 4000

const activeConv = computed(() => conversations.value.find((c) => c.id === activeId.value) ?? null)
const messages = computed(() => (activeId.value === null ? [] : messagesByConv.value[activeId.value] ?? []))
const myId = computed(() => auth.user?.id ?? null)
// 自己的头像昵称取登录用户，对方取会话 peer
const me = computed(() => auth.user)

const TIME_GROUP_MS = 5 * 60 * 1000

function ts(value: string): number {
  const d = new Date(value)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

/** 微信式时间：今天 HH:mm、昨天 昨天 HH:mm、更早 M月D日 HH:mm */
function formatChatTime(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (sameDay(d, now)) return hm
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, yesterday)) return `昨天 ${hm}`
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hm}`
}

/** 每组首条显示时间（相邻间隔超过 5 分钟），其余隐藏 */
const messageRows = computed(() =>
  messages.value.map((m, i) => {
    const prev = i > 0 ? messages.value[i - 1] : null
    return {
      ...m,
      showTime: !prev || ts(m.createdAt) - ts(prev.createdAt) >= TIME_GROUP_MS,
      timeLabel: formatChatTime(m.createdAt),
    }
  }),
)

async function openFromRoute(): Promise<void> {
  const raw = route.params.userId
  const userId = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(userId) || userId <= 0) return
  const conv = await store.openWith(userId)
  if (conv) await selectConversation(conv)
}

onMounted(async () => {
  if (!auth.user && auth.token) await auth.fetchUser()
  await openFromRoute()
  pollTimer = window.setInterval(() => {
    if (activeId.value !== null) void store.loadMessages(activeId.value)
  }, MSG_POLL_MS)
})

onBeforeUnmount(() => {
  if (pollTimer !== undefined) window.clearInterval(pollTimer)
  store.setActiveConversation(null)
})

watch(() => route.params.userId, () => {
  void openFromRoute()
})

watch(activeId, (id) => {
  store.setActiveConversation(id)
  if (id !== null) void store.loadMessages(id)
})

watch(messages, () => {
  void nextTick(scrollToBottom)
})

function scrollToBottom(): void {
  const el = messageListEl.value
  if (el) el.scrollTop = el.scrollHeight
}

async function selectConversation(conv: Conversation): Promise<void> {
  activeId.value = conv.id
  draft.value = ''
  await nextTick(scrollToBottom)
}

async function submit(): Promise<void> {
  if (activeId.value === null) return
  const text = draft.value.trim()
  if (!text || sending.value) return
  draft.value = ''
  const sent = await store.send(activeId.value, text)
  if (sent === null) {
    draft.value = text
    toast.error(error.value || '发送失败')
    return
  }
  void notifications.refreshCount()
}
</script>

<template>
  <section class="chat-window">
    <template v-if="activeConv">
      <header class="chat-window__head">
        <button
          type="button"
          class="chat-window__friends"
          @click="router.push('/friends')"
        >
          <AppIcon name="chevron-left" :size="16" />
          <span>返回笔友</span>
        </button>
        <UserAvatar :name="activeConv.peer.displayName" :url="activeConv.peer.avatarUrl" :size="34" />
        <div class="chat-window__peer">
          <span class="chat-window__name">{{ activeConv.peer.displayName }}</span>
          <span class="chat-window__handle">@{{ activeConv.peer.username }}</span>
        </div>
      </header>

      <div ref="messageListEl" class="chat-window__messages">
        <div v-if="messagesLoading" class="chat-window__loading">加载中…</div>
        <EmptyState v-else-if="!messages.length" title="暂无消息" />
        <TransitionGroup :key="activeId ?? 0" name="msg" tag="div" class="msg-list">
          <div v-for="msg in messageRows" :key="msg.id" class="msg-item">
            <div v-if="msg.showTime" class="msg__time">{{ msg.timeLabel }}</div>
            <div
              class="msg"
              :class="{ 'is-mine': myId !== null && msg.senderId === myId }"
            >
              <UserAvatar
                class="msg__avatar"
                :name="myId !== null && msg.senderId === myId ? (me?.displayName || '我') : activeConv.peer.displayName"
                :url="myId !== null && msg.senderId === myId ? (me?.avatarUrl ?? null) : activeConv.peer.avatarUrl"
                :size="34"
              />
              <div class="msg__main">
                <span class="msg__name">
                  {{ myId !== null && msg.senderId === myId ? (me?.displayName || '我') : activeConv.peer.displayName }}
                </span>
                <div class="msg__bubble">{{ msg.content }}</div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div class="chat-window__composer">
        <textarea
          v-model="draft"
          class="chat-window__input"
          rows="2"
          placeholder="发送消息"
          :disabled="sending"
          @keydown.enter.exact.prevent="submit"
        />
        <BaseButton
          variant="primary"
          size="sm"
          :loading="sending"
          :disabled="sending || !draft.trim()"
          @click="submit"
        >
          <AppIcon name="send" :size="14" />
          <span>发送</span>
        </BaseButton>
      </div>
    </template>
    <div v-else class="chat-window__placeholder">
      <EmptyState title="暂无消息" />
    </div>
  </section>
</template>

<style scoped>
/* 独占整页：三行 grid（顶栏 / 消息 / 输入），仅消息区滚动 */
.chat-window {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  background: var(--bg-primary);
}
.chat-window__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-card);
}
.chat-window__friends {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  margin-right: var(--space-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.chat-window__friends:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.chat-window__peer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.chat-window__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.chat-window__handle {
  font-size: 11px;
  color: var(--text-muted);
}
.chat-window__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-5);
}
.msg-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.msg-item {
  display: flex;
  flex-direction: column;
}
/* 消息进出的自然过渡：淡入 + 轻微上移/缩放（弹性缓动） */
.msg-enter-active {
  transition:
    opacity 320ms var(--ease-standard),
    transform 380ms cubic-bezier(0.22, 1, 0.36, 1);
}
.msg-leave-active {
  transition:
    opacity 180ms var(--ease-standard),
    transform 180ms var(--ease-standard);
}
.msg-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}
.msg-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.msg-move {
  transition: transform 320ms var(--ease-standard);
}
@media (prefers-reduced-motion: reduce) {
  .msg-enter-active,
  .msg-leave-active,
  .msg-move {
    transition: none;
  }
}
.chat-window__loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
}
/* 微信式时间分隔：居中、浅色胶囊 */
.msg__time {
  align-self: center;
  margin: var(--space-2) 0;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--text-muted) 12%, transparent);
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
}
.msg {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  max-width: 78%;
}
.msg.is-mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.msg__avatar {
  flex-shrink: 0;
}
.msg__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.msg.is-mine .msg__main {
  align-items: flex-end;
}
.msg__name {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 2px;
}
.msg__bubble {
  padding: 9px 13px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  border-top-left-radius: var(--radius-sm);
}
.msg.is-mine .msg__bubble {
  background: color-mix(in srgb, var(--accent-primary) 18%, var(--bg-card));
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-sm);
}
.chat-window__composer {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-default);
  background: var(--bg-card);
}
.chat-window__input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  resize: none;
}
.chat-window__input::placeholder {
  color: var(--text-muted);
}
.chat-window__input:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.chat-window__placeholder {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

@media (max-width: 640px) {
  .msg {
    max-width: 88%;
  }
}
</style>

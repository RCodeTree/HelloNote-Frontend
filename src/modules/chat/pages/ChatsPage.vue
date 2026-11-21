<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const { conversations, messagesByConv, loading, messagesLoading, sending, error } = storeToRefs(store)

const activeId = ref<number | null>(null)
const mobileShowChat = ref(false)
const draft = ref('')
const messageListEl = ref<HTMLElement | null>(null)

const activeConv = computed(() => conversations.value.find((c) => c.id === activeId.value) ?? null)
const messages = computed(() => (activeId.value === null ? [] : messagesByConv.value[activeId.value] ?? []))
const myId = computed(() => auth.user?.id ?? null)

async function openFromRoute(): Promise<void> {
  const raw = route.params.userId
  const userId = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(userId) || userId <= 0) return
  const conv = await store.openWith(userId)
  if (conv) await selectConversation(conv)
}

onMounted(async () => {
  if (!auth.user && auth.token) await auth.fetchUser()
  await store.loadConversations()
  await openFromRoute()
})

// 同一组件复用：从会话列表切换好友时，按新 userId 打开对应会话
watch(() => route.params.userId, () => {
  void openFromRoute()
})

watch(activeId, (id) => {
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
  mobileShowChat.value = true
  draft.value = ''
  await nextTick(scrollToBottom)
}

function backToList(): void {
  mobileShowChat.value = false
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
  void store.loadConversations()
  void notifications.refreshCount()
}
</script>

<template>
  <div class="chats-page" :class="{ 'is-chat-open': mobileShowChat }">
    <!-- 会话列表 -->
    <aside class="chat-list">
      <header class="chat-list__head">
        <h1 class="chat-list__title">消息</h1>
        <button
          type="button"
          class="chat-list__new"
          title="新建会话"
          @click="router.push('/friends')"
        >
          <AppIcon name="user-plus" :size="16" />
        </button>
      </header>
      <div class="chat-list__body">
        <div v-if="loading && !conversations.length" class="chat-list__loading">加载中…</div>
        <EmptyState v-else-if="!conversations.length" title="暂无消息" />
        <ul v-else class="conv-list">
          <li v-for="conv in conversations" :key="conv.id">
            <button
              type="button"
              class="conv"
              :class="{ 'is-active': activeId === conv.id }"
              @click="router.push(`/chats/${conv.peer.id}`)"
            >
              <UserAvatar :name="conv.peer.displayName" :url="conv.peer.avatarUrl" :size="42" />
              <span class="conv__body">
                <span class="conv__top">
                  <span class="conv__name">{{ conv.peer.displayName }}</span>
                  <time class="conv__time">{{ formatTime(conv.lastMessageAt) }}</time>
                </span>
                <span class="conv__bottom">
                  <span class="conv__preview">{{ conv.lastMessage || '暂无消息' }}</span>
                  <span v-if="conv.unreadCount > 0" class="conv__badge">{{ conv.unreadCount }}</span>
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </aside>

    <!-- 消息窗口 -->
    <section class="chat-window">
      <template v-if="activeConv">
        <header class="chat-window__head">
          <button
            type="button"
            class="chat-window__back"
            aria-label="返回会话列表"
            @click="backToList"
          >
            <AppIcon name="chevron-left" :size="18" />
          </button>
          <button
            type="button"
            class="chat-window__friends"
            @click="router.push('/friends')"
          >
            <AppIcon name="users" :size="15" />
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
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="msg"
            :class="{ 'is-mine': myId !== null && msg.senderId === myId }"
          >
            <div class="msg__bubble">{{ msg.content }}</div>
            <time class="msg__time">{{ formatTime(msg.createdAt) }}</time>
          </div>
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
  </div>
</template>

<style scoped>
.chats-page {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: var(--space-4);
  height: min(760px, calc(100dvh - 180px));
  min-height: 440px;
}
.chat-list,
.chat-window {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.chat-list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
.chat-list__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
.chat-list__new {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
}
.chat-list__new:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.chat-list__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.chat-list__loading {
  padding: var(--space-6);
  font-size: 13px;
  color: var(--text-muted);
}
.conv-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.conv {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-bottom: 1px solid var(--border-default);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}
.conv:hover {
  background: var(--bg-secondary);
}
.conv.is-active {
  background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
}
.conv__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.conv__top,
.conv__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.conv__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv__time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
}
.conv__preview {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv__badge {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--accent-danger);
  color: var(--bg-primary);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.chat-window__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
.chat-window__back {
  display: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.chat-window__friends {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
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
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.chat-window__loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
}
.msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  max-width: 78%;
}
.msg.is-mine {
  align-self: flex-end;
  align-items: flex-end;
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
  border-bottom-left-radius: var(--radius-sm);
}
.msg.is-mine .msg__bubble {
  background: color-mix(in srgb, var(--accent-primary) 18%, var(--bg-card));
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-sm);
}
.msg__time {
  font-size: 11px;
  color: var(--text-muted);
}
.chat-window__composer {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-default);
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

@media (max-width: 900px) {
  .chats-page {
    grid-template-columns: 1fr;
    height: calc(100dvh - 160px);
  }
  .chat-window {
    display: none;
  }
  .chats-page.is-chat-open .chat-list {
    display: none;
  }
  .chats-page.is-chat-open .chat-window {
    display: flex;
  }
  .chat-window__back {
    display: inline-flex;
  }
  .msg {
    max-width: 88%;
  }
}
</style>

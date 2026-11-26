import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/modules/auth'
import { useNotificationsStore } from '@/modules/notifications'
import { useChatStore } from '@/modules/chat/stores/chat.store'
import { useFriendsStore } from '@/modules/friends/stores/friends.store'
import type { Friend } from '@/modules/friends/types/friends.types'
import * as notificationsApi from '@/modules/notifications/api/notifications.api'
import { fetchConversations } from '@/modules/chat/api/chat.api'
import type { Conversation } from '@/modules/chat/types/chat.types'
import type { Notification } from '@/modules/notifications/types/notifications.types'

const TOKEN_KEY = 'hellonote_token'
const POLL_MS = 8000

interface ConvSnapshot {
  unreadCount: number
  lastMessageAt: string | null
}

// 模块级基线：避免组件重建后重新弹历史通知
let lastSeenNotificationId = 0
let convBaseline: Record<number, ConvSnapshot> = {}
let initialized = false
let seenToken: string | null = null
let timer: number | undefined

function maxNotificationId(list: Notification[]): number {
  return list.reduce((max, n) => Math.max(max, n.id), 0)
}

function snapshotConversations(convs: Conversation[]): Record<number, ConvSnapshot> {
  const result: Record<number, ConvSnapshot> = {}
  for (const c of convs) {
    result[c.id] = { unreadCount: c.unreadCount, lastMessageAt: c.lastMessageAt }
  }
  return result
}

/** 服务端 content 已含展示文案（通常以 actor_name 开头），去掉重复昵称前缀 */
function contentWithoutActor(n: Notification): string {
  const name = n.actorName
  if (name && n.content.startsWith(name)) {
    return n.content.slice(name.length).trim() || n.content
  }
  return n.content
}

/** 展示名优先取笔友备注（按 userId 匹配），无则回退原昵称 */
function resolveName(userId: number | null, fallback: string, friends: Friend[]): string {
  if (userId === null) return fallback
  const f = friends.find((item) => item.userId === userId)
  return f?.note || fallback
}

function showNotificationToast(
  n: Notification,
  toast: ReturnType<typeof useToast>,
  friends: Friend[],
): void {
  const name = resolveName(n.actorId, n.actorName || '有人', friends)
  const content = contentWithoutActor(n)
  switch (n.type) {
    case 'friend_request':
      toast.friendMessage({
        avatar: n.actorAvatar,
        name,
        content: content || '想添加你为笔友',
        link: '/friends',
      })
      break
    case 'friend_accept':
      toast.friendMessage({
        avatar: n.actorAvatar,
        name,
        content: content || '通过了你的笔友申请',
        link: '/friends',
      })
      break
    case 'comment':
      toast.notifyMessage({
        avatar: n.actorAvatar,
        name,
        label: '评论了你的笔记',
        // 去掉服务端 content 里重复的动作前缀，只留评论正文
        content: content.replace(/^评论了你的笔记[:：]?\s*/, '') || '评论了你的笔记',
        link: n.relatedId !== null ? `/notes/${n.relatedId}/edit` : undefined,
      })
      break
    case 'like':
      toast.notifyMessage({
        avatar: n.actorAvatar,
        name,
        label: '赞了你的笔记',
        content: content.replace(/^赞了你的笔记[:：]?\s*/, '') || '赞了你的笔记',
        link: n.relatedId !== null ? `/notes/${n.relatedId}/edit` : undefined,
      })
      break
    default:
      // 系统消息（无触发者）：与笔友通知同形态，用「系统」标识
      toast.notifyMessage({ name: '系统', label: '系统通知', content: content || '你有一条新通知' })
  }
}

/**
 * 全局通知/消息轮询：登录态下每 8 秒拉取通知与会话，
 * 与上一次基线比对后推送左下角 toast。首次只记录基线，不弹历史内容。
 * 与 useActivityTracker 一致，挂载于 App.vue，组件卸载时清理定时器。
 */
export function useNotifications(): void {
  const auth = useAuthStore()
  const notificationStore = useNotificationsStore()
  const chatStore = useChatStore()
  const friendsStore = useFriendsStore()
  const toast = useToast()
  const { friends } = storeToRefs(friendsStore)

  async function poll(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || !auth.isAuthenticated) return

    if (seenToken !== token) {
      seenToken = token
      initialized = false
      lastSeenNotificationId = 0
      convBaseline = {}
    }

    try {
      // 好友备注用于 toast 展示名；首次加载一次即可（store 会缓存）
      if (!friends.value.length) void friendsStore.loadFriends()
      const [list, count, conversations] = await Promise.all([
        notificationsApi.fetchNotifications(),
        notificationsApi.fetchUnreadCount(),
        fetchConversations(),
      ])

      if (!initialized) {
        initialized = true
        lastSeenNotificationId = maxNotificationId(list)
        convBaseline = snapshotConversations(conversations)
        notificationStore.applyPoll(list, count)
        return
      }

      const fresh = list.filter((n) => n.id > lastSeenNotificationId)
      for (const n of fresh) showNotificationToast(n, toast, friends.value)

      let nextBaseline = convBaseline
      for (const c of conversations) {
        const prev = convBaseline[c.id]
        const hasNew =
          prev && c.lastMessageAt && c.lastMessageAt !== prev.lastMessageAt && c.unreadCount > 0
        // 用户正打开该会话时，消息由聊天窗口的轮询直接同步显示，不重复弹 toast
        if (hasNew && chatStore.activeConversationId !== c.id) {
          toast.friendMessage({
            avatar: c.peer.avatarUrl,
            name: resolveName(c.peer.id, c.peer.displayName, friends.value),
            content: c.lastMessage ?? '',
            link: `/chats/${c.peer.id}`,
          })
        }
        nextBaseline = {
          ...nextBaseline,
          [c.id]: { unreadCount: c.unreadCount, lastMessageAt: c.lastMessageAt },
        }
      }
      convBaseline = nextBaseline

      if (fresh.length) lastSeenNotificationId = Math.max(lastSeenNotificationId, maxNotificationId(fresh))
      notificationStore.applyPoll(list, count)
    } catch {
      // 静默：轮询失败不打扰用户
    }
  }

  onMounted(() => {
    void poll()
    timer = window.setInterval(() => {
      void poll()
    }, POLL_MS)
  })

  onUnmounted(() => {
    if (timer !== undefined) window.clearInterval(timer)
  })
}

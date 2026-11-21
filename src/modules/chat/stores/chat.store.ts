import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as chatApi from '../api/chat.api'
import type { Conversation, Message } from '../types/chat.types'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const messagesByConv = ref<Record<number, Message[]>>({})
  const loading = ref(false)
  const messagesLoading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)
  // 当前正在查看的会话：全局轮询据此决定新消息是同步进窗口还是弹 toast
  const activeConversationId = ref<number | null>(null)

  function setActiveConversation(id: number | null): void {
    activeConversationId.value = id
  }

  async function loadConversations(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      conversations.value = await chatApi.fetchConversations()
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '加载会话失败'
    } finally {
      loading.value = false
    }
  }

  function sameMessages(a: Message[], b: Message[]): boolean {
    if (a.length !== b.length) return false
    return a.every((m, i) =>
      m.id === b[i].id && m.content === b[i].content && m.isRead === b[i].isRead,
    )
  }

  async function loadMessages(conversationId: number): Promise<void> {
    messagesLoading.value = true
    error.value = null
    try {
      const fresh = await chatApi.fetchMessages(conversationId)
      const current = messagesByConv.value[conversationId] ?? []
      // 内容未变则跳过写入，避免轮询时重复触发滚动/渲染
      if (!sameMessages(current, fresh)) {
        messagesByConv.value = { ...messagesByConv.value, [conversationId]: fresh }
      }
      // 进入会话即已读：清掉该会话未读角标
      conversations.value = conversations.value.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      )
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '加载消息失败'
    } finally {
      messagesLoading.value = false
    }
  }

  async function send(conversationId: number, content: string): Promise<Message | null> {
    const trimmed = content.trim()
    if (!trimmed || sending.value) return null
    sending.value = true
    error.value = null
    try {
      const message = await chatApi.sendMessage(conversationId, trimmed)
      messagesByConv.value = {
        ...messagesByConv.value,
        [conversationId]: [...(messagesByConv.value[conversationId] ?? []), message],
      }
      await loadConversations()
      return message
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '发送失败'
      return null
    } finally {
      sending.value = false
    }
  }

  async function openWith(userId: number): Promise<Conversation | null> {
    error.value = null
    try {
      const conversation = await chatApi.openChatWith(userId)
      const exists = conversations.value.some((c) => c.id === conversation.id)
      conversations.value = exists
        ? conversations.value.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...conversations.value]
      return conversation
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '打开会话失败'
      return null
    }
  }

  return {
    conversations,
    messagesByConv,
    loading,
    messagesLoading,
    sending,
    error,
    activeConversationId,
    setActiveConversation,
    loadConversations,
    loadMessages,
    send,
    openWith,
  }
})

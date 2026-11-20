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

  async function loadMessages(conversationId: number): Promise<void> {
    messagesLoading.value = true
    error.value = null
    try {
      messagesByConv.value = {
        ...messagesByConv.value,
        [conversationId]: await chatApi.fetchMessages(conversationId),
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
    loadConversations,
    loadMessages,
    send,
    openWith,
  }
})

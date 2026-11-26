import http from '@/services/http/client'
import type { ChatPeer, Conversation, Message } from '../types/chat.types'

// 后端返回 snake_case，这里映射为前端 camelCase 领域模型。
interface RawPeer {
  id: number
  username: string | null
  display_name: string | null
  avatar_url: string | null
  last_active_at?: string | null
}

interface RawConversation {
  id: number
  peer: RawPeer
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  updated_at: string
}

interface RawMessage {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  is_read: boolean
  created_at: string
}

function mapPeer(r: RawPeer): ChatPeer {
  return {
    id: r.id,
    username: r.username ?? '',
    displayName: r.display_name || r.username || '匿名',
    avatarUrl: r.avatar_url ?? null,
    lastActiveAt: r.last_active_at ?? null,
  }
}

function mapConversation(r: RawConversation): Conversation {
  return {
    id: r.id,
    peer: mapPeer(r.peer),
    lastMessage: r.last_message ?? null,
    lastMessageAt: r.last_message_at ?? null,
    unreadCount: r.unread_count ?? 0,
    updatedAt: r.updated_at,
  }
}

function mapMessage(r: RawMessage): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    content: r.content,
    isRead: !!r.is_read,
    createdAt: r.created_at,
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await http.get<RawConversation[]>('/chats')
  return (data ?? []).map(mapConversation)
}

export async function fetchMessages(conversationId: number): Promise<Message[]> {
  const { data } = await http.get<RawMessage[]>(`/chats/${conversationId}/messages`)
  return (data ?? []).map(mapMessage)
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  const { data } = await http.post<RawMessage>(`/chats/${conversationId}/messages`, { content })
  return mapMessage(data)
}

export async function openChatWith(userId: number): Promise<Conversation> {
  const { data } = await http.post<RawConversation>(`/chats/with/${userId}`)
  return mapConversation(data)
}

/** 把指定会话中对方发来的消息标记为已读 */
export async function markConversationRead(conversationId: number): Promise<void> {
  await http.post(`/chats/${conversationId}/read`)
}

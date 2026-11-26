// 聊天领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/chat/api/chat.api.ts 映射。
export interface ChatPeer {
  id: number
  username: string
  displayName: string
  avatarUrl: string | null
  /** 最后活跃时间（在线状态判定依据） */
  lastActiveAt: string | null
}

export interface Conversation {
  id: number
  peer: ChatPeer
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  updatedAt: string
}

export interface Message {
  id: number
  conversationId: number
  senderId: number
  content: string
  isRead: boolean
  createdAt: string
}

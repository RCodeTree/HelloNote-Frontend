// 通知领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/notifications/api/notifications.api.ts 映射。

export type NotificationType =
  | 'system'
  | 'comment'
  | 'reply'
  | 'like'
  | 'friend_request'
  | 'friend_accept'

export interface Notification {
  id: number
  type: NotificationType
  actorId: number | null
  actorName: string
  actorAvatar: string | null
  content: string
  /** 关联对象 id：friend_request 为好友关系 id，comment/reply/like 为笔记 id */
  relatedId: number | null
  isRead: boolean
  createdAt: string
}

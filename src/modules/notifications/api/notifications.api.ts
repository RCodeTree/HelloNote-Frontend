import http from '@/services/http/client'
import type { Notification, NotificationType } from '../types/notifications.types'

// 后端返回 snake_case，这里映射为前端 camelCase 领域模型。
interface RawNotification {
  id: number
  type: string | null
  actor_id: number | null
  actor_name: string | null
  actor_avatar: string | null
  content: string | null
  related_id: number | null
  is_read: boolean
  created_at: string
}

interface RawOk {
  ok: boolean
}

function toType(value: string | null | undefined): NotificationType {
  switch (value) {
    case 'comment':
    case 'like':
    case 'friend_request':
    case 'friend_accept':
      return value
    default:
      return 'system'
  }
}

function mapNotification(r: RawNotification): Notification {
  return {
    id: r.id,
    type: toType(r.type),
    actorId: r.actor_id ?? null,
    actorName: r.actor_name ?? '',
    actorAvatar: r.actor_avatar ?? null,
    content: r.content ?? '',
    relatedId: r.related_id ?? null,
    isRead: !!r.is_read,
    createdAt: r.created_at,
  }
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await http.get<RawNotification[]>('/notifications')
  return (data ?? []).map(mapNotification)
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await http.get<{ count: number }>('/notifications/unread-count')
  return data?.count ?? 0
}

export async function markNotificationRead(id: number): Promise<boolean> {
  const { data } = await http.post<RawOk>(`/notifications/${id}/read`)
  return !!data?.ok
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const { data } = await http.post<RawOk>('/notifications/read-all')
  return !!data?.ok
}

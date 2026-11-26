import http from '@/services/http/client'
import type {
  Friend,
  FriendBrief,
  FriendCloseness,
  FriendPrivacy,
  FriendSettings,
} from '../types/friends.types'

// 后端返回 snake_case，这里映射为前端 camelCase 领域模型。
interface RawFriend {
  id: number
  user_id: number
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  status: string
  is_requester: boolean
  note?: string | null
  privacy?: string | null
  relation_type?: string | null
  closeness?: string | null
  unread_count?: number
  is_pinned?: boolean | null
  request_message?: string | null
  last_active_at?: string | null
}

interface RawFriendSettings {
  note?: string
  privacy?: FriendPrivacy
  relation_type?: string
  closeness?: FriendCloseness
  is_pinned?: boolean
}

interface RawFriendBrief {
  id: number
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

function toPrivacy(value: string | null | undefined): FriendPrivacy {
  return value === 'friends' || value === 'hidden' ? value : 'all'
}

function toCloseness(value: string | null | undefined): FriendCloseness {
  return value === 'friend' || value === 'close' || value === 'intimate' ? value : 'acquaintance'
}

function mapFriend(r: RawFriend): Friend {
  return {
    id: r.id,
    userId: r.user_id,
    username: r.username ?? '',
    displayName: r.display_name || r.username || '匿名',
    avatarUrl: r.avatar_url ?? null,
    bio: r.bio ?? '',
    status: r.status ?? '',
    isRequester: !!r.is_requester,
    note: r.note ?? '',
    privacy: toPrivacy(r.privacy),
    relationType: r.relation_type ?? '',
    closeness: toCloseness(r.closeness),
    unreadCount: r.unread_count ?? 0,
    isPinned: !!r.is_pinned,
    requestMessage: r.request_message ?? '',
    lastActiveAt: r.last_active_at ?? null,
  }
}

function mapBrief(r: RawFriendBrief): FriendBrief {
  return {
    id: r.id,
    username: r.username ?? '',
    displayName: r.display_name || r.username || '匿名',
    avatarUrl: r.avatar_url ?? null,
  }
}

export async function fetchFriends(): Promise<Friend[]> {
  const { data } = await http.get<RawFriend[]>('/friends')
  return (data ?? []).map(mapFriend)
}

export async function fetchRequests(): Promise<Friend[]> {
  const { data } = await http.get<RawFriend[]>('/friends/requests')
  return (data ?? []).map(mapFriend)
}

export async function addFriend(username: string, message?: string): Promise<Friend> {
  const body: { username: string; message?: string } = { username }
  if (message?.trim()) body.message = message.trim()
  const { data } = await http.post<RawFriend>('/friends', body)
  return mapFriend(data)
}

export async function acceptFriend(friendshipId: number): Promise<Friend> {
  const { data } = await http.post<RawFriend>(`/friends/${friendshipId}/accept`)
  return mapFriend(data)
}

export async function removeFriend(friendshipId: number): Promise<void> {
  await http.delete(`/friends/${friendshipId}`)
}

export async function updateFriendSettings(friendshipId: number, payload: FriendSettings): Promise<Friend> {
  const body: RawFriendSettings = {}
  if (payload.note !== undefined) body.note = payload.note
  if (payload.privacy !== undefined) body.privacy = payload.privacy
  if (payload.relationType !== undefined) body.relation_type = payload.relationType
  if (payload.closeness !== undefined) body.closeness = payload.closeness
  if (payload.isPinned !== undefined) body.is_pinned = payload.isPinned
  const { data } = await http.patch<RawFriend>(`/friends/${friendshipId}/settings`, body)
  return mapFriend(data)
}

export async function searchFriends(q: string): Promise<FriendBrief[]> {
  const { data } = await http.get<RawFriendBrief[]>('/friends/search', { params: { q } })
  return (data ?? []).map(mapBrief)
}

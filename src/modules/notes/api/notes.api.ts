import http from '@/services/http/client'
import type {
  Note, NoteCreatePayload, NoteUpdatePayload, PublicNote, Tag,
} from '../types/notes.types'

// 后端返回 snake_case，这里映射为前端 camelCase 领域模型。
interface RawTag {
  id: number
  name: string
  color: string | null
}
interface RawNote {
  id: number
  title: string
  content: string
  format?: 'markdown' | 'text'
  is_pinned: boolean
  is_public?: boolean
  created_at: string
  updated_at: string
  tags: RawTag[]
}

interface RawPublicNote {
  id: number
  title: string
  excerpt: string
  format?: 'markdown' | 'text'
  author_id: number
  author_name: string
  author_avatar: string | null
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  tags: RawTag[]
}

function mapTags(tags: RawTag[]): Tag[] {
  return tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))
}

function mapPublicNote(r: RawPublicNote): PublicNote {
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    format: r.format ?? 'markdown',
    authorId: r.author_id,
    authorName: r.author_name,
    authorAvatar: r.author_avatar ?? null,
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tags: mapTags(r.tags ?? []),
  }
}

function mapNote(r: RawNote): Note {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    // 兼容后端尚未迁移出 format 字段的过渡期
    format: r.format ?? 'markdown',
    isPinned: r.is_pinned,
    isPublic: !!r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tags: mapTags(r.tags ?? []),
  }
}

export interface FetchNotesParams {
  limit?: number
  offset?: number
  search?: string
  tagId?: number
}

export async function fetchNotes(
  params: FetchNotesParams = {},
): Promise<{ items: Note[]; total: number }> {
  const { data, headers } = await http.get<RawNote[]>('/notes', {
    params: {
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      search: params.search || undefined,
      tag_id: params.tagId,
    },
  })
  return {
    items: data.map(mapNote),
    total: Number(headers['x-total-count'] ?? data.length),
  }
}

export async function fetchNote(id: number): Promise<Note> {
  const { data } = await http.get<RawNote>(`/notes/${id}`)
  return mapNote(data)
}

export async function createNote(payload: NoteCreatePayload): Promise<Note> {
  const { data } = await http.post<RawNote>('/notes', {
    title: payload.title,
    content: payload.content,
    format: payload.format,
    is_pinned: payload.isPinned,
    is_public: payload.isPublic,
    tag_ids: payload.tagIds,
  })
  return mapNote(data)
}

export async function updateNote(id: number, payload: NoteUpdatePayload): Promise<Note> {
  const body: Record<string, unknown> = {}
  if (payload.title !== undefined) body.title = payload.title
  if (payload.content !== undefined) body.content = payload.content
  if (payload.format !== undefined) body.format = payload.format
  if (payload.isPinned !== undefined) body.is_pinned = payload.isPinned
  if (payload.isPublic !== undefined) body.is_public = payload.isPublic
  if (payload.tagIds !== undefined) body.tag_ids = payload.tagIds
  const { data } = await http.put<RawNote>(`/notes/${id}`, body)
  return mapNote(data)
}

export async function deleteNote(id: number): Promise<void> {
  await http.delete(`/notes/${id}`)
}

export async function togglePin(id: number): Promise<Note> {
  const { data } = await http.patch<RawNote>(`/notes/${id}/pin`)
  return mapNote(data)
}

// 复用已有标签列表（本次仅关联已有标签，不做标签增删）。
export async function fetchTags(): Promise<Tag[]> {
  const { data } = await http.get<RawTag[]>('/tags')
  return data.map((t) => ({ id: t.id, name: t.name, color: t.color }))
}

// 新建标签（编辑器内联创建用）
export async function createTag(name: string): Promise<Tag> {
  const { data } = await http.post<RawTag>('/tags', { name })
  return { id: data.id, name: data.name, color: data.color }
}

// ===== V10 公开笔记 / 笔记广场 =====
export interface FetchPublicNotesParams {
  limit?: number
  offset?: number
  search?: string
  tagId?: number
  sort?: 'hot' | 'name' | 'time'
}

export async function fetchPublicNotes(
  params: FetchPublicNotesParams = {},
): Promise<{ items: PublicNote[]; total: number }> {
  const { data, headers } = await http.get<RawPublicNote[]>('/notes/public', {
    params: {
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      search: params.search || undefined,
      tag_id: params.tagId,
      sort: params.sort ?? 'hot',
    },
  })
  return {
    items: (data ?? []).map(mapPublicNote),
    total: Number(headers['x-total-count'] ?? data.length),
  }
}

export async function fetchPublicNote(id: number): Promise<PublicNote> {
  const { data } = await http.get<RawPublicNote>(`/notes/public/${id}`)
  return mapPublicNote(data)
}

export async function fetchUserPublicNotes(userId: number, limit = 50): Promise<PublicNote[]> {
  const { data } = await http.get<RawPublicNote[]>(`/notes/users/${userId}/public`, {
    params: { limit },
  })
  return (data ?? []).map(mapPublicNote)
}

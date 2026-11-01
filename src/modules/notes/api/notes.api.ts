import http from '@/services/http/client'
import type { Note, NoteCreatePayload, NoteUpdatePayload, Tag } from '../types/notes.types'

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
  is_pinned: boolean
  created_at: string
  updated_at: string
  tags: RawTag[]
}

function mapNote(r: RawNote): Note {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    isPinned: r.is_pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tags: r.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
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
    is_pinned: payload.isPinned,
    tag_ids: payload.tagIds,
  })
  return mapNote(data)
}

export async function updateNote(id: number, payload: NoteUpdatePayload): Promise<Note> {
  const body: Record<string, unknown> = {}
  if (payload.title !== undefined) body.title = payload.title
  if (payload.content !== undefined) body.content = payload.content
  if (payload.isPinned !== undefined) body.is_pinned = payload.isPinned
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

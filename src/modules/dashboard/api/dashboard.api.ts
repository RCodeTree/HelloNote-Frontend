import http from '@/services/http/client'
import type { DashboardStats, NoteSummary, TagInfo } from '../types/dashboard.types'

// 真实后端接口（FastAPI，/api/v1 前缀已在 Axios baseURL 配置）。
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
interface RawStats {
  total_notes: number
  pinned_notes: number
  total_tags: number
  words_written: number
}

function mapNote(raw: RawNote): NoteSummary {
  return {
    id: raw.id,
    title: raw.title,
    excerpt: raw.content.replace(/\s+/g, ' ').trim().slice(0, 120),
    isPinned: raw.is_pinned,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    tags: raw.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await http.get<RawStats>('/dashboard/stats')
  return {
    totalNotes: data.total_notes,
    pinnedNotes: data.pinned_notes,
    totalTags: data.total_tags,
    wordsWritten: data.words_written,
  }
}

export async function fetchRecentNotes(limit = 6): Promise<NoteSummary[]> {
  const { data } = await http.get<RawNote[]>('/dashboard/notes/recent', { params: { limit } })
  return data.map(mapNote)
}

export async function fetchTags(): Promise<TagInfo[]> {
  const { data } = await http.get<RawTag[]>('/dashboard/tags')
  return data.map((t) => ({ id: t.id, name: t.name, color: t.color }))
}

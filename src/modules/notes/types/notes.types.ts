// 笔记领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/notes/api/notes.api.ts 负责映射。
export interface Tag {
  id: number
  name: string
  color: string | null
}

export interface Note {
  id: number
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
  tags: Tag[]
}

export interface NoteCreatePayload {
  title: string
  content: string
  isPinned: boolean
  tagIds: number[]
}

export interface NoteUpdatePayload {
  title?: string
  content?: string
  isPinned?: boolean
  tagIds?: number[]
}

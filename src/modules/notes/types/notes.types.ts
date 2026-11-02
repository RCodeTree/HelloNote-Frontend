// 笔记领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/notes/api/notes.api.ts 负责映射。
export interface Tag {
  id: number
  name: string
  color: string | null
}

/** 内容格式：markdown 需要 Markdown 解析（可预览），text 为纯文本（不解析） */
export type NoteFormat = 'markdown' | 'text'

export interface Note {
  id: number
  title: string
  content: string
  format: NoteFormat
  isPinned: boolean
  createdAt: string
  updatedAt: string
  tags: Tag[]
}

export interface NoteCreatePayload {
  title: string
  content: string
  format: NoteFormat
  isPinned: boolean
  tagIds: number[]
}

export interface NoteUpdatePayload {
  title?: string
  content?: string
  format?: NoteFormat
  isPinned?: boolean
  tagIds?: number[]
}

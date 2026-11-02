// 笔记领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/notes/api/notes.api.ts 负责映射。
export interface Tag {
  id: number
  name: string
  color: string | null
}

/** 内容格式：markdown 需要 Markdown 解析（可预览），text 为纯文本（不解析） */
export type NoteFormat = 'markdown' | 'text'

/** 大纲节点：由 Markdown 标题行解析，用于右侧导航与悬浮预览 */
export interface NoteOutlineNode {
  id: string
  level: number
  text: string
  /** 该标题到下一个标题之间的正文摘要（悬浮预览用） */
  snippet: string
  /** 标题所在行号（0 基），用于计算滚动定位 */
  line: number
}

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

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
  isPublic: boolean
  createdAt: string
  updatedAt: string
  tags: Tag[]
}

/** 公开笔记（广场/笔友主页卡片）：含作者与互动计数 */
export interface PublicNote {
  id: number
  title: string
  excerpt: string
  format: NoteFormat
  authorId: number
  authorName: string
  authorAvatar: string | null
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  tags: Tag[]
}

export interface NoteCreatePayload {
  title: string
  content: string
  format: NoteFormat
  isPinned: boolean
  isPublic?: boolean
  tagIds: number[]
}

export interface NoteUpdatePayload {
  title?: string
  content?: string
  format?: NoteFormat
  isPinned?: boolean
  isPublic?: boolean
  tagIds?: number[]
}

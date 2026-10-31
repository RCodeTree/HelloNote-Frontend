// 面板领域模型（前端使用 camelCase）。
// 后端 MySQL 返回的 JSON 为 snake_case（见 sql/v1/sql_v1.sql），
// 由各 api 模块负责映射为以下结构。
export interface TagInfo {
  id: number
  name: string
  color: string | null
}

export interface NoteSummary {
  id: number
  title: string
  excerpt: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
  tags: TagInfo[]
}

export interface DashboardStats {
  totalNotes: number
  pinnedNotes: number
  totalTags: number
  wordsWritten: number
}

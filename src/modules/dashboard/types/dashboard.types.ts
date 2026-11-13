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

// ===== V3 活跃度 =====

/** 某业务日（YYYY-MM-DD）的活跃度明细。 */
export interface ActivityDay {
  date: string
  /** 当日新增笔记次数 */
  created: number
  /** 当日修改笔记次数（含置顶切换） */
  updated: number
  /** 当日删除笔记次数 */
  deleted: number
  /** 当日活跃点数 = created + updated + deleted（热力图颜色深浅依据） */
  count: number
  /** 当日活跃时长（秒） */
  activeSeconds: number
}

/** 活跃度汇总（「活动时长」卡片等使用）。 */
export interface ActivitySummary {
  todayActiveSeconds: number
  weekActiveSeconds: number
  totalActiveSeconds: number
  activeDays: number
  currentStreak: number
  longestStreak: number
  totalEvents: number
}

/** 范围查询结果：连续日期序列 + 汇总。 */
export interface ActivityRange {
  startDate: string
  endDate: string
  days: ActivityDay[]
  summary: ActivitySummary
}

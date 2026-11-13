import http from '@/services/http/client'
import type {
  ActivityDay,
  ActivityRange,
  ActivitySummary,
  DashboardStats,
  NoteSummary,
  TagInfo,
} from '../types/dashboard.types'

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

// ===== V3 活跃度 =====

interface RawActivityDay {
  date: string
  created: number
  updated: number
  deleted: number
  count: number
  active_seconds: number
}
interface RawActivitySummary {
  today_active_seconds: number
  week_active_seconds: number
  total_active_seconds: number
  active_days: number
  current_streak: number
  longest_streak: number
  total_events: number
}
interface RawActivityRange {
  start_date: string
  end_date: string
  days: RawActivityDay[]
  summary: RawActivitySummary
}

/** 拉取最近 days 天的每日活跃度（日历 / 热力图 / 活动时长共用）。 */
export async function fetchActivityRange(days = 371): Promise<ActivityRange> {
  const { data } = await http.get<RawActivityRange>('/activity/range', { params: { days } })
  const dayList: ActivityDay[] = data.days.map((d) => ({
    date: d.date,
    created: d.created,
    updated: d.updated,
    deleted: d.deleted,
    count: d.count,
    activeSeconds: d.active_seconds,
  }))
  const summary: ActivitySummary = {
    todayActiveSeconds: data.summary.today_active_seconds,
    weekActiveSeconds: data.summary.week_active_seconds,
    totalActiveSeconds: data.summary.total_active_seconds,
    activeDays: data.summary.active_days,
    currentStreak: data.summary.current_streak,
    longestStreak: data.summary.longest_streak,
    totalEvents: data.summary.total_events,
  }
  return { startDate: data.start_date, endDate: data.end_date, days: dayList, summary }
}

/** 上报一段活跃时长（秒）。失败静默，不影响用户操作。 */
export async function postHeartbeat(activeSeconds: number): Promise<void> {
  if (activeSeconds <= 0) return
  try {
    await http.post('/activity/heartbeat', { active_seconds: activeSeconds })
  } catch {
    // 心跳为尽力而为，忽略网络/鉴权错误
  }
}

import type { ActivityDay } from '../types/dashboard.types'

/** 本地 Date → 'YYYY-MM-DD'（不依赖 UTC，避免时区漂移）。 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 'YYYY-MM-DD' → 本地 Date（用数值构造，避免 new Date(str) 被当 UTC 解析）。 */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

/** 周一=0 … 周日=6。 */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** 秒数 → 人类可读时长（如 2小时15分 / 45分钟 / 30秒）。 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0分钟'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return m > 0 ? `${h}小时${m}分` : `${h}小时`
  if (m > 0) return `${m}分钟`
  return `${s}秒`
}

/** 'YYYY-MM-DD' → 中文日期（如 2026年11月13日）。 */
export function formatDateCN(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

/** 活跃点数 → 色阶等级 0~4（与热力图 / 日历共用）。 */
export function activityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

/** 把连续日期序列建成 date -> ActivityDay 映射，便于按日期查表。 */
export function buildActivityMap(days: ActivityDay[]): Map<string, ActivityDay> {
  const map = new Map<string, ActivityDay>()
  for (const d of days) map.set(d.date, d)
  return map
}

// 笔友在线状态判定：最后活跃时间在阈值内视为在线。
// 后端认证请求以 60s 节流写入 last_active_at，前端轮询 8~10s 拉取，
// 2 分钟阈值既容忍写库节流，又能区分「开着页面」与「已离开」。

/** 在线判定阈值（毫秒） */
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000

/** 是否在线：最后活跃时间在阈值内 */
export function isUserOnline(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false
  const t = new Date(lastActiveAt).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t <= ONLINE_THRESHOLD_MS
}

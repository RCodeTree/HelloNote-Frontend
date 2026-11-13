import { onMounted, onUnmounted } from 'vue'
import { postHeartbeat } from '../api/dashboard.api'

/**
 * 全局「活跃时长」心跳。
 *
 * 统计口径：仅当用户已登录且页面处于可见状态时，以「最近有交互」判定活跃，
 * 按秒累计；攒够一个窗口后上报后端 `POST /activity/heartbeat`（累加到当日）。
 * 空闲或切到后台时立即结算，页面卸载时用 keepalive fetch 尽力上报剩余秒数。
 *
 * 设计要点：
 * - 上报完全静默（失败不打扰用户、不弹错），活跃时长是「尽力而为」的统计；
 * - 用 `sendBeacon`/keepalive 兜底卸载场景，避免关闭页面丢失最后一段时长；
 * - 与面板 UI 解耦：全局挂载于 App.vue，覆盖编辑器等所有登录态页面。
 */

const TOKEN_KEY = 'hellonote_token'
const TICK_MS = 1000 // 每秒检查一次
const IDLE_MS = 60_000 // 超过 60s 无交互视为离开，停止累计
const FLUSH_SECONDS = 30 // 累计满 30s 上报一次

function authToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** 页面正在卸载/切后台时，用 keepalive fetch 兜底上报（不依赖 axios 拦截器生命周期）。 */
function keepaliveHeartbeat(seconds: number): void {
  const token = authToken()
  if (!token || seconds <= 0) return
  const base = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  try {
    void fetch(`${base}/activity/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active_seconds: seconds }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 静默
  }
}

export function useActivityTracker(): void {
  let timer: number | undefined
  let lastActiveAt = 0
  let pendingSeconds = 0
  let flushing = false

  function markActive(): void {
    lastActiveAt = Date.now()
  }

  /** 结算累计秒数；silent 用 keepalive（卸载/隐藏），否则走统一 http 客户端。 */
  async function flush(useKeepalive = false): Promise<void> {
    if (flushing || pendingSeconds <= 0) return
    if (!authToken()) {
      pendingSeconds = 0
      return
    }
    const seconds = Math.min(Math.round(pendingSeconds), 3600)
    if (seconds <= 0) return
    flushing = true
    try {
      if (useKeepalive) {
        keepaliveHeartbeat(seconds)
      } else {
        await postHeartbeat(seconds)
      }
      // 上报成功后扣减，失败则保留到下一次重试
      pendingSeconds = Math.max(0, pendingSeconds - seconds)
    } catch {
      // 静默
    } finally {
      flushing = false
    }
  }

  function tick(): void {
    if (!authToken()) return
    const visible = document.visibilityState === 'visible'
    const active = Date.now() - lastActiveAt < IDLE_MS
    if (!visible || !active) {
      // 离开/空闲：把已累计的立即结算，避免丢失
      void flush(document.visibilityState === 'hidden')
      return
    }
    pendingSeconds += TICK_MS / 1000
    if (pendingSeconds >= FLUSH_SECONDS) void flush()
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      void flush(true)
    } else {
      markActive()
    }
  }

  function onPageHide(): void {
    void flush(true)
  }

  const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'mousemove', 'scroll', 'touchstart'] as const

  onMounted(() => {
    markActive()
    for (const e of ACTIVITY_EVENTS) {
      window.addEventListener(e, markActive, { passive: true })
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    timer = window.setInterval(tick, TICK_MS)
  })

  onUnmounted(() => {
    if (timer !== undefined) window.clearInterval(timer)
    for (const e of ACTIVITY_EVENTS) {
      window.removeEventListener(e, markActive)
    }
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onPageHide)
    void flush(true)
  })
}

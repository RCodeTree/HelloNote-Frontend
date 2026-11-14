import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'hellonote-theme'

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

/** 仅在「用户主动切换」时启用整页颜色过渡；首屏 init 不启用，避免加载时整页渐变。 */
function applyTheme(resolved: ResolvedTheme, animate = false): void {
  const root = document.documentElement
  if (animate && typeof window !== 'undefined') {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (!reduce) {
      root.classList.add('theme-transitioning')
      // 强制一次样式重算，确保浏览器先以「带过渡」的状态记录旧颜色，
      // 再改变 data-theme 才能真正启动过渡（否则同帧合并可能不触发）。
      void getComputedStyle(root).backgroundColor
    }
  }
  root.setAttribute('data-theme', resolved)
  root.style.colorScheme = resolved
}

// 模块级变量：不放入 store state，避免不必要的响应式与序列化问题。
let mediaQuery: MediaQueryList | null = null
let mediaHandler: ((event: MediaQueryListEvent) => void) | null = null
let transitionTimer: ReturnType<typeof setTimeout> | null = null

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('system')
  const resolvedTheme = ref<ResolvedTheme>('light')

  function stopWatchSystem(): void {
    if (mediaQuery && mediaHandler) {
      mediaQuery.removeEventListener('change', mediaHandler)
      mediaQuery = null
      mediaHandler = null
    }
  }

  function watchSystem(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return
    stopWatchSystem()
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaHandler = (event: MediaQueryListEvent) => {
      if (mode.value !== 'system') return
      const next: ResolvedTheme = event.matches ? 'dark' : 'light'
      if (next === resolvedTheme.value) return
      resolvedTheme.value = next
      applyTheme(next, true) // 系统主题自动切换时同样平滑
      scheduleTransitionCleanup()
    }
    mediaQuery.addEventListener('change', mediaHandler)
  }

  /** 颜色过渡结束后移除临时 class，使平时不残留任何全局 transition。 */
  function scheduleTransitionCleanup(): void {
    if (transitionTimer !== null) clearTimeout(transitionTimer)
    transitionTimer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
      transitionTimer = null
    }, 340)
  }

  function initTheme(): void {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    mode.value = stored ?? 'system'
    resolvedTheme.value = resolve(mode.value)
    applyTheme(resolvedTheme.value)
    if (mode.value === 'system') watchSystem()
    else stopWatchSystem()
  }

  function setMode(next: ThemeMode): void {
    const resolved = resolve(next)
    const changed = resolved !== resolvedTheme.value
    mode.value = next
    resolvedTheme.value = resolved
    // 仅当实际解析主题变化时做整页颜色过渡（如 dark→light 或 system→dark）；
    // 重复点同一项（dark→dark）不触发，避免无意义的闪动。
    applyTheme(resolved, changed)
    if (changed) scheduleTransitionCleanup()
    localStorage.setItem(STORAGE_KEY, next)
    if (next === 'system') watchSystem()
    else stopWatchSystem()
  }

  return { mode, resolvedTheme, initTheme, setMode }
})

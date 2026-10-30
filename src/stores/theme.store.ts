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

function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.style.colorScheme = resolved
}

// 模块级变量：不放入 store state，避免不必要的响应式与序列化问题。
let mediaQuery: MediaQueryList | null = null
let mediaHandler: ((event: MediaQueryListEvent) => void) | null = null

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
      if (mode.value === 'system') {
        resolvedTheme.value = event.matches ? 'dark' : 'light'
        applyTheme(resolvedTheme.value)
      }
    }
    mediaQuery.addEventListener('change', mediaHandler)
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
    mode.value = next
    resolvedTheme.value = resolve(next)
    applyTheme(resolvedTheme.value)
    localStorage.setItem(STORAGE_KEY, next)
    if (next === 'system') watchSystem()
    else stopWatchSystem()
  }

  return { mode, resolvedTheme, initTheme, setMode }
})

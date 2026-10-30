import { storeToRefs } from 'pinia'
import { useThemeStore, type ThemeMode } from '@/stores/theme.store'

export interface ThemeOption {
  value: ThemeMode
  label: string
}

// 主题组合式函数：为组件提供主题模式列表与切换能力，
// 实际状态由 theme.store 统一管理。
export function useTheme() {
  const themeStore = useThemeStore()
  const { mode, resolvedTheme } = storeToRefs(themeStore)

  const options: ThemeOption[] = [
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
    { value: 'system', label: '跟随系统' },
  ]

  function setMode(next: ThemeMode): void {
    themeStore.setMode(next)
  }
  function initTheme(): void {
    themeStore.initTheme()
  }

  return { themeStore, mode, resolvedTheme, options, setMode, initTheme }
}

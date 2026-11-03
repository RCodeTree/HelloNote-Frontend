import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type SidebarMode = 'full' | 'rail' | 'hidden'

const SIDEBAR_MODE_KEY = 'hellonote_sidebar_mode'

export const useAppStore = defineStore('app', () => {
  // 侧栏显示模式（持久化）：full=完整 / rail=仅图标 / hidden=全隐藏+悬停弹出
  const savedMode = localStorage.getItem(SIDEBAR_MODE_KEY)
  const sidebarMode = ref<SidebarMode>(
    savedMode === 'rail' || savedMode === 'hidden' ? savedMode : 'full',
  )
  // 视口自适应状态：<768 视为移动端（抽屉），768~1024 自动收起为图标栏
  const isMobile = ref<boolean>(false)
  const autoCollapsed = ref<boolean>(false)
  // 移动端抽屉开关（手动）
  const mobileOpen = ref<boolean>(false)
  // 「编辑资料」弹窗开关：由侧栏菜单触发，DefaultLayout 挂载唯一的 ProfileDialog 实例
  const profileOpen = ref<boolean>(false)
  function openProfile(): void {
    profileOpen.value = true
  }
  function closeProfile(): void {
    profileOpen.value = false
  }

  // 实际生效模式：移动端走抽屉（视为 full 布局）；中屏把 full 降级为 rail
  const effectiveMode = computed<SidebarMode>(() => {
    if (isMobile.value) return 'full'
    if (autoCollapsed.value && sidebarMode.value === 'full') return 'rail'
    return sidebarMode.value
  })

  // 「仅图标」紧凑态（rail）：供 SidebarUser 等组件切换紧凑样式
  const sidebarCollapsed = computed(() => !isMobile.value && effectiveMode.value === 'rail')

  // 侧栏实际宽度（px）：hidden 模式侧栏脱离文档流，内容区占满全屏（宽度 0）
  const sidebarWidth = computed<number>(() => {
    if (isMobile.value) return 0
    if (effectiveMode.value === 'rail') return 76
    if (effectiveMode.value === 'hidden') return 0
    return 240
  })

  function setSidebarMode(mode: SidebarMode): void {
    sidebarMode.value = mode
    localStorage.setItem(SIDEBAR_MODE_KEY, mode)
  }

  function toggleMobile(): void {
    mobileOpen.value = !mobileOpen.value
  }

  function closeMobile(): void {
    mobileOpen.value = false
  }

  function handleResize(): void {
    const w = window.innerWidth
    isMobile.value = w < 768
    autoCollapsed.value = w < 1024
    if (!isMobile.value) mobileOpen.value = false
  }

  // 在应用挂载时调用一次：初始化并监听窗口尺寸变化
  function initResponsive(): void {
    if (typeof window === 'undefined') return
    handleResize()
    window.addEventListener('resize', handleResize)
  }

  return {
    sidebarMode,
    effectiveMode,
    setSidebarMode,
    isMobile,
    autoCollapsed,
    mobileOpen,
    sidebarCollapsed,
    sidebarWidth,
    toggleMobile,
    closeMobile,
    initResponsive,
    profileOpen,
    openProfile,
    closeProfile,
  }
})

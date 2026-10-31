import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const SIDEBAR_COLLAPSED_KEY = 'hellonote_sidebar_collapsed'

export const useAppStore = defineStore('app', () => {
  // 用户手动折叠偏好（持久化）
  const manualCollapsed = ref<boolean>(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
  // 视口自适应状态：<768 视为移动端（抽屉），768~1024 自动收起为图标栏
  const isMobile = ref<boolean>(false)
  const autoCollapsed = ref<boolean>(false)
  // 移动端抽屉开关（手动）
  const mobileOpen = ref<boolean>(false)

  // 实际折叠态：移动端不折叠（改用抽屉）；其余取「自动 || 手动」
  const sidebarCollapsed = computed(() =>
    isMobile.value ? false : autoCollapsed.value || manualCollapsed.value,
  )

  function toggleCollapsed(): void {
    manualCollapsed.value = !manualCollapsed.value
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, manualCollapsed.value ? '1' : '0')
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
    manualCollapsed,
    isMobile,
    autoCollapsed,
    mobileOpen,
    sidebarCollapsed,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
    initResponsive,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

// 全局 UI 状态：当前仅管理侧边栏（移动端抽屉）开关，
// 后续可加入全局通知、命令面板等跨页面共享状态。
export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(false)

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value
  }
  function closeSidebar(): void {
    sidebarOpen.value = false
  }
  function openSidebar(): void {
    sidebarOpen.value = true
  }

  return { sidebarOpen, toggleSidebar, closeSidebar, openSidebar }
})

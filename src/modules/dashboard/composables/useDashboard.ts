import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../stores/dashboard.store'

// 面板组合式函数：挂载时拉取数据（已有数据则跳过），统一向视图暴露状态与刷新能力。
export function useDashboard() {
  const store = useDashboardStore()
  const { stats, recentNotes, tags, loading, error } = storeToRefs(store)

  onMounted(() => {
    if (recentNotes.value.length === 0) {
      void store.loadDashboard()
    }
  })

  return {
    stats,
    recentNotes,
    tags,
    loading,
    error,
    reload: store.loadDashboard,
  }
}

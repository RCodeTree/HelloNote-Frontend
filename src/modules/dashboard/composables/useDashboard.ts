import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../stores/dashboard.store'

// 面板组合式函数：挂载时拉取数据（已有数据则跳过），统一向视图暴露状态与刷新能力。
export function useDashboard() {
  const store = useDashboardStore()
  const { stats, recentNotes, tags, activity, loading, activityLoading, error } = storeToRefs(store)

  onMounted(() => {
    if (!stats.value) {
      // 首次进入：主数据 + 活跃度
      void store.loadDashboard()
    } else {
      // 再次进入：仅刷新活跃度（今日时长会因心跳持续变化）
      void store.loadActivity()
    }
  })

  return {
    stats,
    recentNotes,
    tags,
    activity,
    loading,
    activityLoading,
    error,
    reload: store.loadDashboard,
    reloadActivity: store.loadActivity,
  }
}

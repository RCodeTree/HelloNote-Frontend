import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as dashboardApi from '../api/dashboard.api'
import type { ActivityRange, DashboardStats, NoteSummary, TagInfo } from '../types/dashboard.types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats | null>(null)
  const recentNotes = ref<NoteSummary[]>([])
  const tags = ref<TagInfo[]>([])
  const activity = ref<ActivityRange | null>(null)
  const loading = ref(false)
  const activityLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadDashboard(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // 右列「最近笔记」为独立滚动区，多取一些（后端 limit 上限 50）
      const [s, notes, tagList] = await Promise.all([
        dashboardApi.fetchDashboardStats(),
        dashboardApi.fetchRecentNotes(20),
        dashboardApi.fetchTags(),
      ])
      stats.value = s
      recentNotes.value = notes
      tags.value = tagList
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
    // 活跃度独立加载，失败不影响原有面板
    void loadActivity()
  }

  /** 单独加载活跃度（心跳上报后可由页面调用以刷新今日时长）。 */
  async function loadActivity(): Promise<void> {
    activityLoading.value = true
    try {
      activity.value = await dashboardApi.fetchActivityRange()
    } catch {
      // 活跃度是增强数据：加载失败时保留旧值，不打断原有功能
    } finally {
      activityLoading.value = false
    }
  }

  return {
    stats,
    recentNotes,
    tags,
    activity,
    loading,
    activityLoading,
    error,
    loadDashboard,
    loadActivity,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as dashboardApi from '../api/dashboard.api'
import type { DashboardStats, NoteSummary, TagInfo } from '../types/dashboard.types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats | null>(null)
  const recentNotes = ref<NoteSummary[]>([])
  const tags = ref<TagInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadDashboard(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const [s, notes, tagList] = await Promise.all([
        dashboardApi.fetchDashboardStats(),
        dashboardApi.fetchRecentNotes(6),
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
  }

  return { stats, recentNotes, tags, loading, error, loadDashboard }
})

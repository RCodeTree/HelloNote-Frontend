import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as notificationsApi from '../api/notifications.api'
import type { Notification } from '../types/notifications.types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasUnread = computed(() => unreadCount.value > 0)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const [list, count] = await Promise.all([
        notificationsApi.fetchNotifications(),
        notificationsApi.fetchUnreadCount(),
      ])
      notifications.value = list
      unreadCount.value = count
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '加载通知失败'
    } finally {
      loading.value = false
    }
  }

  async function refreshCount(): Promise<void> {
    try {
      unreadCount.value = await notificationsApi.fetchUnreadCount()
    } catch {
      // 静默：计数失败不影响页面
    }
  }

  async function markRead(id: number): Promise<boolean> {
    try {
      const ok = await notificationsApi.markNotificationRead(id)
      if (!ok) return false
      notifications.value = notifications.value.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      await refreshCount()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '操作失败'
      return false
    }
  }

  async function markAllRead(): Promise<boolean> {
    try {
      const ok = await notificationsApi.markAllNotificationsRead()
      if (!ok) return false
      notifications.value = notifications.value.map((n) => ({ ...n, isRead: true }))
      unreadCount.value = 0
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '操作失败'
      return false
    }
  }

  /** 全局轮询写入基线/增量数据，不触发页面 loading */
  function applyPoll(list: Notification[], count: number): void {
    notifications.value = list
    unreadCount.value = count
  }

  return {
    notifications,
    unreadCount,
    hasUnread,
    loading,
    error,
    load,
    refreshCount,
    markRead,
    markAllRead,
    applyPoll,
  }
})

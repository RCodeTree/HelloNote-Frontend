import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as friendsApi from '../api/friends.api'
import type { Friend, FriendBrief } from '../types/friends.types'

export const useFriendsStore = defineStore('friends', () => {
  const friends = ref<Friend[]>([])
  const requests = ref<Friend[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 申请记录：isRequester 为 true 是发出的，false 是收到的。
  const outgoing = computed(() => requests.value.filter((r) => r.isRequester))
  const incoming = computed(() => requests.value.filter((r) => !r.isRequester))

  async function init(): Promise<void> {
    await Promise.all([loadFriends(), loadRequests()])
  }

  async function loadFriends(): Promise<void> {
    loading.value = true
    try {
      friends.value = await friendsApi.fetchFriends()
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '加载笔友失败'
    } finally {
      loading.value = false
    }
  }

  async function loadRequests(): Promise<void> {
    try {
      requests.value = await friendsApi.fetchRequests()
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '加载申请失败'
    }
  }

  async function add(username: string): Promise<boolean> {
    const trimmed = username.trim()
    if (!trimmed) return false
    error.value = null
    try {
      await friendsApi.addFriend(trimmed)
      await loadRequests()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '添加失败'
      return false
    }
  }

  async function accept(friendshipId: number): Promise<boolean> {
    error.value = null
    try {
      await friendsApi.acceptFriend(friendshipId)
      await Promise.all([loadFriends(), loadRequests()])
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '接受失败'
      return false
    }
  }

  async function remove(friendshipId: number): Promise<boolean> {
    error.value = null
    try {
      await friendsApi.removeFriend(friendshipId)
      friends.value = friends.value.filter((f) => f.id !== friendshipId)
      requests.value = requests.value.filter((r) => r.id !== friendshipId)
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '删除失败'
      return false
    }
  }

  async function search(q: string): Promise<FriendBrief[]> {
    const trimmed = q.trim()
    if (!trimmed) return []
    try {
      return await friendsApi.searchFriends(trimmed)
    } catch {
      return []
    }
  }

  return {
    friends,
    requests,
    outgoing,
    incoming,
    loading,
    error,
    init,
    loadFriends,
    loadRequests,
    add,
    accept,
    remove,
    search,
  }
})

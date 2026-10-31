import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '../api/auth.api'
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth.types'

const TOKEN_KEY = 'hellonote_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function persist(t: string): void {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
  }

  async function login(payload: LoginPayload): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.login(payload)
      persist(res.token)
      user.value = res.user
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '登录失败，请稍后重试'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const created = await authApi.register(payload)
      // 注册成功后自动登录
      return await login({ account: created.username, password: payload.password })
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '注册失败，请稍后重试'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(): Promise<void> {
    if (!token.value) return
    try {
      user.value = await authApi.fetchMe()
    } catch {
      logout()
    }
  }

  function logout(): void {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, loading, error, isAuthenticated, login, register, fetchUser, logout }
})

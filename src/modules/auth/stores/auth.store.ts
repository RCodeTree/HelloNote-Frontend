import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '../api/auth.api'
import type { AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from '../types/auth.types'

const TOKEN_KEY = 'hellonote_token'

// 后端字段名 → 中文提示
const FIELD_LABELS: Record<string, string> = {
  username: '用户名',
  display_name: '昵称',
  email: '邮箱',
  password: '密码',
  account: '账号',
}

// 从 Axios 错误中提取可读信息：
// detail 为字符串（业务错误）直接用；为数组（422 校验错误）则转成中文句子。
function toErrorMessage(e: unknown, fallback: string): string {
  const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const parts = detail.map((item) => {
      const { loc, msg } = item as { loc?: unknown[]; msg?: string }
      const field = Array.isArray(loc) && loc.length > 0 ? String(loc[loc.length - 1]) : ''
      const label = FIELD_LABELS[field] ?? field
      if (msg?.includes('Field required')) return `${label}为必填项`
      if (msg?.includes('at least')) return `${label}长度不足`
      if (msg?.includes('at most')) return `${label}长度超限`
      return label ? `${label}格式不正确` : fallback
    })
    return parts.join('；')
  }
  return fallback
}

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
    } catch (e) {
      error.value = toErrorMessage(e, '登录失败，请稍后重试')
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
    } catch (e) {
      error.value = toErrorMessage(e, '注册失败，请稍后重试')
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

  async function updateProfile(payload: UpdateProfilePayload): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      user.value = await authApi.updateMe(payload)
      return true
    } catch (e) {
      error.value = toErrorMessage(e, '保存失败，请稍后重试')
      return false
    } finally {
      loading.value = false
    }
  }

  function logout(): void {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, loading, error, isAuthenticated, login, register, fetchUser, updateProfile, logout }
})

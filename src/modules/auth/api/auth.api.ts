import http from '@/services/http/client'
import type {
  AuthUser,
  LoginPayload,
  RawTokenResponse,
  RawUser,
  RegisterPayload,
} from '../types/auth.types'

function mapUser(raw: RawUser): AuthUser { // 将后端返回的 snake_case 映射为前端 camelCase 领域模型
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.display_name,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    isActive: raw.is_active,
  }
}

// 注意：请求路径基于 Axios baseURL=/api/v1，无需重复前缀
export async function login(payload: LoginPayload): Promise<{ token: string; user: AuthUser }> {
  const { data } = await http.post<RawTokenResponse>('/auth/login', payload)
  return { token: data.access_token, user: mapUser(data.user) }
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await http.post<RawUser>('/auth/register', payload)
  return mapUser(data)
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await http.get<RawUser>('/auth/me')
  return mapUser(data)
}

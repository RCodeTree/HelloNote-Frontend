import http from '@/services/http/client'
import type {
  AuthUser,
  LoginPayload,
  RawTokenResponse,
  RawUser,
  RegisterPayload,
  UpdateProfilePayload,
} from '../types/auth.types'

function mapUser(raw: RawUser): AuthUser { // 将后端返回的 snake_case 映射为前端 camelCase 领域模型
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.display_name,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    bio: raw.bio ?? null,
    isActive: raw.is_active,
  }
}

// 注意：请求路径基于 Axios baseURL=/api/v1，无需重复前缀
export async function login(payload: LoginPayload): Promise<{ token: string; user: AuthUser }> {
  const { data } = await http.post<RawTokenResponse>('/auth/login', payload)
  return { token: data.access_token, user: mapUser(data.user) }
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  // 后端请求体为 snake_case：displayName → display_name
  const { data } = await http.post<RawUser>('/auth/register', {
    username: payload.username,
    display_name: payload.displayName,
    email: payload.email,
    password: payload.password,
  })
  return mapUser(data)
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await http.get<RawUser>('/auth/me')
  return mapUser(data)
}

// 更新当前用户资料（昵称/简介/头像）；avatarUrl 传空字符串表示清除头像
export async function updateMe(payload: UpdateProfilePayload): Promise<AuthUser> {
  const body: Record<string, unknown> = {}
  if (payload.displayName !== undefined) body.display_name = payload.displayName
  if (payload.avatarUrl !== undefined) body.avatar_url = payload.avatarUrl ?? ''
  body.bio = payload.bio ?? ''
  const { data } = await http.patch<RawUser>('/auth/me', body)
  return mapUser(data)
}

// 上传头像文件（multipart/form-data），返回可访问的头像 URL
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<{ url: string }>('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

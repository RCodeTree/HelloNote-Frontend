// 认证领域类型。后端 JSON 使用 snake_case，前端统一使用 camelCase，映射在 api 层完成。

export interface RawUser {
  id: number
  username: string
  display_name: string
  email: string
  avatar_url: string | null
  is_active: boolean
}

export interface RawTokenResponse {
  access_token: string
  token_type: string
  user: RawUser
}

export interface AuthUser {
  id: number
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  isActive: boolean
}

export interface LoginPayload {
  account: string
  password: string
}

export interface RegisterPayload {
  username: string
  displayName: string
  email: string
  password: string
}

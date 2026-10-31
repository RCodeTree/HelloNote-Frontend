import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

// 统一拦截器：请求头注入鉴权 Token，响应层统一处理。
// 注意：业务模块不应各自创建 Axios 实例，统一走 services/http/client.ts。
export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('hellonote_token')
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // 令牌失效：清除本地凭证并跳转登录页（避免死循环：已在登录页则不跳转）
      if (error.response?.status === 401) {
        localStorage.removeItem('hellonote_token')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    },
  )
}

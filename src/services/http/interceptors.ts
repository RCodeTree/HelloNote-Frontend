import type { AxiosInstance, AxiosResponse } from 'axios'

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
    (error) => {
      // 统一错误处理：后续接入后端后在此细化（如 401 跳转登录、全局提示）。
      return Promise.reject(error)
    },
  )
}

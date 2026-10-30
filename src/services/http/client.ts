import axios from 'axios'
import { setupInterceptors } from './interceptors'

// 统一 Axios 实例。baseURL 取自 Vite 环境变量（默认 /api/v1），
// 开发环境由 Vite 代理转发到 FastAPI :8000，避免跨域。
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const httpClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

setupInterceptors(httpClient)

export default httpClient

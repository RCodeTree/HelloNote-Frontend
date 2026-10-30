// 统一的后端响应结构（前后端约定：JSON 字段 snake_case）。
// 后续接入 FastAPI 后，data 承载业务数据，code/message 用于状态判断。
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

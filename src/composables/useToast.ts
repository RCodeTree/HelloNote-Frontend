import { reactive } from 'vue'

export interface FriendMessagePayload {
  avatar?: string | null
  name?: string
  content: string
  link?: string
}

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  /** 富内容形态：action=好友消息，system=系统通知；缺省为普通提示 */
  kind?: 'action' | 'system'
  avatar?: string | null
  name?: string
  content?: string
  link?: string
}

// 模块级单例状态：任意组件直接调用 toast.xxx() 即可，无需注入/挂载配合
const state = reactive<{ items: ToastItem[] }>({ items: [] })

let uid = 0
const DURATION = 3500

function push(item: Omit<ToastItem, 'id'>): void {
  const id = ++uid
  state.items.push({ id, ...item })
  // 最多同时保留 4 条，避免堆叠
  if (state.items.length > 4) state.items.shift()
  window.setTimeout(() => dismiss(id), DURATION)
}

function dismiss(id: number): void {
  const index = state.items.findIndex((t) => t.id === id)
  if (index !== -1) state.items.splice(index, 1)
}

export function useToast() {
  return {
    toasts: state.items,
    dismiss,
    success: (message: string) => push({ message, type: 'success' }),
    error: (message: string) => push({ message, type: 'error' }),
    info: (message: string) => push({ message, type: 'info' }),
    /** 好友消息推送：头像 + 昵称 + 内容，点击可跳转会话 */
    friendMessage: ({ avatar = null, name = '', content, link }: FriendMessagePayload) =>
      push({ message: content, type: 'info', kind: 'action', avatar, name, content, link }),
    /** 系统通知推送 */
    systemMessage: (content: string) => push({ message: content, type: 'info', kind: 'system', content }),
  }
}

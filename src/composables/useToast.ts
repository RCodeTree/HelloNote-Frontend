import { reactive } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

// 模块级单例状态：任意组件直接调用 toast.xxx() 即可，无需注入/挂载配合
const state = reactive<{ items: ToastItem[] }>({ items: [] })

let uid = 0
const DURATION = 3000

function push(message: string, type: ToastItem['type']): void {
  const id = ++uid
  state.items.push({ id, message, type })
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
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
  }
}

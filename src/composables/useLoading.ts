import { ref } from 'vue'

// 通用加载状态组合式函数：包裹异步请求，自动管理 loading 标记。
export function useLoading(initial = false) {
  const loading = ref(initial)

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, withLoading }
}

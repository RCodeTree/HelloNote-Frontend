<script setup lang="ts">
// 全局消息提示（Toast）：挂在 App 根部，任意位置通过 useToast() 触发
import { useToast } from '@/composables/useToast'
import AppIcon from '@/components/common/AppIcon.vue'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast--${t.type}`" role="status">
          <span class="toast__icon">
            <AppIcon :name="t.type === 'error' ? 'close' : 'check'" :size="13" />
          </span>
          <span class="toast__message">{{ t.message }}</span>
          <button class="toast__close" aria-label="关闭提示" @click="dismiss(t.id)">
            <AppIcon name="close" :size="12" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: min(420px, calc(100vw - 32px));
  padding: 10px 12px 10px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
  color: var(--text-primary);
  font-size: 14px;
}
.toast__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  color: #fff;
  background: var(--success, #4cae8f);
}
.toast--error .toast__icon {
  background: var(--danger);
}
.toast--info .toast__icon {
  background: var(--accent-primary);
}
.toast__message {
  line-height: 1.5;
  word-break: break-word;
}
.toast__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.toast__close:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

/* 出入场动画：顶部淡入下滑 */
.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>

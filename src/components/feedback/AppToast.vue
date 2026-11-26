<script setup lang="ts">
// 全局消息提示（Toast）：挂在 App 根部，任意位置通过 useToast() 触发
import { useRouter } from 'vue-router'
import { useToast, type ToastItem } from '@/composables/useToast'
import AppIcon from '@/components/common/AppIcon.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'

const router = useRouter()
const { toasts, dismiss } = useToast()

function onToastClick(toast: ToastItem): void {
  if (toast.kind !== 'action' || !toast.link) return
  void router.push(toast.link)
  dismiss(toast.id)
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="[`toast--${t.kind ?? t.type}`, { 'toast--clickable': t.kind === 'action' && !!t.link }]"
          role="status"
          @click="onToastClick(t)"
        >
          <template v-if="t.kind === 'action'">
            <UserAvatar :name="t.name || '消息'" :url="t.avatar" :size="32" />
            <div class="toast__action">
              <div class="toast__action-top">
                <span class="toast__action-name">{{ t.name || '新消息' }}</span>
                <span class="toast__action-label">{{ t.label || '发来消息' }}</span>
              </div>
              <div class="toast__action-content">{{ t.content }}</div>
            </div>
          </template>
          <template v-else-if="t.kind === 'system'">
            <span class="toast__icon toast__icon--system"><AppIcon name="bell" :size="13" /></span>
            <div class="toast__system">
              <span class="toast__system-label">系统消息</span>
              <span class="toast__system-content">{{ t.content }}</span>
            </div>
          </template>
          <template v-else>
            <span class="toast__icon">
              <AppIcon :name="t.type === 'error' ? 'close' : 'check'" :size="13" />
            </span>
            <span class="toast__message">{{ t.message }}</span>
          </template>
          <button class="toast__close" aria-label="关闭提示" @click.stop="dismiss(t.id)">
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
  max-width: min(360px, calc(100vw - 32px));
  padding: 10px 12px 10px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
  color: var(--text-primary);
  font-size: 14px;
}
.toast--clickable {
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.toast--clickable:hover {
  border-color: var(--accent-primary);
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
.toast__icon--system {
  background: var(--accent-primary);
}
.toast__message {
  line-height: 1.5;
  word-break: break-word;
}
.toast__action,
.toast__system {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  max-width: 260px;
}
.toast__action-top {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.toast__action-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toast__action-label {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
}
.toast__action-content,
.toast__system-content {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toast__system-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-primary);
}
.toast__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: auto;
  flex-shrink: 0;
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

/* 跃动弹出：从正上方落入并回弹 */
.toast-enter-active {
  animation: toast-drop-in 460ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
}
.toast-leave-active {
  transition: opacity 220ms var(--ease-standard), transform 220ms var(--ease-standard);
}
.toast-enter-from {
  opacity: 0;
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
@keyframes toast-drop-in {
  0% {
    opacity: 0;
    transform: translateY(-48px) scale(0.9);
  }
  60% {
    opacity: 1;
    transform: translateY(6px) scale(1.02);
  }
  80% {
    transform: translateY(-3px) scale(0.99);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active {
    animation: none;
  }
  .toast-leave-active {
    transition: none;
  }
}
</style>

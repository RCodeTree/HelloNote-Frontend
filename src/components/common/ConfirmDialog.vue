<script setup lang="ts">
// 通用确认弹窗：替代原生 window.confirm，支持危险操作样式
import { watch } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    /** 第三个按钮（如「不保存离开」）：置于最左，用于提供次级操作 */
    thirdText?: string
    danger?: boolean
  }>(),
  {
    title: '确认操作',
    message: '',
    confirmText: '确认',
    cancelText: '取消',
    thirdText: '',
    danger: false,
  },
)

const emit = defineEmits<{ confirm: []; third: []; cancel: [] }>()

function onKeydown(e: KeyboardEvent): void {
  if (!props.open) return
  if (e.key === 'Escape') emit('cancel')
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="open" class="confirm" role="dialog" aria-modal="true" :aria-label="title">
        <div class="confirm__scrim" @click="emit('cancel')" />
        <div class="confirm__card">
          <div class="confirm__icon" :class="{ 'is-danger': danger }">
            <AppIcon name="trash" :size="18" />
          </div>
          <h3 class="confirm__title">{{ title }}</h3>
          <p v-if="message" class="confirm__message">{{ message }}</p>
          <div class="confirm__actions">
            <BaseButton v-if="thirdText" variant="ghost" size="sm" @click="emit('third')">
              {{ thirdText }}
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="emit('cancel')">{{ cancelText }}</BaseButton>
            <BaseButton :variant="danger ? 'danger' : 'primary'" size="sm" @click="emit('confirm')">
              {{ confirmText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.confirm__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}
.confirm__card {
  position: relative;
  width: min(360px, 100%);
  padding: var(--space-6);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.confirm__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-bottom: var(--space-3);
  color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
}
.confirm__icon.is-danger {
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
}
.confirm__title {
  margin: 0 0 var(--space-2);
  font-size: 16px;
  color: var(--text-primary);
}
.confirm__message {
  margin: 0 0 var(--space-5);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.confirm__actions {
  display: flex;
  gap: var(--space-2);
  width: 100%;
}
.confirm__actions > :deep(*) {
  flex: 1;
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.confirm-fade-enter-active .confirm__card,
.confirm-fade-leave-active .confirm__card {
  transition: transform var(--duration-fast) var(--ease-standard);
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
.confirm-fade-enter-from .confirm__card,
.confirm-fade-leave-to .confirm__card {
  transform: scale(0.96) translateY(6px);
}
</style>

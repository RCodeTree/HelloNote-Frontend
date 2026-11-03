<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import BaseButton from './BaseButton.vue'

withDefaults(
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

// 点击遮罩 / 按 Esc 关闭
const cardRef = ref<HTMLElement | null>(null)
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('cancel')
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  cardRef.value?.focus()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="confirm">
      <div class="confirm__scrim" @click="emit('cancel')" />
      <div ref="cardRef" class="confirm__card" role="alertdialog" aria-modal="true" tabindex="-1">
        <div v-if="danger" class="confirm__icon is-danger">
          <AppIcon name="trash" :size="18" />
        </div>
        <h2 class="confirm__title">{{ title }}</h2>
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
  </Teleport>
</template>

<style scoped>
.confirm {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: modal-fade var(--duration-fast) var(--ease-standard);
}
@keyframes modal-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.confirm__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.confirm__card {
  position: relative;
  z-index: 1;
  width: min(92vw, 420px);
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--shadow-floating);
  animation: confirm-pop var(--duration-fast) var(--ease-standard);
}
.confirm__card:focus {
  outline: none;
}
@keyframes confirm-pop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.confirm__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: 12px;
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-primary);
}
.confirm__icon.is-danger {
  color: var(--accent-danger);
  background: color-mix(in srgb, var(--accent-danger) 12%, transparent);
}
.confirm__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.confirm__message {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>

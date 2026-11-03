<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
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
</script>

<template>
  <Teleport to="body">
    <TransitionRoot :show="open" as="template">
      <!-- @close 在按下 Esc 或点击面板外区域（遮罩）时触发，统一走取消逻辑 -->
      <Dialog @close="emit('cancel')" class="confirm">
        <TransitionChild
          as="template"
          enter="transition-opacity duration-150 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity duration-150 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="confirm__scrim" />
        </TransitionChild>
        <TransitionChild
          as="template"
          enter="transition duration-150 ease-out"
          enter-from="opacity-0 translate-y-1.5 scale-95"
          enter-to="opacity-100 translate-y-0 scale-100"
          leave="transition duration-150 ease-in"
          leave-from="opacity-100 translate-y-0 scale-100"
          leave-to="opacity-0 translate-y-1.5 scale-95"
        >
          <DialogPanel class="confirm__card">
            <div v-if="danger" class="confirm__icon is-danger">
              <AppIcon name="trash" :size="18" />
            </div>
            <DialogTitle class="confirm__title">{{ title }}</DialogTitle>
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
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </TransitionRoot>
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

<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit'
    disabled?: boolean
    block?: boolean
    loading?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    block: false,
    loading: false,
  },
)

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--block': block },
    ]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="base-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
  white-space: nowrap;
  user-select: none;
}
.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button--sm {
  padding: 6px 12px;
  font-size: 13px;
}
.base-button--md {
  padding: 9px 18px;
  font-size: 14px;
}
.base-button--lg {
  padding: 12px 24px;
  font-size: 16px;
}

.base-button--block {
  width: 100%;
}

.base-button--primary {
  background: var(--text-primary);
  color: var(--bg-primary);
  border-color: var(--text-primary);
}
.base-button--primary:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.base-button--secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-default);
}
.base-button--secondary:hover:not(:disabled) {
  border-color: var(--accent-primary);
}

.base-button--ghost {
  background: transparent;
  color: var(--text-secondary);
}
.base-button--ghost:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.base-button--danger {
  background: var(--danger);
  color: var(--bg-primary);
  border-color: var(--danger);
}
.base-button--danger:hover:not(:disabled) {
  opacity: 0.9;
}

.base-button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: base-button-spin 0.6s linear infinite;
}
@keyframes base-button-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .base-button__spinner {
    animation: none;
  }
}
</style>

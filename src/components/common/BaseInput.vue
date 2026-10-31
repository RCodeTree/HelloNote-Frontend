<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    type?: string
    placeholder?: string
    error?: string | null
    autocomplete?: string
    disabled?: boolean
  }>(),
  {
    type: 'text',
    placeholder: '',
    error: null,
    autocomplete: 'off',
    disabled: false,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="base-input" :class="{ 'has-error': !!error }">
    <label v-if="label" class="base-input__label">{{ label }}</label>
    <input
      class="base-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      @input="onInput"
    />
    <p v-if="error" class="base-input__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.base-input__label {
  font-size: 13px;
  color: var(--text-secondary);
}
.base-input__field {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}
.base-input__field::placeholder {
  color: var(--text-muted);
}
.base-input__field:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 20%, transparent);
}
.base-input__field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.base-input.has-error .base-input__field {
  border-color: var(--danger);
}
.base-input__error {
  font-size: 12px;
  color: var(--danger);
}
</style>

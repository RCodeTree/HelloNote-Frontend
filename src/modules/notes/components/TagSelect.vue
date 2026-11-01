<script setup lang="ts">
import type { Tag } from '../types/notes.types'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{ tags: Tag[]; modelValue: number[] }>()
const emit = defineEmits<{ 'update:modelValue': [number[]] }>()

function toggle(id: number): void {
  const set = new Set(props.modelValue)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  emit('update:modelValue', [...set])
}
</script>

<template>
  <div class="tag-select">
    <button
      v-for="t in tags"
      :key="t.id"
      type="button"
      class="tag-select__item"
      :class="{ 'is-active': modelValue.includes(t.id) }"
      @click="toggle(t.id)"
    >
      <BaseTag :label="t.name" :color="t.color" size="sm" />
      <AppIcon v-if="modelValue.includes(t.id)" name="check" :size="13" />
    </button>
    <p v-if="!tags.length" class="tag-select__empty">暂无可用标签</p>
  </div>
</template>

<style scoped>
.tag-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-select__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.tag-select__item.is-active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.tag-select__empty {
  font-size: 13px;
  color: var(--text-muted);
}
</style>

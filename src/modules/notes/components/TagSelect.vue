<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { Tag } from '../types/notes.types'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{
  tags: Tag[]
  modelValue: number[]
  /** 内联新建标签：传入创建函数（如 store.addTag），失败返回 null */
  createTag?: (name: string) => Promise<Tag | null>
}>()
const emit = defineEmits<{ 'update:modelValue': [number[]] }>()

function toggle(id: number): void {
  const set = new Set(props.modelValue)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  emit('update:modelValue', [...set])
}

// 内联新建
const creating = ref(false)
const newName = ref('')
const creatingError = ref('')
const submitting = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

async function startCreate(): Promise<void> {
  creating.value = true
  creatingError.value = ''
  await nextTick()
  inputEl.value?.focus()
}

async function confirmCreate(): Promise<void> {
  // 输入框在成功/取消后被移出 DOM，移除动作会触发一次 blur；
  // 此二次进入必须忽略，否则会把成功后的状态误判为“请输入标签名”。
  if (!creating.value || submitting.value) return
  const name = newName.value.trim()
  if (!name) {
    creatingError.value = '请输入标签名'
    return
  }
  if (props.tags.some((t) => t.name === name)) {
    creatingError.value = '标签已存在，直接勾选即可'
    return
  }
  if (!props.createTag) {
    creating.value = false
    return
  }
  submitting.value = true
  const tag = await props.createTag(name)
  submitting.value = false
  if (!tag) {
    creatingError.value = '创建失败，请重试'
    return
  }
  emit('update:modelValue', [...new Set([...props.modelValue, tag.id])])
  newName.value = ''
  creating.value = false
  creatingError.value = ''
}

function cancelCreate(): void {
  creating.value = false
  newName.value = ''
  creatingError.value = ''
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

    <template v-if="creating">
      <input
        ref="inputEl"
        v-model="newName"
        class="tag-select__input"
        type="text"
        maxlength="50"
        placeholder="标签名，回车确认"
        @input="creatingError = ''"
        @keyup.enter="confirmCreate"
        @keyup.esc="cancelCreate"
        @blur="confirmCreate"
      />
    </template>
    <button v-else type="button" class="tag-select__add" @click="startCreate">
      <AppIcon name="plus" :size="13" />
      新建标签
    </button>

    <p v-if="creatingError" class="tag-select__error">{{ creatingError }}</p>
    <p v-else-if="!tags.length && !creating" class="tag-select__empty">暂无标签，点击「新建标签」创建第一个</p>
  </div>
</template>

<style scoped>
.tag-select {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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
.tag-select__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-default);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.tag-select__add:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.tag-select__input {
  width: 150px;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}
.tag-select__error {
  width: 100%;
  font-size: 12px;
  color: var(--danger);
}
.tag-select__empty {
  font-size: 13px;
  color: var(--text-muted);
}
</style>

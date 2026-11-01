<script setup lang="ts">
// 富文本工具栏：Markdown 语法快捷插入 + 编辑/预览切换
// mousedown.prevent 防止点击按钮时 textarea 失焦丢失选区
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'

export type ToolCommand =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'h1'
  | 'h2'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'code'
  | 'link'
  | 'hr'
  | 'preview'

interface ToolItem {
  cmd: ToolCommand
  title: string
  icon?: IconName
  text?: string
}

defineProps<{ previewing?: boolean }>()
const emit = defineEmits<{ command: [cmd: ToolCommand] }>()

const tools: ToolItem[] = [
  { cmd: 'h1', title: '一级标题', text: 'H1' },
  { cmd: 'h2', title: '二级标题', text: 'H2' },
  { cmd: 'bold', title: '加粗', icon: 'bold' },
  { cmd: 'italic', title: '斜体', icon: 'italic' },
  { cmd: 'strike', title: '删除线', icon: 'strike' },
  { cmd: 'ul', title: '无序列表', icon: 'list' },
  { cmd: 'ol', title: '有序列表', text: '1.' },
  { cmd: 'quote', title: '引用', text: '❝' },
  { cmd: 'code', title: '代码', icon: 'code' },
  { cmd: 'link', title: '链接', icon: 'link' },
  { cmd: 'hr', title: '分隔线', text: '—' },
]
</script>

<template>
  <div class="toolbar" role="toolbar" aria-label="格式工具栏">
    <button
      v-for="t in tools"
      :key="t.cmd"
      type="button"
      class="toolbar__btn"
      :title="t.title"
      :aria-label="t.title"
      @mousedown.prevent
      @click="emit('command', t.cmd)"
    >
      <AppIcon v-if="t.icon" :name="t.icon" :size="15" />
      <span v-else class="toolbar__text">{{ t.text }}</span>
    </button>

    <span class="toolbar__spacer" />

    <button
      type="button"
      class="toolbar__btn toolbar__btn--preview"
      :class="{ 'is-active': previewing }"
      :title="previewing ? '返回编辑' : '预览效果'"
      @mousedown.prevent
      @click="emit('command', 'preview')"
    >
      <AppIcon name="eye" :size="15" />
      <span>{{ previewing ? '编辑' : '预览' }}</span>
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  overflow-x: auto;
  scrollbar-width: none;
}
.toolbar::-webkit-scrollbar {
  display: none;
}
.toolbar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-standard);
}
.toolbar__btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}
.toolbar__btn.is-active {
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  color: var(--accent-primary);
}
.toolbar__text {
  line-height: 1;
}
.toolbar__spacer {
  flex: 1;
  min-width: 4px;
}
.toolbar__btn--preview {
  color: var(--accent-primary);
}
</style>

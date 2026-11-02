<script setup lang="ts">
// 富文本工具栏：格式切换（Markdown / 纯文本）+ Markdown 快捷插入 + 编辑/预览切换。
// 纯文本格式不解析 Markdown：全部语法按钮与预览入口禁用（置灰）。
// mousedown.prevent 防止点击按钮时 textarea 失焦丢失选区
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import type { NoteFormat } from '../types/notes.types'

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

defineProps<{
  previewing?: boolean
  /** 当前笔记内容格式，text 时禁用全部 Markdown 能力 */
  format?: NoteFormat
}>()
const emit = defineEmits<{ command: [cmd: ToolCommand]; changeFormat: [format: NoteFormat] }>()

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
    <!-- 格式切换：区分 Markdown（可解析/可预览）与纯文本 -->
    <div class="toolbar__format" role="radiogroup" aria-label="内容格式">
      <button
        type="button"
        class="toolbar__fmt"
        :class="{ 'is-active': (format ?? 'markdown') === 'markdown' }"
        title="Markdown 格式：支持语法解析与预览"
        @mousedown.prevent
        @click="emit('changeFormat', 'markdown')"
      >
        MD
      </button>
      <button
        type="button"
        class="toolbar__fmt"
        :class="{ 'is-active': format === 'text' }"
        title="纯文本格式：不解析语法，不可预览"
        @mousedown.prevent
        @click="emit('changeFormat', 'text')"
      >
        TXT
      </button>
    </div>

    <span class="toolbar__divider" />

    <template v-for="t in tools" :key="t.cmd">
      <button
        type="button"
        class="toolbar__btn"
        :class="{ 'is-disabled': format === 'text' }"
        :title="format === 'text' ? '纯文本格式不支持 Markdown 语法' : t.title"
        :disabled="format === 'text'"
        :aria-label="t.title"
        @mousedown.prevent
        @click="emit('command', t.cmd)"
      >
        <AppIcon v-if="t.icon" :name="t.icon" :size="15" />
        <span v-else class="toolbar__text">{{ t.text }}</span>
      </button>
    </template>

    <span class="toolbar__spacer" />

    <!-- 预览仅对需要解析的格式可用（Markdown）；纯文本所写即所见 -->
    <button
      type="button"
      class="toolbar__btn toolbar__btn--preview"
      :class="{ 'is-active': previewing, 'is-disabled': format === 'text' }"
      :disabled="format === 'text'"
      :title="
        format === 'text'
          ? '纯文本格式无需预览'
          : previewing
            ? '返回编辑'
            : '预览效果'
      "
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
/* 格式切换器（MD / TXT）：复古分段控件，与工具按钮同一视觉语言 */
.toolbar__format {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  flex-shrink: 0;
}
.toolbar__fmt {
  padding: 3px 8px;
  border: none;
  border-radius: calc(var(--radius-sm) - 2px);
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.toolbar__fmt:hover {
  color: var(--text-primary);
}
.toolbar__fmt.is-active {
  background: var(--bg-secondary);
  color: var(--accent-primary);
}
.toolbar__divider {
  width: 1px;
  height: 18px;
  background: var(--border-default);
  margin: 0 4px;
  flex-shrink: 0;
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
.toolbar__btn:disabled {
  cursor: not-allowed;
}
/* 禁用态（纯文本格式）：降低透明度并保留位置，不参与 hover 变色 */
.toolbar__btn.is-disabled {
  opacity: 0.35;
}
.toolbar__btn.is-disabled:hover {
  background: transparent;
  color: var(--text-secondary);
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

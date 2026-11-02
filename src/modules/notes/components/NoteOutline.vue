<script setup lang="ts">
// 笔记大纲：展示 Markdown 标题层级节点，悬浮预览该节内容摘要，点击通知父级定位滚动。
// 仅展示与交互，滚动定位与测量由页面（NotesEditorPage）负责。
import type { NoteOutlineNode } from '../types/notes.types'

defineProps<{
  nodes: NoteOutlineNode[]
  activeId: string | null
}>()
const emit = defineEmits<{ jump: [id: string] }>()
</script>

<template>
  <nav v-if="nodes.length" class="outline" aria-label="笔记大纲">
    <p class="outline__label">大纲</p>
    <ul class="outline__list">
      <li
        v-for="node in nodes"
        :key="node.id"
        class="outline__item"
        :class="[`outline__item--lv${node.level}`, { 'is-active': node.id === activeId }]"
      >
        <!-- 悬浮预览卡：标题 + 该节内容摘要 -->
        <div v-if="node.snippet" class="outline__preview" role="tooltip">
          <span class="outline__preview-title">{{ node.text }}</span>
          <span class="outline__preview-snippet">{{ node.snippet }}</span>
        </div>
        <button
          type="button"
          class="outline__dot"
          :title="node.text"
          :aria-label="`跳转到：${node.text}`"
          @click="emit('jump', node.id)"
        />
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* 右侧大纲：垂直居中悬浮，仅占极窄空间，不遮挡正文 */
.outline {
  position: absolute;
  right: clamp(8px, 1.5vw, 24px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 15;
  max-height: 72vh;
  overflow-y: auto;
  padding: var(--space-2);
  scrollbar-width: none;
}
.outline::-webkit-scrollbar {
  display: none;
}
.outline__label {
  margin: 0 0 6px;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-align: center;
  user-select: none;
}
.outline__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.outline__item {
  position: relative;
  display: flex;
  justify-content: center;
}
/* 节点：短横线样式，二级以下更短更淡，当前节以主色加长高亮（对应参考图） */
.outline__dot {
  width: 16px;
  height: 3px;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: var(--border-default);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.outline__item--lv1 .outline__dot {
  width: 20px;
}
.outline__item--lv3 .outline__dot,
.outline__item--lv4 .outline__dot,
.outline__item--lv5 .outline__dot,
.outline__item--lv6 .outline__dot {
  width: 10px;
}
.outline__dot:hover {
  background: var(--text-muted);
}
.outline__item.is-active .outline__dot {
  width: 22px;
  background: var(--accent-primary);
}
/* 悬浮预览卡：玻璃浮层，出现在节点左侧 */
.outline__preview {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%) translateX(4px);
  width: 220px;
  max-height: 220px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: var(--shadow-floating);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all var(--duration-fast) var(--ease-standard);
}
.outline__item:hover .outline__preview {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}
.outline__preview-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.outline__preview-snippet {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
/* 平板及以下收起大纲，避免与正文争抢空间 */
@media (max-width: 1024px) {
  .outline {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .outline__dot,
  .outline__preview {
    transition: none;
  }
}
</style>

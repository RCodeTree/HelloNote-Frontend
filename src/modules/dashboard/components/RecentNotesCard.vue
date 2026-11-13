<script setup lang="ts">
import type { NoteSummary } from '../types/dashboard.types'
import NoteCardItem from './NoteCardItem.vue'
import SkeletonCard from '@/components/feedback/SkeletonCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'

defineProps<{
  notes: NoteSummary[]
  loading: boolean
}>()
</script>

<template>
  <section class="panel">
    <header class="panel__head">
      <h2 class="panel__title">最近笔记</h2>
      <span class="panel__count font-mono">{{ loading ? '—' : notes.length }}</span>
    </header>

    <!-- 独立滚动区域：笔记较多时仅此列表滚动，不影响页面其它区域 -->
    <div v-if="loading" class="panel__list is-scroll">
      <SkeletonCard v-for="i in 3" :key="i" :lines="2" />
    </div>
    <div v-else-if="notes.length" class="panel__list is-scroll">
      <NoteCardItem v-for="n in notes" :key="n.id" :note="n" />
    </div>
    <EmptyState v-else title="还没有笔记" description="开始写下你的第一篇吧。" />
  </section>
</template>

<style scoped>
.panel {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  flex-shrink: 0;
}
.panel__title {
  font-size: 18px;
}
.panel__count {
  font-size: 14px;
  color: var(--text-muted);
}
.panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
}
/* 独立滚动：固定最大高度，内容溢出时仅此列表内部滚动 */
.panel__list.is-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding-right: 6px;
  scrollbar-width: thin;
}
.panel__list.is-scroll::-webkit-scrollbar {
  width: 6px;
}
.panel__list.is-scroll::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: var(--radius-full);
}
</style>

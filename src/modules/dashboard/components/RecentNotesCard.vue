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

    <div v-if="loading" class="panel__list">
      <SkeletonCard v-for="i in 3" :key="i" :lines="2" />
    </div>
    <div v-else-if="notes.length" class="panel__list">
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
  gap: var(--space-5);
}
.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}
.panel__title {
  font-size: 18px;
}
.panel__count {
  font-size: 14px;
  color: var(--text-muted);
}
.panel__list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
@media (max-width: 560px) {
  .panel__list {
    grid-template-columns: 1fr;
  }
}
</style>

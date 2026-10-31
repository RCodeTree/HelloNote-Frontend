<script setup lang="ts">
import type { TagInfo } from '../types/dashboard.types'
import BaseTag from '@/components/common/BaseTag.vue'
import AppSkeleton from '@/components/feedback/AppSkeleton.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'

defineProps<{
  tags: TagInfo[]
  loading: boolean
}>()
</script>

<template>
  <section class="panel">
    <header class="panel__head">
      <h2 class="panel__title">标签</h2>
      <span class="panel__count font-mono">{{ loading ? '—' : tags.length }}</span>
    </header>

    <div v-if="loading" class="tag-cloud">
      <AppSkeleton v-for="i in 5" :key="i" width="68px" height="26px" :rounded="true" />
    </div>
    <div v-else-if="tags.length" class="tag-cloud">
      <BaseTag v-for="t in tags" :key="t.id" :label="t.name" :color="t.color" />
    </div>
    <EmptyState v-else title="暂无标签" />
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
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}
</style>

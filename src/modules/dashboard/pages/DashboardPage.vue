<script setup lang="ts">
import { useDashboard } from '../composables/useDashboard'
import type { IconName } from '@/components/common/AppIcon.vue'
import StatCard from '../components/StatCard.vue'
import RecentNotesCard from '../components/RecentNotesCard.vue'
import TagListCard from '../components/TagListCard.vue'
import SkeletonStatCard from '@/components/feedback/SkeletonStatCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const { stats, recentNotes, tags, loading, reload } = useDashboard()

interface StatConfig {
  key: string
  label: string
  icon: IconName
  hint: string
  getValue: () => number
}

const statCards: StatConfig[] = [
  { key: 'notes', label: '笔记总数', icon: 'note', hint: '篇', getValue: () => stats.value?.totalNotes ?? 0 },
  { key: 'pinned', label: '置顶笔记', icon: 'pin', hint: '篇', getValue: () => stats.value?.pinnedNotes ?? 0 },
  { key: 'tags', label: '标签数量', icon: 'tag', hint: '个', getValue: () => stats.value?.totalTags ?? 0 },
  { key: 'words', label: '累计字数', icon: 'sparkles', hint: '字', getValue: () => stats.value?.wordsWritten ?? 0 },
]
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-page__head">
      <div>
        <h1 class="dashboard-page__title">面板</h1>
        <p class="dashboard-page__subtitle">你的知识空间总览</p>
      </div>
      <button class="dashboard-page__refresh" :disabled="loading" @click="reload()">
        <AppIcon name="refresh" :size="16" :class="{ 'is-spin': loading }" />
        刷新
      </button>
    </header>

    <section class="stat-grid">
      <template v-if="loading">
        <SkeletonStatCard v-for="i in 4" :key="i" />
      </template>
      <template v-else>
        <StatCard
          v-for="s in statCards"
          :key="s.key"
          :label="s.label"
          :icon="s.icon"
          :value="s.getValue()"
          :hint="s.hint"
        />
      </template>
    </section>

    <div class="dashboard-page__grid">
      <RecentNotesCard :notes="recentNotes" :loading="loading" />
      <TagListCard :tags="tags" :loading="loading" />
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
.dashboard-page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}
.dashboard-page__title {
  font-size: 30px;
}
.dashboard-page__subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 4px;
}
.dashboard-page__refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.dashboard-page__refresh:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}
.dashboard-page__refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.dashboard-page__refresh .is-spin {
  animation: hn-spin 0.8s linear infinite;
}
@keyframes hn-spin {
  to {
    transform: rotate(360deg);
  }
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.dashboard-page__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
  align-items: start;
}

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-page__grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>

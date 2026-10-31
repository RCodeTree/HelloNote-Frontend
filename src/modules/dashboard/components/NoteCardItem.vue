<script setup lang="ts">
import { computed } from 'vue'
import type { NoteSummary } from '@/modules/dashboard/types/dashboard.types'
import BaseTag from '@/components/common/BaseTag.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{ note: NoteSummary }>()

function formatDate(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const dateLabel = computed(() => formatDate(props.note.updatedAt))
</script>

<template>
  <article class="note-card">
    <div class="note-card__top">
      <h3 class="note-card__title">{{ note.title }}</h3>
      <AppIcon v-if="note.isPinned" name="pin" :size="15" class="note-card__pin" />
    </div>
    <p class="note-card__excerpt">{{ note.excerpt }}</p>
    <div class="note-card__foot">
      <div class="note-card__tags">
        <BaseTag
          v-for="t in note.tags"
          :key="t.id"
          :label="t.name"
          :color="t.color"
          size="sm"
        />
      </div>
      <span class="note-card__date font-mono">{{ dateLabel }}</span>
    </div>
  </article>
</template>

<style scoped>
.note-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.note-card:hover {
  border-color: var(--accent-primary);
}
.note-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.note-card__title {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.note-card__pin {
  color: var(--accent-primary);
  flex-shrink: 0;
}
.note-card__excerpt {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.note-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.note-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.note-card__date {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>

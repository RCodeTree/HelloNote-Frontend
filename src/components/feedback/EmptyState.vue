<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  { title: '暂无内容', description: '' },
)
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon"><AppIcon name="note" :size="26" /></div>
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-10) var(--space-4);
  text-align: center;
  color: var(--text-muted);
}
.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}
.empty-state__title {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-secondary);
}
.empty-state__desc {
  font-size: 13px;
  max-width: 280px;
}
</style>

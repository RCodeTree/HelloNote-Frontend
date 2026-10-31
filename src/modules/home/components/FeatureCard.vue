<script setup lang="ts">
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'

defineProps<{
  icon: IconName
  title: string
  desc: string
}>()
</script>

<template>
  <article class="feature-card">
    <div class="feature-card__icon"><AppIcon :name="icon" :size="22" /></div>
    <h3 class="feature-card__title">{{ title }}</h3>
    <p class="feature-card__desc">{{ desc }}</p>
  </article>
</template>

<style scoped>
.feature-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition:
    transform var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}
.feature-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent-primary);
}
.feature-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--accent-primary);
}
.feature-card__title {
  font-size: 17px;
}
.feature-card__desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>

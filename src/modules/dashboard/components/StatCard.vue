<script setup lang="ts">
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon: IconName
    hint?: string
  }>(),
  { hint: '' },
)
</script>

<template>
  <div class="stat-card">
    <div class="stat-card__icon"><AppIcon :name="icon" :size="20" /></div>
    <div class="stat-card__body">
      <p class="stat-card__label">{{ label }}</p>
      <p class="stat-card__value font-mono">
        {{ value }}<span v-if="hint" class="stat-card__hint">{{ hint }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--accent-primary);
  flex-shrink: 0;
}
.stat-card__label {
  font-size: 13px;
  color: var(--text-muted);
}
.stat-card__value {
  font-size: 26px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.stat-card__hint {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-muted);
  font-family: var(--font-body);
}
</style>

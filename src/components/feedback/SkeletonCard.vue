<script setup lang="ts">
import AppSkeleton from './AppSkeleton.vue'

withDefaults(defineProps<{ lines?: number }>(), { lines: 3 })
</script>

<template>
  <div class="skeleton-card">
    <div class="skeleton-card__head">
      <AppSkeleton width="40px" height="40px" :rounded="true" />
      <div class="skeleton-card__titles">
        <AppSkeleton width="50%" height="0.9rem" />
        <AppSkeleton width="30%" height="0.7rem" />
      </div>
    </div>
    <div class="skeleton-card__body">
      <AppSkeleton
        v-for="i in lines"
        :key="i"
        height="0.8rem"
        :width="i === lines ? '70%' : '100%'"
      />
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.skeleton-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.skeleton-card__titles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.skeleton-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>

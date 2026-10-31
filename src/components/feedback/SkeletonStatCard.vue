<script setup lang="ts">
import AppSkeleton from './AppSkeleton.vue'
</script>

<template>
  <div class="skeleton-stat">
    <AppSkeleton width="30px" height="30px" :rounded="true" />
    <AppSkeleton width="45%" height="0.75rem" />
    <AppSkeleton width="60%" height="1.8rem" />
  </div>
</template>

<style scoped>
.skeleton-stat {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>

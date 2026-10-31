<script setup lang="ts">
import AppSkeleton from './AppSkeleton.vue'

withDefaults(
  defineProps<{
    lines?: number
    lastWidth?: string
  }>(),
  { lines: 3, lastWidth: '60%' },
)
</script>

<template>
  <div class="skeleton-text">
    <AppSkeleton
      v-for="i in lines"
      :key="i"
      height="0.8rem"
      :width="i === lines ? lastWidth : '100%'"
    />
  </div>
</template>

<style scoped>
.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>

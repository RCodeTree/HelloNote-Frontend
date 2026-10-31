<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
    rounded?: boolean
  }>(),
  { width: '100%', height: '1rem', radius: 'var(--radius-sm)', rounded: false },
)
</script>

<template>
  <span
    class="skeleton"
    :class="{ 'skeleton--round': rounded }"
    :style="{
      width,
      height,
      borderRadius: rounded ? '9999px' : radius,
    }"
  />
</template>

<style scoped>
.skeleton {
  display: block;
}
.skeleton--round {
  border-radius: 9999px;
}
</style>

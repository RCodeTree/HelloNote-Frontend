<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    color?: string | null
    size?: 'sm' | 'md'
  }>(),
  {
    color: null,
    size: 'md',
  },
)
</script>

<template>
  <span
    class="base-tag"
    :class="[`base-tag--${size}`]"
    :style="color ? { '--tag-color': color } : undefined"
  >
    <span v-if="color" class="base-tag__dot" />
    {{ label }}
  </span>
</template>

<style scoped>
.base-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-family: var(--font-body);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
.base-tag--sm {
  padding: 2px 8px;
  font-size: 11px;
}
.base-tag__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tag-color, var(--accent-primary));
}
/* 选中/着色标签：用 color-mix 在主题变量基础上生成柔和底色 */
.base-tag:has(.base-tag__dot) {
  background: color-mix(in srgb, var(--tag-color, var(--accent-primary)) 16%, transparent);
  color: var(--tag-color, var(--accent-primary));
  border-color: color-mix(in srgb, var(--tag-color, var(--accent-primary)) 40%, transparent);
}
</style>

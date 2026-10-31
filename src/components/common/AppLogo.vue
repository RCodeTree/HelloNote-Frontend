<script setup lang="ts">
withDefaults(defineProps<{ showText?: boolean }>(), { showText: true })
</script>

<template>
  <span class="app-logo">
    <svg class="app-logo__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="3" width="20" height="26" rx="3" stroke="currentColor" stroke-width="1.8" />
      <path
        d="M11 10h10M11 15h10M11 20h6"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <circle cx="23" cy="23" r="6" fill="var(--accent-primary)" />
      <path d="M23 20.4v5.2M20.4 23h5.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" />
    </svg>
    <span v-if="showText" class="app-logo__text">Hello!Note</span>
  </span>
</template>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}
.app-logo__mark {
  width: 26px;
  height: 26px;
  color: var(--accent-primary);
}
.app-logo__text {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.01em;
}
</style>

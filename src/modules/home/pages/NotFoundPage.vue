<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
</script>

<template>
  <div class="not-found">
    <p class="not-found__code">404</p>
    <h1 class="not-found__title">页面走丢了</h1>
    <p class="not-found__desc">你访问的页面不存在，或已被移动。</p>
    <RouterLink to="/">
      <BaseButton variant="primary">回到首页</BaseButton>
    </RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  text-align: center;
}
.not-found__code {
  font-family: var(--font-mono);
  font-size: 72px;
  color: var(--accent-primary);
  line-height: 1;
}
.not-found__title {
  font-size: 28px;
}
.not-found__desc {
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}
</style>

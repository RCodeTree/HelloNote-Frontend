<script setup lang="ts">
// 顶栏只保留主题切换；登录态/用户信息已移至侧栏底部（SidebarUser）。
import ThemeSwitcher from '@/components/feedback/ThemeSwitcher.vue'
</script>

<template>
  <div class="topbar-actions">
    <ThemeSwitcher />
  </div>
</template>

<style scoped>
.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>

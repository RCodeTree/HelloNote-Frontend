<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import TopbarActions from '@/components/layout/TopbarActions.vue'
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-shell__main">
      <div class="app-shell__topbar">
        <TopbarActions />
      </div>
      <div class="app-shell__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  align-items: stretch;
  min-height: 100vh;
}
.app-shell__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.app-shell__topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-4) var(--space-6) 0;
}
.app-shell__content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-6) var(--space-8);
}
@media (max-width: 640px) {
  .app-shell__topbar {
    padding: var(--space-3) var(--space-4) 0;
    padding-left: 72px; /* 避开移动端浮动菜单按钮 */
  }
  .app-shell__content {
    padding: var(--space-5) var(--space-4) var(--space-6);
  }
}
</style>

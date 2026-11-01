<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import TopbarActions from '@/components/layout/TopbarActions.vue'

const route = useRoute()

// fullBleed 路由（如笔记编辑器）不受内容区最大宽度与内边距限制，
// 由页面自己控制布局，占满侧栏以外的全部区域。
const fullBleed = computed(() => route.meta.fullBleed === true)
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-shell__main">
      <div class="app-shell__topbar">
        <TopbarActions />
      </div>
      <div class="app-shell__content" :class="{ 'app-shell__content--full': fullBleed }">
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
/* 全幅页面：编辑器自己管理布局与滚动 */
.app-shell__content--full {
  max-width: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.app-shell__content--full :deep(> *) {
  flex: 1;
  min-height: 0;
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

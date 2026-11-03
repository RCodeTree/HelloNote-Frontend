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
  <div class="app-shell" :class="{ 'app-shell--full': fullBleed }">
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
  min-height: 0;
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
  min-height: 0;
  overflow: hidden;
}
.app-shell__content--full :deep(> *) {
  flex: 1;
  min-height: 0;
}
/* 全幅编辑器：把布局壳高度锁死到视口，仅由页面内部的中间区滚动。
   若仅用 min-height:100vh，内容变长时整个壳会无限撑高，滚动会落到窗口/textarea
   而非编辑器中间区，header/footer 也随之滚走。 */
.app-shell--full {
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  overflow: hidden;
}
.app-shell--full .app-shell__topbar {
  display: none; /* 编辑器自带顶栏，隐藏空壳顶栏 */
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

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.store'
import AppIcon from '@/components/common/AppIcon.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import TopbarActions from '@/components/layout/TopbarActions.vue'

const route = useRoute()
const app = useAppStore()
const { isMobile, mobileOpen } = storeToRefs(app)

// fullBleed 路由（如笔记编辑器）不受内容区最大宽度与内边距限制，
// 由页面自己控制布局，占满侧栏以外的全部区域。
const fullBleed = computed(() => route.meta.fullBleed === true)
// wide 路由（如三列面板）：保留内边距，仅放宽内容区最大宽度
const wide = computed(() => route.meta.wide === true)
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--full': fullBleed }">
    <AppSidebar />
    <div class="app-shell__main">
      <div class="app-shell__topbar">
        <!-- 小型设备：顶栏左侧汉堡按钮呼出侧栏抽屉（取代原侧边中部悬浮小箭头）。
             抽屉打开时隐藏，由遮罩/导航点击收起；全幅编辑器页 topbar 整体隐藏，
             不会与编辑器自带返回按钮重叠。 -->
        <button
          v-if="isMobile && !mobileOpen"
          type="button"
          class="app-shell__hamburger"
          aria-label="打开菜单"
          :aria-expanded="false"
          @click="app.toggleMobile()"
        >
          <AppIcon name="menu" :size="20" />
        </button>
        <TopbarActions />
      </div>
      <div
        class="app-shell__content"
        :class="{ 'app-shell__content--full': fullBleed, 'app-shell__content--wide': wide }"
      >
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
  justify-content: flex-end; /* 保持原右对齐；汉堡靠 margin-right:auto 推到最左 */
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6) 0;
}
/* 小型设备：顶栏左侧汉堡按钮。margin-right:auto 吸收剩余空间，
   使自身贴左、右侧操作区仍靠右；桌面端不渲染此按钮，topbar 行为不变。 */
.app-shell__hamburger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: auto;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-emphasized);
}
.app-shell__hamburger:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.app-shell__hamburger:active {
  transform: scale(0.92);
}
.app-shell__content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-6) var(--space-8);
}
/* 宽内容区：三列面板需要更多横向空间容纳日历与热力图 */
.app-shell__content--wide {
  max-width: 1600px;
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
  }
  .app-shell__content {
    padding: var(--space-5) var(--space-4) var(--space-6);
  }
}
</style>

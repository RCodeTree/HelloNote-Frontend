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
const { isMobile, mobileOpen, sidebarWidth } = storeToRefs(app)

// fullBleed 路由（如笔记编辑器）不受内容区最大宽度与内边距限制，
// 由页面自己控制布局，占满侧栏以外的全部区域。
const fullBleed = computed(() => route.meta.fullBleed === true)
// wide 路由（如三列面板）：保留内边距，仅放宽内容区最大宽度
const wide = computed(() => route.meta.wide === true)
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--full': fullBleed, 'app-shell--wide': wide }">
    <!-- 侧栏占位：sidebar 全态 fixed（脱离文档流），由它按当前模式占宽，
         宽度带过渡，模式切换时内容区平滑让位而不是瞬间重排。 -->
    <div
      class="app-shell__sb-spacer"
      :style="{ width: `${sidebarWidth}px` }"
      aria-hidden="true"
    />
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
  /* 主内容两侧的呼吸间距：随视口平滑缩放。窄屏贴边、宽屏舒展但封顶，
     不再用固定 max-width 居中在宽屏堆出大片留白。顶栏与内容区共用，
     保证两者左右边缘始终对齐；侧栏 full/rail/hidden 只改变 main 宽度，
     内容区自动跟随可用空间，无需为每个条件写死宽度。 */
  --content-gutter: clamp(var(--space-4), 3.2vw, 80px);
  /* 软上限：仅在超宽屏收边，避免卡片网格 / 日历被无限拉宽；
     常见 1920 全屏不触发，内容按可用空间自动铺满。 */
  --content-max: 2048px;
}
.app-shell--wide {
  /* 三列面板更吃横向空间：间距收紧、软上限放宽以容纳日历与热力图 */
  --content-gutter: clamp(var(--space-4), 2.2vw, 56px);
  --content-max: 2200px;
}
/* 侧栏占位：仅负责占文档流宽度，自身无视觉。宽度过渡与 sidebar 的
   几何过渡同时长，让「悬浮 → 停靠」恢复时内容区平滑退让。 */
.app-shell__sb-spacer {
  flex: 0 0 auto;
  transition: width var(--duration-base) var(--ease-emphasized);
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
  /* 与内容区共用同一 gutter，左右边缘始终对齐 */
  padding: var(--space-4) var(--content-gutter) 0;
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
  /* 流式铺满 main（= 视口 − 侧栏占位），仅用 gutter 控制两侧呼吸间距。
     不再用固定 1200px 居中：那样在侧栏收起 / 宽屏时会堆出大片留白，
     且不同侧栏状态、不同视口下表现割裂。 */
  max-width: var(--content-max); /* 软上限：仅超宽屏收边 */
  margin-inline: auto; /* 超宽屏触发软上限时居中 */
  padding: var(--space-6) var(--content-gutter) var(--space-8);
}
/* 页面类型差异已由 .app-shell--wide 的 --content-max / --content-gutter
   统一表达，内容区无需再写死第二套宽度。full 页覆盖为无间距全幅。 */
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
  /* clamp 在窄屏自动收敛到 16px 下限，无需再写死一套间距；
     顶栏与内容区继续共用同一 gutter 保持对齐。 */
  .app-shell__topbar {
    padding: var(--space-3) var(--content-gutter) 0;
  }
  /* 全幅页（聊天/编辑器）须保持 padding:0，否则两侧留白，header/输入区不铺满 */
  .app-shell__content:not(.app-shell__content--full) {
    padding: var(--space-5) var(--content-gutter) var(--space-6);
  }
}
@media (prefers-reduced-motion: reduce) {
  .app-shell__sb-spacer,
  .app-shell__hamburger {
    transition-duration: 0.01ms !important;
  }
}
</style>

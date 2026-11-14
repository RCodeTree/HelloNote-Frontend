<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore, type SidebarMode } from '@/stores/app.store'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import SidebarUser from '@/components/layout/SidebarUser.vue'

const app = useAppStore()
const route = useRoute()
const router = useRouter()

const { isMobile, mobileOpen, sidebarCollapsed, effectiveMode } = storeToRefs(app)

// 大屏「自动隐藏」模式下的悬浮弹出态：鼠标靠近左缘弹出，离开自动收起
const peeking = ref(false)

interface NavItem {
  to: string
  label: string
  icon: IconName
  active: (path: string) => boolean
}

const navItems: NavItem[] = [
  { to: '/', label: '首页', icon: 'home', active: (p) => p === '/' },
  { to: '/dashboard', label: '面板', icon: 'grid', active: (p) => p === '/dashboard' },
  { to: '/notes', label: '笔记', icon: 'note', active: (p) => p.startsWith('/notes') },
]

/** 当前激活项索引；-1 表示当前页面不属于任何导航项（如登录页），此时隐藏指示器 */
const activeIndex = computed(() => navItems.findIndex((i) => i.active(route.path)))

// 切换侧栏显示模式（full / rail / hidden）
function setMode(mode: SidebarMode): void {
  app.setSidebarMode(mode)
  peeking.value = false
}

// 点击品牌标题：大屏展开为完整侧栏（不再导航首页）；移动端保持「回首页 + 收抽屉」
function onBrandClick(): void {
  if (isMobile.value) {
    app.closeMobile()
    void router.push('/')
    return
  }
  peeking.value = false
  if (effectiveMode.value !== 'full') app.setSidebarMode('full')
}

// 导航项点击：收起移动端抽屉 / 关闭悬浮弹出态
function onNavClick(): void {
  app.closeMobile()
  peeking.value = false
}

/* ===== 激活项滑动指示器 =====
   独立的高亮块根据激活项的位置平滑移动，替代「旧项淡出 + 新项淡入」的硬切。
   用实测 offsetTop/offsetHeight 定位，可自适应折叠(rail)/移动端等导致的高度变化。 */
const navRef = ref<HTMLElement | null>(null)
const indTop = ref(0)
const indHeight = ref(0)
const indVisible = ref(false)
const indAnimated = ref(false) // 首次定位不加过渡，避免指示器从顶部「飞入」
let resizeObserver: ResizeObserver | null = null

function syncIndicator(): void {
  const nav = navRef.value
  if (!nav) return
  const links = nav.querySelectorAll<HTMLElement>('.sidebar__link')
  const el = activeIndex.value >= 0 ? links[activeIndex.value] : undefined
  if (!el) {
    indVisible.value = false
    return
  }
  indTop.value = el.offsetTop
  indHeight.value = el.offsetHeight
  indVisible.value = true
}

// 路由 / 侧栏形态变化后重新测量（等 DOM 更新完成）
watch([activeIndex, sidebarCollapsed, isMobile, effectiveMode, mobileOpen], () => {
  void nextTick(syncIndicator)
})

onMounted(() => {
  void nextTick(() => {
    syncIndicator()
    if (navRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncIndicator())
      resizeObserver.observe(navRef.value)
    }
    // 双帧后再启用过渡：保证首屏是无动画就位，之后切换才有滑动
    requestAnimationFrame(() => requestAnimationFrame(() => (indAnimated.value = true)))
  })
})
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <!-- 大屏「自动隐藏」：贴近左缘的悬浮感应区，鼠标靠近自动弹出侧栏 -->
  <div
    v-if="!isMobile && effectiveMode === 'hidden'"
    class="sidebar-edgezone"
    @mouseenter="peeking = true"
  />

  <!-- 移动端遮罩 -->
  <Transition name="fade">
    <div v-if="isMobile && mobileOpen" class="sidebar-backdrop" @click="app.closeMobile" />
  </Transition>

  <aside
    class="sidebar"
    :class="{
      'sidebar--collapsed': sidebarCollapsed,
      'sidebar--mobile': isMobile,
      'is-open': isMobile && mobileOpen,
      'sidebar--hidden': !isMobile && effectiveMode === 'hidden',
      'is-peek': peeking,
    }"
    @mouseleave="peeking = false"
  >
    <div class="sidebar__top">
      <!-- 品牌标题：大屏点击展开完整侧栏（不再导航首页） -->
      <button
        type="button"
        class="sidebar__brand"
        :title="!isMobile && effectiveMode !== 'full' ? '展开侧边栏' : undefined"
        @click="onBrandClick"
      >
        <AppLogo :show-text="!sidebarCollapsed" />
      </button>
    </div>

    <nav ref="navRef" class="sidebar__nav">
      <!-- 滑动高亮块：在导航项之间平滑移动 -->
      <div
        class="sidebar__indicator"
        :class="{ 'is-visible': indVisible, 'is-animated': indAnimated }"
        :style="{ '--sb-top': `${indTop}px`, '--sb-height': `${indHeight}px` }"
        aria-hidden="true"
      />

      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__link"
        :class="{ 'is-active': item.active(route.path) }"
        :title="sidebarCollapsed ? item.label : undefined"
        @click="onNavClick"
      >
        <span class="sidebar__link-icon"><AppIcon :name="item.icon" :size="20" /></span>
        <span class="sidebar__link-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- 大屏：三种展开状态切换（完整 / 仅图标 / 自动隐藏），图标置于侧栏内 -->
    <div v-if="!isMobile" class="sidebar__modes" role="group" aria-label="侧栏显示模式">
      <button
        type="button"
        class="sidebar__mode"
        :class="{ 'is-active': effectiveMode === 'full' }"
        title="完整侧栏"
        aria-label="完整侧栏"
        @click="setMode('full')"
      >
        <AppIcon name="layout-full" :size="16" />
      </button>
      <button
        type="button"
        class="sidebar__mode"
        :class="{ 'is-active': effectiveMode === 'rail' }"
        title="仅显示图标"
        aria-label="仅显示图标"
        @click="setMode('rail')"
      >
        <AppIcon name="layout-rail" :size="16" />
      </button>
      <button
        type="button"
        class="sidebar__mode"
        :class="{ 'is-active': effectiveMode === 'hidden' }"
        title="自动隐藏（鼠标靠近左缘弹出）"
        aria-label="自动隐藏"
        @click="setMode('hidden')"
      >
        <AppIcon name="layout-hidden" :size="16" />
      </button>
    </div>

    <!-- 侧栏底部：用户登录态 / 资料与退出入口 -->
    <SidebarUser />
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-card);
  border-right: 1px solid var(--border-default);
  /* 不使用 backdrop-filter：背景本就是不透明白/深色，模糊无视觉作用；
     且它与抽屉/hidden 的 transform 过渡叠加会造成合成层撕裂（中间出现竖线硬切）。 */
  transition: width var(--duration-base) var(--ease-standard);
  z-index: 40;
}
/* 真半屏（仅图标） */
.sidebar--collapsed {
  width: 76px;
}
/* 全屏收起（自动隐藏）：脱离文档流，内容区占满；鼠标靠近左缘时滑入弹出。
   悬浮卡片形态：四边离屏幕留白、整圈圆角与浮层阴影，不再贴边直角。
   仅用 transform 位移 + visibility 显隐，不做 opacity 淡入淡出：
   半透明会让背后页面内容透出，在过渡中形成分界；visibility 是离散属性，
   进入 instant 生效、退出在过渡结束时生效，不影响滑入滑出的连贯性。
   收起位移需把「留白 + 卡片宽」一起移出视口，避免圆角/阴影在边缘露出一角。 */
.sidebar--hidden {
  position: fixed;
  top: var(--space-4);
  left: var(--space-4);
  bottom: var(--space-4);
  height: auto; /* 由 top/bottom 撑开，覆盖基础 100vh */
  align-self: auto; /* 清除基础 .sidebar 的 flex-start，否则 fixed 元素按内容收缩，
                       上下留白撑不开（会变成只有 377px 的半截卡片） */
  width: 240px;
  border: 1px solid var(--border-default); /* 整圈边框，悬浮卡片 */
  border-radius: var(--radius-xl);
  transform: translateX(calc(-100% - var(--space-4) - var(--space-4)));
  visibility: hidden;
  transition: transform var(--duration-base) var(--ease-emphasized),
    visibility var(--duration-base) var(--ease-emphasized);
  will-change: transform;
  box-shadow: var(--shadow-floating);
}
.sidebar--hidden.is-peek {
  transform: translateX(0);
  visibility: visible;
}

/* 自动隐藏模式下贴近左缘的悬浮感应区（隐形，占满高度）。
   宽度需覆盖悬浮卡片的左侧留白（16px）再多一点，否则鼠标从卡片移向
   屏幕边缘时会先离开卡片、又没进入感应区，导致「收起→立刻弹出」的抖动。 */
.sidebar-edgezone {
  position: fixed;
  top: 0;
  left: 0;
  width: calc(var(--space-4) + 12px);
  height: 100vh;
  z-index: 40;
}

.sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2);
  min-height: 44px;
}
.sidebar--collapsed .sidebar__top {
  justify-content: center;
}
/* 移动端抽屉：去掉关闭按钮后，品牌标题居中更平衡对称 */
.sidebar--mobile .sidebar__top {
  justify-content: center;
}
/* 品牌标题：按钮化，大屏点击展开完整侧栏 */
.sidebar__brand {
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  color: inherit;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}
.sidebar__brand:hover {
  background: var(--bg-secondary);
}
.sidebar__nav {
  position: relative; /* 滑动指示器的定位参照 */
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-height: 0;
}

/* ===== 激活项滑动指示器 ===== */
.sidebar__indicator {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 0;
  height: var(--sb-height, 0px);
  transform: translateY(var(--sb-top, 0px));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-primary) 8%, transparent);
  opacity: 0;
  pointer-events: none;
  will-change: transform, height;
}
.sidebar__indicator.is-visible {
  opacity: 1;
}
.sidebar__indicator.is-animated {
  transition:
    transform 340ms var(--ease-emphasized),
    height 280ms var(--ease-emphasized),
    opacity var(--duration-base) var(--ease-standard);
}

.sidebar__link {
  position: relative;
  z-index: 1; /* 文字/图标在指示器之上 */
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
  /* 明确列出可过渡属性，避免 `all` 影响到由指示器负责的背景 */
  transition:
    color var(--duration-base) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.sidebar__link:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.sidebar__link.is-active {
  color: var(--accent-primary);
  background: transparent; /* 高亮交给滑动指示器，避免双重背景 */
}
.sidebar__link.is-active:hover {
  background: transparent;
}
.sidebar__link:active {
  transform: scale(0.98); /* 点击轻微回弹反馈 */
}
.sidebar__link-icon {
  display: inline-flex;
  flex-shrink: 0;
  transition: transform 340ms var(--ease-emphasized);
}
.sidebar__link.is-active .sidebar__link-icon {
  transform: scale(1.08);
}
.sidebar__link-label {
  transition: transform 340ms var(--ease-emphasized);
}
.sidebar__link.is-active .sidebar__link-label {
  transform: translateX(2px);
}
.sidebar--collapsed .sidebar__link {
  justify-content: center;
  padding: 10px;
}
.sidebar--collapsed .sidebar__link-label {
  display: none;
}
.sidebar__link--muted {
  color: var(--text-muted);
  cursor: default;
}
.sidebar__link--muted:hover {
  background: transparent;
  color: var(--text-muted);
}

/* 三态模式切换器：完整宽时横排，仅图标时竖排 */
.sidebar__modes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}
.sidebar--collapsed .sidebar__modes {
  flex-direction: column;
  padding: 2px;
}
.sidebar__mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-emphasized);
}
.sidebar__mode:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}
.sidebar__mode.is-active {
  color: var(--accent-primary);
  background: var(--bg-card);
}
.sidebar__mode:active {
  transform: scale(0.92);
}

/* 中小屏：抽屉 + 遮罩（入口为布局壳顶栏左上角的汉堡按钮） */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.4);
}
.sidebar--mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 264px;
  z-index: 65;
  transform: translateX(-100%);
  transition: transform var(--duration-base) var(--ease-standard);
  box-shadow: var(--shadow-floating);
}
.sidebar--mobile.is-open {
  transform: translateX(0);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .sidebar__indicator,
  .sidebar__link,
  .sidebar__link-icon,
  .sidebar__link-label,
  .sidebar__mode {
    transition-duration: 0.01ms !important;
  }
}
</style>

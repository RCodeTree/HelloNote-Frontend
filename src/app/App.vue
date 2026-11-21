<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import AppToast from '@/components/feedback/AppToast.vue'
import { useAppStore } from '@/stores/app.store'
import { useActivityTracker } from '@/modules/dashboard/composables/useActivityTracker'
import { useNotifications } from '@/composables/useNotifications'

const route = useRoute()
const appStore = useAppStore()

// 全局活跃时长心跳：覆盖所有登录态页面（含编辑器），为面板「活动时长」累计数据
useActivityTracker()

// 全局通知轮询：新通知与好友消息以左下角 toast 推送
useNotifications()

const layouts = { default: DefaultLayout, blank: BlankLayout }
const layoutComponent = computed(
  () => layouts[(route.meta.layout as 'default' | 'blank') ?? 'default'] ?? DefaultLayout,
)

// 初始化侧边栏的响应式（多端自适应）行为
appStore.initResponsive()
</script>

<template>
  <component :is="layoutComponent">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </component>
  <AppToast />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-standard);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>

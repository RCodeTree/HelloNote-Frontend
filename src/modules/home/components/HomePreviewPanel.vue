<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import AppSkeleton from '@/components/feedback/AppSkeleton.vue'

// 该组件被 HomePage 以 defineAsyncComponent 懒加载。
// 此处再用内部 loading 状态模拟数据请求，直观演示骨架屏占位。
const loading = ref(true)
const sampleNotes = [
  { title: '关于专注的随想', tag: '灵感', color: '#9A8052' },
  { title: '本周阅读清单', tag: '读书', color: '#754747' },
]

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 900)
})
</script>

<template>
  <div class="preview-panel glass-panel">
    <div class="preview-panel__head">
      <div>
        <h2 class="preview-panel__title">一览你的笔记</h2>
        <p class="preview-panel__sub">玻璃质感下的清晰内容</p>
      </div>
      <span class="preview-panel__badge">
        <AppIcon name="sparkles" :size="14" />
        预览
      </span>
    </div>

    <div v-if="loading" class="preview-panel__list">
      <div v-for="i in 2" :key="i" class="preview-panel__skeleton">
        <AppSkeleton width="60%" height="0.95rem" />
        <AppSkeleton width="90%" height="0.7rem" />
        <AppSkeleton width="40%" height="0.7rem" />
      </div>
    </div>

    <div v-else class="preview-panel__list">
      <div v-for="n in sampleNotes" :key="n.title" class="preview-panel__item">
        <div class="preview-panel__item-head">
          <span class="preview-panel__item-title">{{ n.title }}</span>
          <BaseTag :label="n.tag" :color="n.color" size="sm" />
        </div>
        <p class="preview-panel__item-desc">
          这是一段示例摘要，用于展示面板中笔记卡片的排版与复古玻璃质感。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-panel {
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.preview-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}
.preview-panel__title {
  font-size: 22px;
}
.preview-panel__sub {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 4px;
}
.preview-panel__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  color: var(--accent-primary);
  font-size: 12px;
  font-family: var(--font-mono);
}
.preview-panel__list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
.preview-panel__skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
}
.preview-panel__item {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.preview-panel__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.preview-panel__item-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
}
.preview-panel__item-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .preview-panel__list {
    grid-template-columns: 1fr;
  }
}
</style>

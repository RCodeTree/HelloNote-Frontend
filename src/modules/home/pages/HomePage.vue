<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import HeroSection from './HeroSection.vue'
import FeatureCard from './FeatureCard.vue'
import SkeletonCard from '@/components/feedback/SkeletonCard.vue'
import type { IconName } from '@/components/common/AppIcon.vue'

// 组件级懒加载：HomePreviewPanel 单独打包为 chunk，
// 加载该 chunk 期间以 SkeletonCard 作为骨架屏占位。
const HomePreviewPanel = defineAsyncComponent({
  loader: () => import('./HomePreviewPanel.vue'),
  loadingComponent: SkeletonCard,
  delay: 150,
  timeout: 10000,
})

const features: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'note', title: '随时记录', desc: '用安静的编辑器捕捉每一个念头，支持 Markdown 与标签。' },
  { icon: 'tag', title: '自由分类', desc: '用标签组织笔记，构建属于你自己的知识网络。' },
  { icon: 'search', title: '快速检索', desc: '全文搜索与过滤，瞬间找回需要的片段。' },
  { icon: 'sparkles', title: '智能辅助', desc: '后续接入 AI，帮你总结、提炼与联想。' },
]
</script>

<template>
  <div class="home-page">
    <HeroSection />

    <section class="home-page__section">
      <h2 class="home-page__section-title">为什么是 Hello!Note</h2>
      <div class="home-page__features">
        <FeatureCard
          v-for="f in features"
          :key="f.title"
          :icon="f.icon"
          :title="f.title"
          :desc="f.desc"
        />
      </div>
    </section>

    <section class="home-page__section">
      <HomePreviewPanel />
    </section>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}
.home-page__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.home-page__section-title {
  font-size: 24px;
  text-align: center;
}
.home-page__features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
@media (max-width: 1024px) {
  .home-page__features {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .home-page__features {
    grid-template-columns: 1fr;
  }
  .home-page {
    gap: var(--space-12);
  }
}
</style>

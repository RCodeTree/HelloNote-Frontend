<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
</script>

<template>
  <section class="hero">
    <div class="hero__inner">
      <span class="hero__eyebrow">RETRO · MINIMAL · GLASS</span>
      <h1 class="hero__title">Hello!Note</h1>
      <p class="hero__tagline">一个安静的地方，安放你的想法。</p>
      <p class="hero__desc">复古质感与现代交互交织的笔记空间，让记录回归专注与温度。</p>
      <div class="hero__actions">
        <RouterLink to="/dashboard">
          <BaseButton variant="primary" size="lg">
            进入面板
            <AppIcon name="chevron-down" :size="16" class="hero__cta-icon" />
          </BaseButton>
        </RouterLink>
        <BaseButton variant="secondary" size="lg">了解更多</BaseButton>
      </div>
    </div>

    <div class="hero__glass glass-panel">
      <div class="hero__note">
        <span class="hero__note-line" style="width: 72%"></span>
        <span class="hero__note-line" style="width: 92%"></span>
        <span class="hero__note-line" style="width: 56%"></span>
        <span class="hero__note-line" style="width: 84%"></span>
        <span class="hero__note-line" style="width: 38%"></span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--space-12);
  align-items: center;
  padding: var(--space-12) 0;
}
.hero__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.hero__eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--accent-primary);
}
.hero__title {
  font-size: clamp(44px, 7vw, 76px);
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.hero__tagline {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text-secondary);
}
.hero__desc {
  color: var(--text-muted);
  max-width: 460px;
}
.hero__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
  flex-wrap: wrap;
}
.hero__cta-icon {
  transform: rotate(-90deg);
}
.hero__glass {
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  min-height: 280px;
  display: flex;
  align-items: center;
}
.hero__note {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}
.hero__note-line {
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
}
.hero__note-line:nth-child(odd) {
  background: var(--border-default);
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    gap: var(--space-8);
    padding: var(--space-8) 0;
  }
}
</style>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span>© {{ year }} Hello!Note</span>
      <span class="app-footer__tag">Retro · Minimal · Glass</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--border-default);
  background: var(--bg-primary);
  padding: var(--space-6);
}
.app-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
  max-width: 1200px;
  margin: 0 auto;
}
.app-footer__tag {
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}
</style>

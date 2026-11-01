<template>
  <div class="blank-layout">
    <slot />
  </div>
</template>

<style scoped>
/* 说明：不用 align-items: center——内容高于视口（如注册表单、矮屏）时
   顶部会被裁掉且无法滚动。改用 margin: auto 居中，溢出时可正常滚动。 */
.blank-layout {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: var(--space-6);
  overflow-y: auto;
}
.blank-layout > :deep(*) {
  margin: auto;
}
@media (max-width: 640px) {
  .blank-layout {
    padding: var(--space-4);
  }
}
</style>

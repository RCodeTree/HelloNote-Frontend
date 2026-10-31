<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useAppStore } from '@/stores/app.store'

const appStore = useAppStore()
</script>

<template>
  <div class="app-shell theme-transition">
    <AppHeader />
    <div class="app-shell__body">
      <AppSidebar />
      <div
        v-if="appStore.sidebarOpen"
        class="app-shell__backdrop"
        @click="appStore.closeSidebar()"
      />
      <main class="app-shell__main">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-shell__body {
  flex: 1;
  display: flex;
  align-items: stretch;
  position: relative;
}
.app-shell__main {
  flex: 1;
  min-width: 0;
  padding: var(--space-8) var(--space-6);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.app-shell__backdrop {
  display: none;
}

@media (max-width: 768px) {
  .app-shell__main {
    padding: var(--space-6) var(--space-4);
  }
  .app-shell__backdrop {
    display: block;
    position: fixed;
    inset: var(--header-height) 0 0 0;
    z-index: 45;
    background: rgba(0, 0, 0, 0.35);
  }
}
</style>

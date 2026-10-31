<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppIcon, { type IconName } from '@/components/common/AppIcon.vue'

const { themeStore, options, setMode } = useTheme()
const open = ref(false)

const currentIcon = computed<IconName>(() => {
  if (themeStore.mode === 'system') return 'monitor'
  return themeStore.resolvedTheme === 'dark' ? 'moon' : 'sun'
})

function iconFor(mode: string): IconName {
  if (mode === 'light') return 'sun'
  if (mode === 'dark') return 'moon'
  return 'monitor'
}

function choose(mode: 'light' | 'dark' | 'system'): void {
  setMode(mode)
  open.value = false
}
</script>

<template>
  <div class="theme-switcher">
    <button
      class="theme-switcher__trigger"
      :aria-label="`当前主题：${themeStore.mode}`"
      @click="open = !open"
    >
      <AppIcon :name="currentIcon" :size="18" />
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="theme-switcher__menu glass-floating">
        <p class="theme-switcher__title">外观</p>
        <button
          v-for="opt in options"
          :key="opt.value"
          class="theme-switcher__item"
          :class="{ 'is-active': themeStore.mode === opt.value }"
          @click="choose(opt.value)"
        >
          <AppIcon :name="iconFor(opt.value)" :size="16" />
          <span>{{ opt.label }}</span>
          <AppIcon v-if="themeStore.mode === opt.value" name="check" :size="14" />
        </button>
      </div>
    </Transition>

    <div v-if="open" class="theme-switcher__backdrop" @click="open = false" />
  </div>
</template>

<style scoped>
.theme-switcher {
  position: relative;
}
.theme-switcher__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.theme-switcher__trigger:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}
.theme-switcher__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  min-width: 160px;
  padding: 6px;
  border-radius: var(--radius-lg);
}
.theme-switcher__title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 6px 10px;
}
.theme-switcher__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-fast) var(--ease-standard);
}
.theme-switcher__item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.theme-switcher__item.is-active {
  color: var(--accent-primary);
}
.theme-switcher__item span {
  flex: 1;
}
.theme-switcher__backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
}
</style>

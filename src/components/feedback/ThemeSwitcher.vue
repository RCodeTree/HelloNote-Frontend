<script setup lang="ts">
import { computed } from 'vue'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useThemeStore } from '@/stores/theme.store'
import AppIcon from '@/components/common/AppIcon.vue'

const themeStore = useThemeStore()

const options = [
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
  { value: 'system', label: '跟随系统', icon: 'monitor' },
] as const

const currentIcon = computed(() => {
  if (themeStore.mode === 'light') return 'sun'
  if (themeStore.mode === 'dark') return 'moon'
  return 'monitor'
})

function iconFor(v: string): 'sun' | 'moon' | 'monitor' {
  if (v === 'light') return 'sun'
  if (v === 'dark') return 'moon'
  return 'monitor'
}

function choose(v: 'light' | 'dark' | 'system'): void {
  themeStore.setMode(v)
}
</script>

<template>
  <Menu as="div" class="theme-switcher">
    <MenuButton class="theme-switcher__trigger" :aria-label="`当前外观：${themeStore.mode}`">
      <AppIcon :name="currentIcon" :size="18" />
    </MenuButton>

    <Transition name="dropdown">
      <MenuItems class="theme-switcher__menu">
        <p class="theme-switcher__title">外观</p>
        <MenuItem
          v-for="opt in options"
          :key="opt.value"
          as="button"
          class="theme-switcher__item"
          :class="{ 'is-active': themeStore.mode === opt.value }"
          @click="choose(opt.value)"
        >
          <AppIcon :name="iconFor(opt.value)" :size="16" />
          <span>{{ opt.label }}</span>
          <AppIcon v-if="themeStore.mode === opt.value" name="check" :size="14" />
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>

<style scoped>
.theme-switcher {
  position: relative;
}
.theme-switcher__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
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
  z-index: 75;
  width: 180px;
  padding: 6px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: var(--shadow-floating);
}
.theme-switcher__title {
  margin: 0 0 4px;
  padding: 4px 10px 6px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.theme-switcher__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.theme-switcher__item:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}
.theme-switcher__item.is-active {
  color: var(--accent-primary);
}
.theme-switcher__item span {
  flex: 1;
  text-align: left;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.16s var(--ease-standard),
    transform 0.16s var(--ease-standard);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

<script setup lang="ts">
import {
  Home,
  LayoutGrid,
  StickyNote,
  Tag,
  Search,
  Sun,
  Moon,
  Monitor,
  Menu as MenuIcon,
  X,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Pin,
  Plus,
  Check,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  Trash2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link2,
  List,
  Quote,
  Eye,
  Upload,
  Columns2,
  PanelLeft,
  PanelLeftClose,
  Download,
} from 'lucide-vue-next'
import type { Component } from 'vue'

export type IconName =
  | 'home'
  | 'grid'
  | 'note'
  | 'tag'
  | 'search'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'menu'
  | 'close'
  | 'user'
  | 'logout'
  | 'chevron-left'
  | 'chevron-right'
  | 'pin'
  | 'plus'
  | 'check'
  | 'chevron-down'
  | 'sparkles'
  | 'refresh'
  | 'expand'
  | 'contract'
  | 'trash'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'link'
  | 'list'
  | 'quote'
  | 'eye'
  | 'upload'
  | 'layout-full'
  | 'layout-rail'
  | 'layout-hidden'
  | 'download'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number | string
    strokeWidth?: number | string
  }>(),
  { size: 20, strokeWidth: 1.8 },
)

// kebab 名称 → Lucide 组件映射。
// 保持与原 AppIcon 完全一致的 `name` API，所有调用点（<AppIcon name="...">）无需改动；
// 图标颜色统一由 currentColor 驱动，自动跟随主题与语义化 CSS 变量。
const iconMap: Record<IconName, Component> = {
  home: Home,
  grid: LayoutGrid,
  note: StickyNote,
  tag: Tag,
  search: Search,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  menu: MenuIcon,
  close: X,
  user: User,
  logout: LogOut,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  pin: Pin,
  plus: Plus,
  check: Check,
  'chevron-down': ChevronDown,
  sparkles: Sparkles,
  refresh: RefreshCw,
  expand: Maximize2,
  contract: Minimize2,
  trash: Trash2,
  bold: Bold,
  italic: Italic,
  strike: Strikethrough,
  code: Code,
  link: Link2,
  list: List,
  quote: Quote,
  eye: Eye,
  upload: Upload,
  'layout-full': Columns2,
  'layout-rail': PanelLeft,
  'layout-hidden': PanelLeftClose,
  download: Download,
}

const Icon = iconMap[props.name]
</script>

<template>
  <component
    :is="Icon"
    :size="size"
    :stroke-width="strokeWidth"
    class="app-icon"
    aria-hidden="true"
    focusable="false"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>

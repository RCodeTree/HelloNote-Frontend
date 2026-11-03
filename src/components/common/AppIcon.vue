<script lang="ts">
// 统一图标集（线性风格，currentColor 自适应主题）。
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
</script>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: IconName
    size?: number | string
    strokeWidth?: number
  }>(),
  { size: 20, strokeWidth: 1.8 },
)

const paths: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  note: 'M5 4h11l3 3v13H5zM16 4v4h4',
  tag: 'M3 12l8.5-8.5a2 2 0 0 1 1.4-.6H19a1 1 0 0 1 1 1v6.1a2 2 0 0 1-.6 1.4L12 20z M16 8h.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  pin: 'M9 3h6l-1 6 4 3v2H6v-2l4-3z M12 14v7',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 13l4 4L19 7',
  'chevron-down': 'M6 9l6 6 6-6',
  sparkles:
    'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  contract: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6',
  bold: 'M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z',
  italic: 'M19 4h-9M14 20H5M15 4L9 20',
  strike: 'M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  quote: 'M5 5h5v6H7c0 2 1 3 3 3v3c-4 0-5-3-5-6zM14 5h5v6h-3c0 2 1 3 3 3v3c-4 0-5-3-5-6z',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  'layout-full': 'M3 4h18v16H3zM9 4v16M15 4v16',
  'layout-rail': 'M3 4h18v16H3zM9 4v16',
  'layout-hidden': 'M3 4h18v16H3z',
  download: 'M12 3v12M7 11l5 5 5-5M5 21h14',
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>

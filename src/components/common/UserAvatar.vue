<script setup lang="ts">
import { computed } from 'vue'

// 用户头像：有 avatarUrl 显示图片；否则显示昵称首字符 + 由用户名确定的背景色
const props = withDefaults(
  defineProps<{
    name: string
    url?: string | null
    size?: number
  }>(),
  { url: null, size: 36 },
)

const PALETTE = ['#7c9cf5', '#f5a97c', '#7cd6a0', '#e08ccf', '#8cd0e0', '#c9a2f0', '#f0d08c', '#f08c8c']

const initial = computed(() => props.name?.trim()?.charAt(0)?.toUpperCase() || '?')

const bgColor = computed(() => {
  let hash = 0
  for (const ch of props.name ?? '') hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return PALETTE[hash % PALETTE.length]
})

const fontSize = computed(() => Math.max(11, Math.round(props.size * 0.42)))
</script>

<template>
  <span
    class="user-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, background: url ? 'transparent' : bgColor, fontSize: `${fontSize}px` }"
  >
    <img v-if="url" :src="url" :alt="name" class="user-avatar__img" />
    <template v-else>{{ initial }}</template>
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  font-weight: 600;
  line-height: 1;
  overflow: hidden;
  user-select: none;
}
.user-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

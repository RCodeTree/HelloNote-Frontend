<script setup lang="ts">
import { computed } from 'vue'

// 用户头像：有 avatarUrl 显示图片；否则显示昵称首字符 + 由用户名确定的背景色。
// 可选 presence：在右下角叠加在线状态小圆点（绿色在线 / 灰色离线）。
const props = withDefaults(
  defineProps<{
    name: string
    url?: string | null
    size?: number
    /** 在线状态：online 在线（绿点）/ offline 离线（灰点）；不传则不显示状态点 */
    presence?: 'online' | 'offline'
  }>(),
  { url: null, size: 36, presence: undefined },
)

const PALETTE = ['#7c9cf5', '#f5a97c', '#7cd6a0', '#e08ccf', '#8cd0e0', '#c9a2f0', '#f0d08c', '#f08c8c']

const initial = computed(() => props.name?.trim()?.charAt(0)?.toUpperCase() || '?')

const bgColor = computed(() => {
  let hash = 0
  for (const ch of props.name ?? '') hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return PALETTE[hash % PALETTE.length]
})

const fontSize = computed(() => Math.max(11, Math.round(props.size * 0.42)))

// 状态点尺寸随头像缩放：小头像 8px，大头像 12px
const dotSize = computed(() => Math.max(8, Math.round(props.size * 0.24)))
</script>

<template>
  <span
    class="user-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, background: url ? 'transparent' : bgColor, fontSize: `${fontSize}px` }"
  >
    <img v-if="url" :src="url" :alt="name" class="user-avatar__img" />
    <template v-else>{{ initial }}</template>
    <span
      v-if="presence"
      class="user-avatar__presence"
      :class="`user-avatar__presence--${presence}`"
      :style="{ width: `${dotSize}px`, height: `${dotSize}px` }"
      :title="presence === 'online' ? '在线' : '离线'"
    />
  </span>
</template>

<style scoped>
.user-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  font-weight: 600;
  line-height: 1;
  overflow: visible;
  user-select: none;
}
.user-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
/* 在线状态点：右下角叠加，带背景色描边避免与头像粘连 */
.user-avatar__presence {
  position: absolute;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 2px solid var(--bg-card, #fff);
  box-sizing: content-box;
}
.user-avatar__presence--online {
  background: #4ade80;
  box-shadow: 0 0 0 0 rgb(74 222 128 / 45%);
  animation: presence-pulse 2.4s var(--ease-standard, ease) infinite;
}
.user-avatar__presence--offline {
  background: var(--text-muted, #9ca3af);
}
@keyframes presence-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(74 222 128 / 45%);
  }
  70% {
    box-shadow: 0 0 0 4px rgb(74 222 128 / 0%);
  }
  100% {
    box-shadow: 0 0 0 0 rgb(74 222 128 / 0%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .user-avatar__presence--online {
    animation: none;
  }
}
</style>

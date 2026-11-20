<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import NoteComments from './NoteComments.vue'
import { useCommentStore } from '../stores/comment.store'

const props = defineProps<{ noteId: number }>()

const store = useCommentStore()
const { commentsByNote, likeByNote, likingByNote, error } = storeToRefs(store)

// 同一时刻只展开一个悬浮框：'comments' | 'likes' | null
const openPanel = ref<'comments' | 'likes' | null>(null)
const rootEl = ref<HTMLElement | null>(null)

const comments = computed(() => commentsByNote.value[props.noteId] ?? [])
const likeState = computed(
  () => likeByNote.value[props.noteId] ?? { likeCount: 0, likedByMe: false },
)
const liking = computed(() => likingByNote.value[props.noteId] === true)

watch(
  () => props.noteId,
  (id) => {
    openPanel.value = null
    void store.load(id)
    void store.loadLike(id)
  },
  { immediate: true },
)

function toggle(panel: 'comments' | 'likes'): void {
  openPanel.value = openPanel.value === panel ? null : panel
}

function close(): void {
  openPanel.value = null
}

async function onLike(): Promise<void> {
  await store.toggleLike(props.noteId)
}

// 点击组件外部时关闭悬浮框
function onDocClick(e: MouseEvent): void {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) close()
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootEl" class="social">
    <!-- 评论图标：带未读数量角标。点击展开评论悬浮框 -->
    <button
      type="button"
      class="social__btn"
      :class="{ 'is-active': openPanel === 'comments' }"
      :title="openPanel === 'comments' ? '收起评论' : '评论'"
      :aria-expanded="openPanel === 'comments'"
      @click.stop="toggle('comments')"
    >
      <AppIcon name="message" :size="18" />
      <span v-if="comments.length" class="social__badge">{{ comments.length }}</span>
    </button>

    <!-- 点赞图标：已点赞高亮填充，带点赞数角标。点击展开点赞悬浮框 -->
    <button
      type="button"
      class="social__btn social__btn--like"
      :class="{ 'is-active': openPanel === 'likes', 'is-liked': likeState.likedByMe }"
      :title="openPanel === 'likes' ? '收起点赞' : '点赞'"
      :aria-expanded="openPanel === 'likes'"
      @click.stop="toggle('likes')"
    >
      <AppIcon name="heart" :size="18" />
      <span v-if="likeState.likeCount" class="social__badge">{{ likeState.likeCount }}</span>
    </button>

    <!-- 评论悬浮框 -->
    <Transition name="pop">
      <div v-if="openPanel === 'comments'" class="social__pop social__pop--comments" @click.stop>
        <NoteComments :note-id="noteId" />
      </div>
    </Transition>

    <!-- 点赞悬浮框 -->
    <Transition name="pop">
      <div v-if="openPanel === 'likes'" class="social__pop social__pop--likes" @click.stop>
        <button
          type="button"
          class="like-pop__main"
          :class="{ 'is-liked': likeState.likedByMe }"
          :disabled="liking"
          @click="onLike"
        >
          <AppIcon name="heart" :size="26" />
          <span class="like-pop__count">{{ likeState.likeCount }}</span>
        </button>
        <p class="like-pop__label">{{ likeState.likedByMe ? '已点赞' : '点赞' }}</p>
      </div>
    </Transition>

    <p v-if="error && openPanel" class="social__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.social {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.social__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.social__btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.social__btn.is-active {
  color: var(--accent-primary);
  background: var(--bg-secondary);
}
.social__btn--like.is-liked {
  color: var(--accent-danger);
}
.social__btn--like.is-liked :deep(.app-icon) {
  fill: currentColor;
}
.social__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--accent-primary);
  color: #fff;
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
}
.social__btn--like.is-liked .social__badge {
  background: var(--accent-danger);
}

/* 悬浮框：定位在按钮下方右侧，层级高于正文，玻璃卡片风格与导出菜单一致 */
.social__pop {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 80;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
}
.social__pop--comments {
  width: min(440px, calc(100vw - 32px));
  max-height: min(560px, calc(100dvh - 120px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.social__pop--likes {
  width: 160px;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}
.like-pop__main {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.like-pop__main:hover:not(:disabled) {
  border-color: var(--accent-danger);
  color: var(--accent-danger);
}
.like-pop__main.is-liked {
  color: var(--accent-danger);
  border-color: color-mix(in srgb, var(--accent-danger) 45%, transparent);
  background: color-mix(in srgb, var(--accent-danger) 10%, transparent);
}
.like-pop__main.is-liked :deep(.app-icon) {
  fill: currentColor;
}
.like-pop__main:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.like-pop__count {
  font-size: 18px;
  font-weight: 600;
  font-family: var(--font-display);
}
.like-pop__label {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
.social__error {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 80;
  margin: 0;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--danger);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
}

/* 悬浮框内评论区的内边距微调：列表可滚动 */
.social__pop--comments :deep(.comments) {
  padding: var(--space-4);
  overflow-y: auto;
}

@media (max-width: 640px) {
  .social__btn {
    width: 32px;
    height: 32px;
  }
}
</style>

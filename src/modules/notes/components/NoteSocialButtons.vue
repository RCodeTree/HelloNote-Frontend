<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import NoteComments from './NoteComments.vue'
import { useCommentStore } from '../stores/comment.store'

const props = defineProps<{ noteId: number }>()

const store = useCommentStore()
const { commentsByNote, likeByNote, likingByNote, error } = storeToRefs(store)

// 评论悬浮框展开状态（点赞改为按钮直接切换，无浮层）
const commentsOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const comments = computed(() => commentsByNote.value[props.noteId] ?? [])
const likeState = computed(
  () => likeByNote.value[props.noteId] ?? { likeCount: 0, likedByMe: false },
)
const liking = computed(() => likingByNote.value[props.noteId] === true)

watch(
  () => props.noteId,
  (id) => {
    commentsOpen.value = false
    void store.load(id)
    void store.loadLike(id)
  },
  { immediate: true },
)

function close(): void {
  commentsOpen.value = false
}

async function onLike(): Promise<void> {
  // 点赞直接切换（再次点击取消），带防抖避免重复请求
  if (liking.value) return
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
    <!-- 评论图标：带数量角标。点击展开评论悬浮框 -->
    <button
      type="button"
      class="social__btn"
      :class="{ 'is-active': commentsOpen }"
      :title="commentsOpen ? '收起评论' : '评论'"
      :aria-expanded="commentsOpen"
      @click.stop="commentsOpen = !commentsOpen"
    >
      <AppIcon name="message" :size="18" />
      <span v-if="comments.length" class="social__badge">{{ comments.length }}</span>
    </button>

    <!-- 点赞图标：直接点击切换点赞/取消，带数量角标 -->
    <button
      type="button"
      class="social__btn social__btn--like"
      :class="{ 'is-liked': likeState.likedByMe }"
      :title="likeState.likedByMe ? '取消点赞' : '点赞'"
      :disabled="liking"
      @click.stop="onLike"
    >
      <AppIcon name="heart" :size="18" />
      <span v-if="likeState.likeCount" class="social__badge">{{ likeState.likeCount }}</span>
    </button>

    <!-- 评论悬浮框：跃动弹出 -->
    <Transition name="comment-pop">
      <div v-if="commentsOpen" class="social__pop social__pop--comments" @click.stop>
        <NoteComments :note-id="noteId" />
      </div>
    </Transition>

    <p v-if="error && commentsOpen" class="social__error">{{ error }}</p>
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
  transform-origin: top right;
}
/* 评论浮层跃动弹出：从上方落下并回弹 */
.comment-pop-enter-active {
  animation: comment-pop-in 420ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
}
.comment-pop-leave-active {
  transition: opacity 180ms var(--ease-standard), transform 180ms var(--ease-standard);
}
.comment-pop-enter-from {
  opacity: 0;
}
.comment-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
@keyframes comment-pop-in {
  0% {
    opacity: 0;
    transform: translateY(-18px) scale(0.94);
  }
  60% {
    opacity: 1;
    transform: translateY(4px) scale(1.01);
  }
  80% {
    transform: translateY(-2px) scale(0.995);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .comment-pop-enter-active {
    animation: none;
  }
  .comment-pop-leave-active {
    transition: none;
  }
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

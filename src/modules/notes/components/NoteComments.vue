<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useToast } from '@/composables/useToast'
import { useCommentStore } from '../stores/comment.store'
import type { Comment } from '../types/comments.types'

const props = defineProps<{ noteId: number }>()

const store = useCommentStore()
const toast = useToast()
const { commentsByNote, likeByNote, loadingByNote, likingByNote, error } = storeToRefs(store)

const comments = computed(() => commentsByNote.value[props.noteId] ?? [])
const likeState = computed(
  () => likeByNote.value[props.noteId] ?? { likeCount: 0, likedByMe: false },
)
const loading = computed(() => loadingByNote.value[props.noteId] === true)
const liking = computed(() => likingByNote.value[props.noteId] === true)

const draft = ref('')
const replyTo = ref<number | null>(null)
const submitting = ref(false)
const deletingId = ref<number | null>(null)

watch(
  () => props.noteId,
  (id) => {
    draft.value = ''
    replyTo.value = null
    void store.load(id)
    void store.loadLike(id)
  },
  { immediate: true },
)

function formatTime(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parentName(parentId: number | null): string {
  if (parentId === null) return ''
  return comments.value.find((c) => c.id === parentId)?.authorName ?? '某位笔友'
}

function beginReply(comment: Comment): void {
  replyTo.value = comment.id
  draft.value = ''
}

function cancelReply(): void {
  replyTo.value = null
}

async function submit(): Promise<void> {
  const content = draft.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  const created = await store.add(props.noteId, { content, parentId: replyTo.value })
  submitting.value = false
  if (created) {
    draft.value = ''
    replyTo.value = null
  } else {
    toast.error(error.value || '发送失败')
  }
}

async function onLike(): Promise<void> {
  await store.toggleLike(props.noteId)
}

async function onDelete(id: number): Promise<void> {
  deletingId.value = id
  const ok = await store.remove(props.noteId, id)
  deletingId.value = null
  if (ok) toast.success('评论已删除')
  else toast.error(error.value || '删除失败')
}
</script>

<template>
  <section class="comments">
    <header class="comments__head">
      <h2 class="comments__title">
        <AppIcon name="message" :size="18" />
        <span>评论</span>
        <span class="comments__count">{{ comments.length }}</span>
      </h2>
      <button
        type="button"
        class="comments__like"
        :class="{ 'is-liked': likeState.likedByMe }"
        :disabled="liking"
        :title="likeState.likedByMe ? '取消点赞' : '点赞'"
        @click="onLike"
      >
        <AppIcon name="heart" :size="18" />
        <span>{{ likeState.likeCount }}</span>
      </button>
    </header>

    <div v-if="loading" class="comments__loading">加载中…</div>
    <EmptyState v-else-if="!comments.length" title="暂无评论" />
    <ul v-else class="comments__list">
      <li v-for="c in comments" :key="c.id" class="comments__item">
        <UserAvatar :name="c.authorName" :url="c.authorAvatar" :size="36" />
        <div class="comments__body">
          <div class="comments__meta">
            <span class="comments__author">{{ c.authorName }}</span>
            <time class="comments__time">{{ formatTime(c.createdAt) }}</time>
          </div>
          <p v-if="c.parentId !== null" class="comments__replyto">回复 @{{ parentName(c.parentId) }}</p>
          <p class="comments__content">{{ c.content }}</p>
          <div class="comments__ops">
            <button type="button" class="comments__op" @click="beginReply(c)">回复</button>
            <button
              type="button"
              class="comments__op is-danger"
              :disabled="deletingId === c.id"
              @click="onDelete(c.id)"
            >
              删除
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div class="comments__composer">
      <div v-if="replyTo !== null" class="comments__replybar">
        <span>回复 @{{ parentName(replyTo) }}</span>
        <button type="button" class="comments__replycancel" @click="cancelReply">取消</button>
      </div>
      <textarea
        v-model="draft"
        class="comments__textarea"
        rows="3"
        placeholder="写下评论"
        :disabled="submitting"
        @keydown.ctrl.enter.prevent="submit"
        @keydown.meta.enter.prevent="submit"
      />
      <div class="comments__composer-foot">
        <BaseButton
          variant="primary"
          size="sm"
          :loading="submitting"
          :disabled="submitting || !draft.trim()"
          @click="submit"
        >
          <AppIcon name="send" :size="14" />
          <span>发送</span>
        </BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.comments {
  width: 100%;
  border-top: 1px solid var(--border-default);
  padding-top: var(--space-6);
  margin-top: var(--space-2);
}
.comments__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.comments__title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}
.comments__count {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}
.comments__like {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}
.comments__like:hover:not(:disabled) {
  border-color: var(--accent-danger);
  color: var(--accent-danger);
}
.comments__like.is-liked {
  color: var(--accent-danger);
  border-color: color-mix(in srgb, var(--accent-danger) 45%, transparent);
  background: color-mix(in srgb, var(--accent-danger) 10%, transparent);
}
.comments__like.is-liked :deep(.app-icon) {
  fill: currentColor;
}
.comments__like:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.comments__loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
}
.comments__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  list-style: none;
  margin: 0 0 var(--space-6);
  padding: 0;
}
.comments__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.comments__body {
  flex: 1;
  min-width: 0;
}
.comments__meta {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.comments__author {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.comments__time {
  font-size: 12px;
  color: var(--text-muted);
}
.comments__replyto {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--accent-primary);
}
.comments__content {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}
.comments__ops {
  display: flex;
  gap: var(--space-3);
  margin-top: 6px;
}
.comments__op {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}
.comments__op:hover:not(:disabled) {
  color: var(--accent-primary);
}
.comments__op.is-danger:hover:not(:disabled) {
  color: var(--danger);
}
.comments__op:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.comments__composer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.comments__replybar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--accent-primary);
  font-size: 12px;
}
.comments__replycancel {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}
.comments__replycancel:hover {
  color: var(--text-primary);
}
.comments__textarea {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  resize: vertical;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.comments__textarea::placeholder {
  color: var(--text-muted);
}
.comments__textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.comments__composer-foot {
  display: flex;
  justify-content: flex-end;
}
</style>

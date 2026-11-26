<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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
const { commentsByNote, loadingByNote, error } = storeToRefs(store)

const comments = computed(() => commentsByNote.value[props.noteId] ?? [])
const loading = computed(() => loadingByNote.value[props.noteId] === true)

const draft = ref('')
const replyTo = ref<number | null>(null)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const textareaEl = ref<HTMLTextAreaElement | null>(null)

// 聚焦输入框并把光标移到末尾；滚动到可见，方便长列表里回复
function focusInput(): void {
  const el = textareaEl.value
  if (!el) return
  el.focus()
  const end = el.value.length
  el.setSelectionRange(end, end)
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

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
  void nextTick(focusInput)
}

function cancelReply(): void {
  replyTo.value = null
  void nextTick(focusInput)
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
    void nextTick(focusInput)
  } else {
    toast.error(error.value || '发送失败')
  }
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
        ref="textareaEl"
        v-model="draft"
        class="comments__textarea"
        rows="3"
        :placeholder="replyTo !== null ? `回复 @${parentName(replyTo)}` : '写下评论'"
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

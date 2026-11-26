<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import NoteSocialButtons from '../components/NoteSocialButtons.vue'
import { fetchPublicNote } from '../api/notes.api'
import type { PublicNote } from '../types/notes.types'

const route = useRoute()
const router = useRouter()

const noteId = computed(() => {
  const raw = route.params.id
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(value) ? value : 0
})
const note = ref<PublicNote | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    note.value = await fetchPublicNote(noteId.value)
  } catch {
    note.value = null
  } finally {
    loading.value = false
  }
})

function formatDate(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="public-detail">
    <div v-if="loading" class="public-detail__loading">加载中…</div>
    <EmptyState v-else-if="!note" title="笔记不存在或已设为私密" />
    <template v-else>
      <header class="public-detail__head">
        <button type="button" class="public-detail__back" aria-label="返回" @click="router.back()">
          <AppIcon name="chevron-left" :size="18" />
        </button>
        <NoteSocialButtons :note-id="note.id" />
      </header>
      <article class="public-detail__article">
        <h1 class="public-detail__title">{{ note.title }}</h1>
        <div class="public-detail__author">
          <UserAvatar :name="note.authorName" :url="note.authorAvatar" :size="32" />
          <span>{{ note.authorName }}</span>
          <time>{{ formatDate(note.updatedAt) }}</time>
        </div>
        <div class="public-detail__tags">
          <BaseTag v-for="t in note.tags" :key="t.id" :label="t.name" :color="t.color" size="sm" />
        </div>
        <div class="public-detail__content">{{ note.excerpt }}</div>
        <p class="public-detail__hint">（广场预览仅展示摘要。完整内容请在笔记编辑器查看。）</p>
      </article>
    </template>
  </div>
</template>

<style scoped>
.public-detail {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.public-detail__loading {
  padding: var(--space-6) 0;
  color: var(--text-muted);
  text-align: center;
}
.public-detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.public-detail__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.public-detail__back:hover {
  color: var(--accent-primary);
  background: var(--bg-secondary);
}
.public-detail__article {
  padding: var(--space-6);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.public-detail__title {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
}
.public-detail__author {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--text-secondary);
}
.public-detail__author time {
  margin-left: auto;
  color: var(--text-muted);
}
.public-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.public-detail__content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
}
.public-detail__hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
</style>

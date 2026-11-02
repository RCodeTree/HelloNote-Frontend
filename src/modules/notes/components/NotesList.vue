<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes.store'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import SkeletonCard from '@/components/feedback/SkeletonCard.vue'
import { parseImportedFile } from '../utils/importNotes'
import { useToast } from '@/composables/useToast'

const store = useNotesStore()
const router = useRouter()
const toast = useToast()
const { notes, loading, error, search, selectedTagId, tags, total } = storeToRefs(store)

onMounted(() => {
  void store.init()
})

function openEditor(id: number): void {
  void router.push(`/notes/${id}/edit`)
}

function openCreate(): void {
  void router.push('/notes/new')
}

// —— 删除：应用内确认弹窗替代原生 confirm，成功后 toast 提示 ——
const deleteTarget = ref<number | null>(null)
const deleteOpen = computed(() => deleteTarget.value !== null)

function requestDelete(id: number): void {
  deleteTarget.value = id
}

async function onDelete(): Promise<void> {
  const id = deleteTarget.value
  if (id === null) return
  deleteTarget.value = null
  const ok = await store.remove(id)
  if (ok) toast.success('笔记已删除')
  else toast.error(error.value || '删除失败，请重试')
}

// —— 本地笔记导入：txt / md / html，自动做格式转换 ——
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)

function pickFiles(): void {
  fileInput.value?.click()
}

async function onFilesChosen(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // 允许重复选择同一文件
  if (!files.length || importing.value) return

  importing.value = true
  let ok = 0
  const failures: string[] = []
  for (const file of files) {
    try {
      const note = await parseImportedFile(file)
      const created = await store.submitCreate({
        title: note.title,
        content: note.content,
        // .md / .html(已转 Markdown) 用 Markdown 格式；.txt 为纯文本
        format: note.kind === 'txt' ? 'text' : 'markdown',
        isPinned: false,
        tagIds: [],
      })
      if (created) ok += 1
      else failures.push(file.name)
    } catch (err) {
      failures.push(err instanceof Error ? err.message : file.name)
    }
  }
  importing.value = false

  if (ok && failures.length) toast.success(`已导入 ${ok} 篇，${failures.length} 篇失败`)
  else if (ok) toast.success(`已导入 ${ok} 篇笔记`)
  else toast.error(failures[0] || '没有可导入的笔记')
}

function excerpt(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 140) || '（空白笔记）'
}

function formatDate(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="notes">
    <header class="notes__head">
      <div>
        <h1 class="notes__title">我的笔记</h1>
        <p class="notes__sub">共 {{ total }} 篇</p>
      </div>
      <div class="notes__actions">
        <button
          class="notes__import"
          :disabled="importing"
          title="导入本地笔记（.txt / .md / .html）"
          @click="pickFiles"
        >
          <AppIcon name="upload" :size="16" />
          <span>{{ importing ? '导入中…' : '导入' }}</span>
        </button>
        <button class="notes__create" @click="openCreate">
          <AppIcon name="plus" :size="16" />
          <span>新建笔记</span>
        </button>
      </div>
      <!-- 隐藏文件选择框：普通文本 / Markdown / 有格式 HTML 笔记 -->
      <input
        ref="fileInput"
        type="file"
        accept=".txt,.text,.md,.markdown,.html,.htm"
        multiple
        hidden
        @change="onFilesChosen"
      />
    </header>

    <div class="notes__tools">
      <div class="notes__search">
        <AppIcon name="search" :size="16" class="notes__search-icon" />
        <input
          :value="search"
          type="text"
          placeholder="搜索标题或内容…"
          @input="store.setSearch(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="notes__filters">
        <button
          class="notes__chip"
          :class="{ 'is-active': selectedTagId === null }"
          @click="store.setTagFilter(null)"
        >
          全部
        </button>
        <button
          v-for="t in tags"
          :key="t.id"
          class="notes__chip"
          :class="{ 'is-active': selectedTagId === t.id }"
          @click="store.setTagFilter(t.id)"
        >
          <span class="notes__chip-dot" :style="{ background: t.color || 'var(--accent-primary)' }" />
          {{ t.name }}
        </button>
      </div>
    </div>

    <p v-if="error" class="notes__error">{{ error }}</p>

    <div v-if="loading" class="notes__grid">
      <SkeletonCard v-for="i in 6" :key="i" :lines="3" />
    </div>

    <div v-else-if="notes.length" class="notes__grid">
      <article
        v-for="n in notes"
        :key="n.id"
        class="note-card"
        @click="openEditor(n.id)"
      >
        <div class="note-card__top">
          <h3 class="note-card__title">{{ n.title }}</h3>
          <div class="note-card__actions">
            <button
              class="note-card__act"
              :class="{ 'is-active': n.isPinned }"
              :title="n.isPinned ? '取消置顶' : '置顶'"
              @click.stop="store.togglePin(n.id)"
            >
              <AppIcon name="pin" :size="15" />
            </button>
            <button
              class="note-card__act note-card__act--danger"
              title="删除"
              @click.stop="requestDelete(n.id)"
            >
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </div>
        <p class="note-card__excerpt">{{ excerpt(n.content) }}</p>
        <div class="note-card__foot">
          <div class="note-card__tags">
            <BaseTag v-for="t in n.tags" :key="t.id" :label="t.name" :color="t.color" size="sm" />
          </div>
          <span class="note-card__date">{{ formatDate(n.updatedAt) }}</span>
        </div>
      </article>
    </div>

    <EmptyState
      v-else
      title="还没有笔记"
      description="点击右上角「新建笔记」，开始记录你的想法。"
    />

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :open="deleteOpen"
      title="删除笔记"
      message="确定要删除这篇笔记吗？删除后不可恢复。"
      confirm-text="删除"
      danger
      @confirm="onDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
.notes {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.notes__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.notes__title {
  font-size: 24px;
}
.notes__sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}
.notes__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}
.notes__import {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.notes__import:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.notes__import:disabled {
  opacity: 0.6;
  cursor: wait;
}
.notes__create {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent-primary);
  color: var(--accent-contrast, #fff);
  font-size: 14px;
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.notes__create:hover {
  opacity: 0.9;
}
.notes__tools {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.notes__search {
  position: relative;
  display: flex;
  align-items: center;
}
.notes__search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
}
.notes__search input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.notes__search input:focus {
  border-color: var(--accent-primary);
}
.notes__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.notes__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.notes__chip.is-active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.notes__chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.notes__error {
  font-size: 13px;
  color: var(--danger);
}
.notes__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}
.note-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.note-card:hover {
  border-color: var(--accent-primary);
}
.note-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.note-card__title {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.note-card__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.note-card__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.note-card__act:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.note-card__act.is-active {
  color: var(--accent-primary);
}
.note-card__act--danger:hover {
  color: var(--danger);
}
.note-card__excerpt {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.note-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.note-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.note-card__date {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>

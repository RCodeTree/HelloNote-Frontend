<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes.store'
import type { NoteCreatePayload, Tag } from '../types/notes.types'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TagSelect from '../components/TagSelect.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const toast = useToast()
const { notes, tags, current, currentLoading, saving, error } = storeToRefs(store)

const noteId = computed<number | null>(() => {
  const raw = route.params.id
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) ? n : null
})
const isEdit = computed(() => noteId.value !== null)

const form = reactive({ title: '', content: '', isPinned: false, tagIds: [] as number[] })

// 快照必须是响应式 ref：保存成功后仅快照变化、form 不变时，
// dirty 计算属性才会重新求值（普通变量不会触发，导致“未保存”不消失、按钮仍可点击）。
const snapshot = ref('')

const dirty = computed(() => JSON.stringify({ ...form }) !== snapshot.value)

/** 保存状态文案：保存中 / 未保存 / 已保存 */
const saveState = computed(() => (saving.value ? '保存中…' : dirty.value ? '未保存' : '已保存'))

function takeSnapshot(): void {
  snapshot.value = JSON.stringify({ ...form })
}

function fillFromNote(note: {
  title: string
  content: string
  isPinned: boolean
  tags: { id: number }[]
}): void {
  form.title = note.title
  form.content = note.content
  form.isPinned = note.isPinned
  form.tagIds = note.tags.map((t) => t.id)
  takeSnapshot()
  void nextTick(autosize)
}

function resetForm(): void {
  form.title = ''
  form.content = ''
  form.isPinned = false
  form.tagIds = []
  takeSnapshot()
}

async function loadTarget(): Promise<void> {
  if (noteId.value === null) {
    store.clearCurrent()
    resetForm()
    return
  }
  // 已在列表缓存中则直接回填，同时后台刷新详情
  const cached = store.notes.find((n) => n.id === noteId.value)
  const note = (await store.loadNote(noteId.value)) ?? cached
  if (note) fillFromNote(note)
  else resetForm()
}

onMounted(() => {
  // 笔记切换下拉与标签选择器都需要基础数据
  if (!store.notes.length) void store.loadNotes()
  if (!store.tags.length) void store.loadTags()
  void loadTarget()
  // 视口宽度变化会改变换行，需重算 textarea 高度
  window.addEventListener('resize', autosize)
})

onUnmounted(() => {
  window.removeEventListener('resize', autosize)
})

// 路由参数变化（下拉切换笔记）时重新加载
watch(noteId, () => void loadTarget())

async function onSave(): Promise<void> {
  if (saving.value) return
  if (!form.title.trim()) {
    store.error = '请填写标题'
    return
  }
  const payload: NoteCreatePayload = {
    title: form.title.trim(),
    content: form.content,
    isPinned: form.isPinned,
    tagIds: form.tagIds,
  }
  if (isEdit.value && noteId.value !== null) {
    const note = await store.submitUpdate(noteId.value, payload)
    if (note) takeSnapshot()
  } else {
    const note = await store.submitCreate(payload)
    if (note) {
      takeSnapshot()
      await router.replace(`/notes/${note.id}/edit`)
    }
  }
}

function onKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (dirty.value && !saving.value) void onSave()
  }
}

// —— 删除：应用内确认弹窗替代原生 confirm，删除成功后 toast 提示 ——
const deleteOpen = ref(false)

function requestDelete(): void {
  if (noteId.value === null) return
  deleteOpen.value = true
}

async function onDelete(): Promise<void> {
  if (noteId.value === null) return
  deleteOpen.value = false
  const ok = await store.remove(noteId.value)
  if (ok) {
    toast.success('笔记已删除')
    await router.push('/notes')
  } else {
    toast.error(error.value || '删除失败，请重试')
  }
}

function togglePinLocal(): void {
  form.isPinned = !form.isPinned
}

/** 内联新建标签，成功后由 TagSelect 自动勾选 */
async function handleCreateTag(name: string): Promise<Tag | null> {
  return store.addTag(name)
}

// —— 笔记切换下拉 ——
const menuOpen = ref(false)

function switchTo(id: number): void {
  menuOpen.value = false
  if (id !== noteId.value) void router.push(`/notes/${id}/edit`)
}

function goCreate(): void {
  menuOpen.value = false
  if (!isEdit.value) return
  void router.push('/notes/new')
}

// —— 内容自适应高度：textarea 不出现自身滚动条，整页滚动浏览 ——
const contentEl = ref<HTMLTextAreaElement | null>(null)

function autosize(): void {
  const el = contentEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(
  () => form.content,
  () => void nextTick(autosize),
)
watch(currentLoading, (v) => {
  if (!v) void nextTick(autosize)
})

function formatDate(value: string | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime())
    ? value
    : d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="editor" @keydown="onKeydown">
    <!-- 顶栏：返回 / 笔记切换下拉 / 保存状态与操作 -->
    <header class="editor__topbar">
      <div class="editor__topbar-left">
        <button class="editor__iconbtn" title="返回列表" @click="router.push('/notes')">
          <AppIcon name="chevron-left" :size="18" />
        </button>
        <span class="editor__divider" />

        <!-- 笔记切换下拉：展示当前笔记，可直接选择其他笔记编辑 -->
        <div class="switcher">
          <button class="switcher__trigger" @click="menuOpen = !menuOpen">
            <span class="switcher__title">{{ isEdit ? current?.title || '加载中…' : '新建笔记' }}</span>
            <AppIcon name="chevron-down" :size="14" class="switcher__chevron" :class="{ 'is-open': menuOpen }" />
          </button>
          <Transition name="pop">
            <div v-if="menuOpen" class="switcher__menu">
              <button class="switcher__item switcher__item--create" @click="goCreate">
                <AppIcon name="plus" :size="15" />
                <span>新建笔记</span>
              </button>
              <div v-if="notes.length" class="switcher__list">
                <button
                  v-for="n in notes"
                  :key="n.id"
                  class="switcher__item"
                  :class="{ 'is-active': n.id === noteId }"
                  @click="switchTo(n.id)"
                >
                  <AppIcon v-if="n.isPinned" name="pin" :size="13" class="switcher__pin" />
                  <span class="switcher__item-title">{{ n.title || '（无标题）' }}</span>
                </button>
              </div>
              <p v-else class="switcher__empty">暂无其他笔记</p>
            </div>
          </Transition>
          <div v-if="menuOpen" class="switcher__backdrop" @click="menuOpen = false" />
        </div>
      </div>

      <div class="editor__topbar-right">
        <span class="editor__state" :class="{ 'is-dirty': dirty && !saving, 'is-saved': !dirty && !saving }">
          <AppIcon v-if="!dirty && !saving" name="check" :size="13" />
          {{ saveState }}
        </span>
        <button
          v-if="isEdit"
          class="editor__iconbtn"
          :class="{ 'is-active': form.isPinned }"
          :title="form.isPinned ? '取消置顶' : '置顶'"
          @click="togglePinLocal"
        >
          <AppIcon name="pin" :size="17" />
        </button>
        <button v-if="isEdit" class="editor__iconbtn editor__iconbtn--danger" title="删除笔记" @click="requestDelete">
          <AppIcon name="trash" :size="17" />
        </button>
        <BaseButton
          variant="primary"
          size="sm"
          :loading="saving"
          :disabled="saving || (isEdit && !dirty)"
          @click="onSave"
        >
          保存
        </BaseButton>
      </div>
    </header>

    <!-- 正文：整页滚动，textarea 自适应高度，无内部滚动区域 -->
    <div v-if="currentLoading" class="editor__state-page">加载中…</div>
    <div v-else-if="isEdit && !current" class="editor__state-page">
      <p>{{ error || '笔记不存在' }}</p>
      <BaseButton variant="ghost" size="sm" @click="router.push('/notes')">返回列表</BaseButton>
    </div>

    <article v-else class="editor__page">
      <!-- 中间可滚动编辑区：标题 + 元信息 + 正文 -->
      <div class="editor__scroll">
        <input
          v-model="form.title"
          class="editor__title"
          type="text"
          placeholder="无标题"
          autocomplete="off"
        />
        <div class="editor__meta">
          <span v-if="current" class="editor__meta-time">更新于 {{ formatDate(current.updatedAt) }}</span>
          <div class="editor__meta-tags">
            <BaseTag v-for="t in current?.tags ?? []" :key="t.id" :label="t.name" :color="t.color" size="sm" />
          </div>
        </div>
        <textarea
          ref="contentEl"
          v-model="form.content"
          class="editor__content"
          placeholder="开始写下你的想法…"
          @input="autosize"
        />
        <p v-if="error" class="editor__error">{{ error }}</p>
        <p class="editor__shortcut">Ctrl / ⌘ + S 快速保存</p>
      </div>

      <!-- 底部固定栏：标签编辑 -->
      <footer class="editor__footer">
        <div class="editor__tags-edit">
          <span class="editor__tags-label">标签</span>
          <TagSelect :tags="tags" v-model="form.tagIds" :create-tag="handleCreateTag" />
        </div>
      </footer>
    </article>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :open="deleteOpen"
      title="删除笔记"
      message="确定要删除这篇笔记吗？删除后不可恢复。"
      confirm-text="删除"
      danger
      @confirm="onDelete"
      @cancel="deleteOpen = false"
    />
  </div>
</template>

<style scoped>
.editor {
  position: relative; /* 作为 header / footer / 滚动区的定位与层级上下文 */
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 顶栏：固定置顶，层级最高，不随编辑区滚动 */
.editor__topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  background: color-mix(in srgb, var(--bg-card) 92%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-default);
  flex-wrap: wrap;
}
.editor__topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
.editor__topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.editor__iconbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.editor__iconbtn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.editor__iconbtn.is-active {
  color: var(--accent-primary);
}
.editor__iconbtn--danger:hover {
  color: var(--danger);
}
.editor__divider {
  width: 1px;
  height: 20px;
  background: var(--border-default);
}

/* 保存状态：未保存（主色）/ 保存中（次级）/ 已保存（对勾） */
.editor__state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}
.editor__state.is-dirty {
  color: var(--accent-primary);
}
.editor__state.is-saved {
  color: var(--success, #4cae8f);
}

/* 笔记切换下拉 */
.switcher {
  position: relative;
  min-width: 0;
}
.switcher__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 320px;
  padding: 6px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}
.switcher__trigger:hover {
  background: var(--bg-secondary);
}
.switcher__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.switcher__chevron {
  color: var(--text-muted);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.switcher__chevron.is-open {
  transform: rotate(180deg);
}
.switcher__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 75;
  width: 280px;
  max-height: 360px;
  overflow-y: auto;
  padding: 6px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
}
.switcher__backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
}
.switcher__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.switcher__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-fast) var(--ease-standard);
}
.switcher__item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.switcher__item.is-active {
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
  color: var(--accent-primary);
}
.switcher__item--create {
  color: var(--accent-primary);
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border-default);
  border-radius: 0;
  padding-bottom: 10px;
}
.switcher__item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.switcher__pin {
  flex-shrink: 0;
}
.switcher__empty {
  padding: 10px;
  font-size: 13px;
  color: var(--text-muted);
}

/* 页面：铺满内容区（侧栏以外的全部宽度/高度），列为「可滚动中间区 + 固定底部栏」 */
.editor__page {
  position: relative;
  z-index: 1;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* 中间编辑区：标题 + 元信息 + 正文，可独立滚动（层级最低，位于两层固定栏之下） */
.editor__scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-8) clamp(16px, 6vw, 64px) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
/* 底部固定栏：标签编辑，固定置底，层级高于滚动区，不随内容滚动 */
.editor__footer {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  border-top: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: 0 -4px 12px color-mix(in srgb, var(--bg-primary) 40%, transparent);
  padding: var(--space-3) clamp(16px, 6vw, 64px);
}
.editor__title {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: clamp(26px, 4vw, 40px);
  font-weight: 700;
  line-height: 1.3;
  caret-color: var(--accent-primary);
}
.editor__title::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}
.editor__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.editor__meta-time {
  font-size: 12px;
  color: var(--text-muted);
}
.editor__meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
/* 自适应高度：无固定高度、禁用 resize，由 JS 按 scrollHeight 撑开，中间区可滚动 */
.editor__content {
  width: 100%;
  height: auto;
  min-height: 160px;
  overflow: hidden;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.9;
  font-family: inherit;
  caret-color: var(--accent-primary);
}
.editor__content::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}
.editor__tags-edit {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}
.editor__tags-label {
  font-size: 13px;
  color: var(--text-secondary);
  padding-top: 5px;
  flex-shrink: 0;
}
.editor__error {
  font-size: 13px;
  color: var(--danger);
}
.editor__shortcut {
  font-size: 12px;
  color: var(--text-muted);
}
.editor__state-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-10) 0;
  color: var(--text-muted);
  font-size: 14px;
}

/* 下拉弹出动画 */
.pop-enter-active,
.pop-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .editor__topbar {
    padding: var(--space-3) var(--space-4);
    padding-left: 72px; /* 避开移动端浮动菜单按钮 */
  }
  .editor__scroll {
    padding: var(--space-5) var(--space-4) var(--space-6);
  }
  .editor__footer {
    padding: var(--space-3) var(--space-4);
  }
  .switcher__menu {
    width: min(280px, 76vw);
  }
}
</style>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes.store'
import { useAppStore } from '@/stores/app.store'
import type { NoteCreatePayload } from '../types/notes.types'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import TagSelect from './TagSelect.vue'

const store = useNotesStore()
const app = useAppStore()
const { editorOpen, editingId, fullscreen, notes, tags, error } = storeToRefs(store)
const { sidebarWidth } = storeToRefs(app)

const form = reactive({ title: '', content: '', isPinned: false, tagIds: [] as number[] })
const saving = ref(false)

const isEdit = computed(() => editingId.value !== null)
const drawerLeft = computed(() => (fullscreen.value ? '0px' : `${sidebarWidth.value}px`))

watch(editorOpen, (open) => {
  if (!open) return
  if (editingId.value !== null) {
    const n = notes.value.find((x) => x.id === editingId.value)
    if (n) {
      form.title = n.title
      form.content = n.content
      form.isPinned = n.isPinned
      form.tagIds = n.tags.map((t) => t.id)
      return
    }
  }
  form.title = ''
  form.content = ''
  form.isPinned = false
  form.tagIds = []
})

async function onSave(): Promise<void> {
  if (!form.title.trim()) {
    store.error = '请填写标题'
    return
  }
  saving.value = true
  const ok = await store.save({
    title: form.title.trim(),
    content: form.content,
    isPinned: form.isPinned,
    tagIds: form.tagIds,
  } as NoteCreatePayload)
  saving.value = false
  if (!ok && !store.error) store.error = '保存失败'
}

function onDelete(): void {
  if (editingId.value !== null) void store.remove(editingId.value)
}

function toggleFullscreen(): void {
  fullscreen.value = !fullscreen.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="editorOpen && !fullscreen"
        class="note-drawer__scrim"
        :style="{ left: drawerLeft }"
        @click="store.closeEditor()"
      />
    </Transition>
    <Transition name="drawer">
      <aside
        v-if="editorOpen"
        class="note-drawer"
        :class="{ 'is-fullscreen': fullscreen }"
        :style="{ left: drawerLeft }"
      >
        <header class="note-drawer__head">
          <h2 class="note-drawer__title">{{ isEdit ? '编辑笔记' : '新建笔记' }}</h2>
          <div class="note-drawer__head-actions">
            <button class="note-drawer__icon" :title="fullscreen ? '退出全屏' : '全屏编写'" @click="toggleFullscreen">
              <AppIcon :name="fullscreen ? 'contract' : 'expand'" :size="18" />
            </button>
            <button class="note-drawer__icon" title="关闭" @click="store.closeEditor()">
              <AppIcon name="close" :size="18" />
            </button>
          </div>
        </header>

        <div class="note-drawer__body">
          <BaseInput v-model="form.title" label="标题" placeholder="给笔记起个标题" />
          <label class="note-drawer__field">
            <span class="note-drawer__label">正文</span>
            <textarea
              v-model="form.content"
              class="note-drawer__textarea"
              placeholder="开始写下你的想法…"
              rows="10"
            />
          </label>
          <label class="note-drawer__pin">
            <input v-model="form.isPinned" type="checkbox" />
            <AppIcon name="pin" :size="15" />
            <span>置顶此笔记</span>
          </label>
          <div class="note-drawer__field">
            <span class="note-drawer__label">标签</span>
            <TagSelect :tags="tags" v-model="form.tagIds" />
          </div>
          <p v-if="error" class="note-drawer__error">{{ error }}</p>
        </div>

        <footer class="note-drawer__foot">
          <BaseButton
            v-if="isEdit"
            variant="ghost"
            class="note-drawer__delete"
            :disabled="saving"
            @click="onDelete"
          >
            <AppIcon name="trash" :size="15" />
            <span>删除</span>
          </BaseButton>
          <div class="note-drawer__foot-right">
            <BaseButton variant="ghost" :disabled="saving" @click="store.closeEditor()">取消</BaseButton>
            <BaseButton variant="primary" :loading="saving" @click="onSave">保存</BaseButton>
          </div>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.note-drawer__scrim {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  background: rgba(30, 22, 14, 0.32);
  z-index: 78;
}
.note-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  width: min(640px, 100%);
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-left: 1px solid var(--border-default);
  box-shadow: var(--shadow-floating);
  z-index: 80;
}
.note-drawer.is-fullscreen {
  width: 100%;
  border-left: none;
}
.note-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-default);
}
.note-drawer__title {
  font-size: 18px;
}
.note-drawer__head-actions {
  display: flex;
  gap: 6px;
}
.note-drawer__icon {
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
.note-drawer__icon:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.note-drawer__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
}
.note-drawer__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.note-drawer__label {
  font-size: 13px;
  color: var(--text-secondary);
}
.note-drawer__textarea {
  width: 100%;
  resize: vertical;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.note-drawer__textarea:focus {
  border-color: var(--accent-primary);
}
.note-drawer__pin {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}
.note-drawer__error {
  font-size: 13px;
  color: var(--danger);
}
.note-drawer__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-default);
}
.note-drawer__foot-right {
  display: flex;
  gap: var(--space-3);
  margin-left: auto;
}
.note-drawer__delete {
  color: var(--danger);
}

/* 抽屉滑入动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform var(--duration-base) var(--ease-standard);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

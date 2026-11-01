import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as notesApi from '../api/notes.api'
import type { Note, NoteCreatePayload, NoteUpdatePayload, Tag } from '../types/notes.types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const selectedTagId = ref<number | null>(null)
  const tags = ref<Tag[]>([])

  // 编辑器状态
  const editorOpen = ref(false)
  const editingId = ref<number | null>(null)
  const fullscreen = ref(false)

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  async function init(): Promise<void> {
    await Promise.all([loadTags(), loadNotes()])
  }

  async function loadTags(): Promise<void> {
    try {
      tags.value = await notesApi.fetchTags()
    } catch {
      tags.value = []
    }
  }

  async function loadNotes(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { items, total: t } = await notesApi.fetchNotes({
        limit: 100,
        offset: 0,
        search: search.value || undefined,
        tagId: selectedTagId.value ?? undefined,
      })
      notes.value = items
      total.value = t
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '加载笔记失败'
    } finally {
      loading.value = false
    }
  }

  function setSearch(v: string): void {
    search.value = v
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => void loadNotes(), 300)
  }

  function setTagFilter(id: number | null): void {
    selectedTagId.value = id
    void loadNotes()
  }

  function openCreate(): void {
    editingId.value = null
    fullscreen.value = false
    editorOpen.value = true
  }

  function openEdit(id: number): void {
    editingId.value = id
    fullscreen.value = false
    editorOpen.value = true
  }

  function closeEditor(): void {
    editorOpen.value = false
    editingId.value = null
  }

  async function save(payload: NoteCreatePayload | NoteUpdatePayload): Promise<boolean> {
    loading.value = true
    try {
      if (editingId.value === null) {
        await notesApi.createNote(payload as NoteCreatePayload)
      } else {
        await notesApi.updateNote(editingId.value, payload as NoteUpdatePayload)
      }
      await loadNotes()
      closeEditor()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '保存失败'
      return false
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number): Promise<void> {
    loading.value = true
    try {
      await notesApi.deleteNote(id)
      notes.value = notes.value.filter((n) => n.id !== id)
      total.value = Math.max(0, total.value - 1)
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '删除失败'
    } finally {
      loading.value = false
    }
  }

  async function togglePin(id: number): Promise<void> {
    try {
      const updated = await notesApi.togglePin(id)
      const idx = notes.value.findIndex((n) => n.id === id)
      if (idx >= 0) notes.value[idx] = updated
    } catch {
      /* 忽略单次置顶失败 */
    }
  }

  return {
    notes,
    total,
    loading,
    error,
    search,
    selectedTagId,
    tags,
    editorOpen,
    editingId,
    fullscreen,
    init,
    loadNotes,
    setSearch,
    setTagFilter,
    openCreate,
    openEdit,
    closeEditor,
    save,
    remove,
    togglePin,
  }
})

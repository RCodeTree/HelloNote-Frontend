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

  // 编辑器页状态
  const current = ref<Note | null>(null)
  const currentLoading = ref(false)
  const saving = ref(false)

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

  /** 加载单篇笔记（供编辑器页使用） */
  async function loadNote(id: number): Promise<Note | null> {
    currentLoading.value = true
    error.value = null
    try {
      const note = await notesApi.fetchNote(id)
      current.value = note
      return note
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '笔记不存在或已删除'
      current.value = null
      return null
    } finally {
      currentLoading.value = false
    }
  }

  function clearCurrent(): void {
    current.value = null
    error.value = null
  }

  /** 新建笔记，返回创建结果 */
  async function submitCreate(payload: NoteCreatePayload): Promise<Note | null> {
    saving.value = true
    error.value = null
    try {
      const note = await notesApi.createNote(payload)
      current.value = note
      total.value += 1
      await loadNotes()
      return note
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '保存失败'
      return null
    } finally {
      saving.value = false
    }
  }

  /** 更新笔记，返回更新结果 */
  async function submitUpdate(id: number, payload: NoteUpdatePayload): Promise<Note | null> {
    saving.value = true
    error.value = null
    try {
      const note = await notesApi.updateNote(id, payload)
      current.value = note
      await loadNotes()
      return note
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '保存失败'
      return null
    } finally {
      saving.value = false
    }
  }

  async function remove(id: number): Promise<boolean> {
    loading.value = true
    try {
      await notesApi.deleteNote(id)
      notes.value = notes.value.filter((n) => n.id !== id)
      total.value = Math.max(0, total.value - 1)
      if (current.value?.id === id) current.value = null
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '删除失败'
      return false
    } finally {
      loading.value = false
    }
  }

  async function togglePin(id: number): Promise<void> {
    try {
      const updated = await notesApi.togglePin(id)
      const idx = notes.value.findIndex((n) => n.id === id)
      if (idx >= 0) notes.value[idx] = updated
      if (current.value?.id === id) current.value = updated
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
    current,
    currentLoading,
    saving,
    init,
    loadNotes,
    loadNote,
    clearCurrent,
    setSearch,
    setTagFilter,
    submitCreate,
    submitUpdate,
    remove,
    togglePin,
  }
})

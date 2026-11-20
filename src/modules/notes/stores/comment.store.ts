import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as commentApi from '../api/comment.api'
import * as likeApi from '../api/like.api'
import type { Comment, CommentCreatePayload, LikeState } from '../types/comments.types'

export const useCommentStore = defineStore('noteComments', () => {
  // 按 noteId 缓存评论与点赞状态，切换笔记互不干扰。
  const commentsByNote = ref<Record<number, Comment[]>>({})
  const likeByNote = ref<Record<number, LikeState>>({})
  const loadingByNote = ref<Record<number, boolean>>({})
  const likingByNote = ref<Record<number, boolean>>({})
  const error = ref<string | null>(null)

  async function load(noteId: number): Promise<void> {
    loadingByNote.value = { ...loadingByNote.value, [noteId]: true }
    error.value = null
    try {
      commentsByNote.value = { ...commentsByNote.value, [noteId]: await commentApi.fetchComments(noteId) }
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '加载评论失败'
    } finally {
      loadingByNote.value = { ...loadingByNote.value, [noteId]: false }
    }
  }

  async function add(noteId: number, payload: CommentCreatePayload): Promise<Comment | null> {
    error.value = null
    try {
      const created = await commentApi.createComment(noteId, payload)
      commentsByNote.value = {
        ...commentsByNote.value,
        [noteId]: [...(commentsByNote.value[noteId] ?? []), created],
      }
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '发送失败'
      return null
    }
  }

  async function remove(noteId: number, commentId: number): Promise<boolean> {
    error.value = null
    try {
      await commentApi.removeComment(commentId)
      commentsByNote.value = {
        ...commentsByNote.value,
        [noteId]: (commentsByNote.value[noteId] ?? []).filter((c) => c.id !== commentId),
      }
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '删除失败'
      return false
    }
  }

  async function loadLike(noteId: number): Promise<void> {
    try {
      likeByNote.value = { ...likeByNote.value, [noteId]: await likeApi.fetchLikeState(noteId) }
    } catch {
      /* 点赞状态加载失败时保持默认值，不阻塞评论区 */
    }
  }

  async function toggleLike(noteId: number): Promise<void> {
    if (likingByNote.value[noteId]) return
    likingByNote.value = { ...likingByNote.value, [noteId]: true }
    try {
      likeByNote.value = { ...likeByNote.value, [noteId]: await likeApi.toggleLike(noteId) }
    } catch (e: any) {
      error.value = e?.response?.data?.detail || '操作失败'
    } finally {
      likingByNote.value = { ...likingByNote.value, [noteId]: false }
    }
  }

  return {
    commentsByNote,
    likeByNote,
    loadingByNote,
    likingByNote,
    error,
    load,
    add,
    remove,
    loadLike,
    toggleLike,
  }
})

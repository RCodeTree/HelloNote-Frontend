import http from '@/services/http/client'
import type { Comment, CommentCreatePayload } from '../types/comments.types'

// 后端 comments router 前缀为 /comments，评论挂在 /notes/{id}/comments
// （见 endpoints/comments.py），完整路径加 /api/v1 baseURL。
const commentsOf = (noteId: number) => `/comments/notes/${noteId}/comments`

// 后端返回 snake_case，这里映射为前端 camelCase 领域模型。
interface RawComment {
  id: number
  note_id: number
  user_id: number
  author_name: string | null
  author_avatar: string | null
  parent_id: number | null
  content: string
  created_at: string
}

function mapComment(r: RawComment): Comment {
  return {
    id: r.id,
    noteId: r.note_id,
    userId: r.user_id,
    authorName: r.author_name ?? '匿名',
    authorAvatar: r.author_avatar ?? null,
    parentId: r.parent_id ?? null,
    content: r.content,
    createdAt: r.created_at,
  }
}

export async function fetchComments(noteId: number): Promise<Comment[]> {
  const { data } = await http.get<RawComment[]>(commentsOf(noteId))
  return (data ?? []).map(mapComment)
}

export async function createComment(noteId: number, payload: CommentCreatePayload): Promise<Comment> {
  const body: Record<string, unknown> = { content: payload.content }
  if (payload.parentId !== undefined && payload.parentId !== null) {
    body.parent_id = payload.parentId
  }
  const { data } = await http.post<RawComment>(commentsOf(noteId), body)
  return mapComment(data)
}

export async function removeComment(commentId: number): Promise<void> {
  await http.delete(`/comments/comments/${commentId}`)
}

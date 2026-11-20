import http from '@/services/http/client'
import type { LikeState } from '../types/comments.types'

// 后端返回 snake_case，这里映射为前端 camelCase 领域模型。
interface RawLikeState {
  like_count: number
  liked_by_me: boolean
}

function mapLikeState(r: RawLikeState): LikeState {
  return {
    likeCount: r.like_count ?? 0,
    likedByMe: !!r.liked_by_me,
  }
}

export async function fetchLikeState(noteId: number): Promise<LikeState> {
  const { data } = await http.get<RawLikeState>(`/comments/notes/${noteId}/like`)
  return mapLikeState(data)
}

export async function toggleLike(noteId: number): Promise<LikeState> {
  const { data } = await http.post<RawLikeState>(`/comments/notes/${noteId}/like`)
  return mapLikeState(data)
}

// 评论 / 点赞领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/notes/api 下的 comment.api.ts / like.api.ts 映射。
export interface Comment {
  id: number
  noteId: number
  userId: number
  authorName: string
  authorAvatar: string | null
  parentId: number | null
  content: string
  createdAt: string
}

export interface CommentCreatePayload {
  content: string
  parentId?: number | null
}

export interface LikeState {
  likeCount: number
  likedByMe: boolean
}

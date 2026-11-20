// 笔友领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/friends/api/friends.api.ts 映射。
export interface Friend {
  /** 好友关系 id（用于接受 / 删除） */
  id: number
  /** 对方用户 id（用于发起会话） */
  userId: number
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string
  status: string
  /** 当前用户是否为申请发起方：true 发出的申请，false 收到的申请 */
  isRequester: boolean
}

export interface FriendBrief {
  /** 用户 id（用于发起会话） */
  id: number
  username: string
  displayName: string
  avatarUrl: string | null
}

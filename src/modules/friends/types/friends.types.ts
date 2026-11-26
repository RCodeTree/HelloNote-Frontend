// 笔友领域模型（前端使用 camelCase）。
// 后端返回 snake_case，由 modules/friends/api/friends.api.ts 映射。

export type FriendPrivacy = 'all' | 'friends' | 'hidden'
export type FriendCloseness = 'acquaintance' | 'friend' | 'close' | 'intimate'

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
  /** 备注（优先展示，空则回退 displayName） */
  note: string
  /** 隐私范围 */
  privacy: FriendPrivacy
  /** 关系类别（自由填写，如 笔友/网友/同好） */
  relationType: string
  /** 亲密程度 */
  closeness: FriendCloseness
  /** 未读消息数 */
  unreadCount: number
  /** 是否置顶 */
  isPinned: boolean
  /** 好友申请留言（收到的申请可查看对方填写的内容） */
  requestMessage: string
}

/** 好友设置载荷（前端 camelCase，api 层映射为 snake_case） */
export interface FriendSettings {
  note?: string
  privacy?: FriendPrivacy
  relationType?: string
  closeness?: FriendCloseness
  isPinned?: boolean
}

export interface FriendBrief {
  /** 用户 id（用于发起会话） */
  id: number
  username: string
  displayName: string
  avatarUrl: string | null
}

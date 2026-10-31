import type { DashboardStats, NoteSummary, TagInfo } from '../types/dashboard.types'

// 后端原始响应结构（snake_case）。
// 接入真实后端后，删除 mock，改用 services/http/client.ts 发起请求，
// 并保留下面的映射函数将 snake_case 转为前端 camelCase 模型。
interface RawTag {
  id: number
  name: string
  color: string | null
}
interface RawNote {
  id: number
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  tags: RawTag[]
}
interface RawStats {
  total_notes: number
  pinned_notes: number
  total_tags: number
  words_written: number
}

const MOCK_TAGS: RawTag[] = [
  { id: 1, name: '灵感', color: '#9A8052' },
  { id: 2, name: '工作', color: '#77735D' },
  { id: 3, name: '读书', color: '#754747' },
  { id: 4, name: '旅行', color: '#5B7C7C' },
  { id: 5, name: '待办', color: '#9A8052' },
]

const MOCK_NOTES: RawNote[] = [
  {
    id: 1,
    title: '关于专注的随想',
    content: '专注不是一次性的决定，而是一种被反复找回的状态。\n\n当环境足够安静，思绪才有落点。',
    is_pinned: true,
    created_at: '2026-10-20T09:12:00',
    updated_at: '2026-10-28T14:30:00',
    tags: [MOCK_TAGS[0], MOCK_TAGS[1]],
  },
  {
    id: 2,
    title: '本周阅读清单',
    content: '《安静》— 关于注意力；《卡片笔记写作法》— 关于知识沉淀。',
    is_pinned: true,
    created_at: '2026-10-22T20:05:00',
    updated_at: '2026-10-27T08:10:00',
    tags: [MOCK_TAGS[2]],
  },
  {
    id: 3,
    title: '京都旅行碎片',
    content: '清晨的伏见稻荷，红与绿之间，时间慢了下来。',
    is_pinned: false,
    created_at: '2026-10-18T11:40:00',
    updated_at: '2026-10-25T19:22:00',
    tags: [MOCK_TAGS[3]],
  },
  {
    id: 4,
    title: '产品评审纪要',
    content: '讨论了面板的信息密度，决定先保持克制，后续再做个性化。',
    is_pinned: false,
    created_at: '2026-10-15T15:00:00',
    updated_at: '2026-10-24T10:00:00',
    tags: [MOCK_TAGS[1]],
  },
  {
    id: 5,
    title: '待办：整理读书笔记',
    content: '把零散的标注汇总成一篇可检索的索引。',
    is_pinned: false,
    created_at: '2026-10-12T13:30:00',
    updated_at: '2026-10-23T21:15:00',
    tags: [MOCK_TAGS[4], MOCK_TAGS[2]],
  },
  {
    id: 6,
    title: '一句喜欢的诗',
    content: '我们终将相遇，在没有喧嚣的地方。',
    is_pinned: false,
    created_at: '2026-10-10T22:00:00',
    updated_at: '2026-10-21T07:45:00',
    tags: [MOCK_TAGS[0]],
  },
]

const MOCK_STATS: RawStats = {
  total_notes: 24,
  pinned_notes: 3,
  total_tags: 5,
  words_written: 18240,
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// 将后端原始笔记（snake_case）映射为前端领域模型（camelCase）。
function mapNote(raw: RawNote): NoteSummary {
  return {
    id: raw.id,
    title: raw.title,
    excerpt: raw.content.replace(/\s+/g, ' ').trim().slice(0, 120),
    isPinned: raw.is_pinned,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    tags: raw.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay(800)
  return {
    totalNotes: MOCK_STATS.total_notes,
    pinnedNotes: MOCK_STATS.pinned_notes,
    totalTags: MOCK_STATS.total_tags,
    wordsWritten: MOCK_STATS.words_written,
  }
}

export async function fetchRecentNotes(limit = 6): Promise<NoteSummary[]> {
  await delay(900)
  return MOCK_NOTES.slice(0, limit).map(mapNote)
}

export async function fetchTags(): Promise<TagInfo[]> {
  await delay(700)
  return MOCK_TAGS.map((t) => ({ id: t.id, name: t.name, color: t.color }))
}

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import PublicNoteCard from '../components/PublicNoteCard.vue'
import { fetchPublicNotes, fetchTags } from '../api/notes.api'
import type { PublicNote, Tag } from '../types/notes.types'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const notes = ref<PublicNote[]>([])
const total = ref(0)
const tags = ref<Tag[]>([])
const loading = ref(false)
const search = ref('')
const activeTag = ref<number | null>(null)
const sort = ref<'hot' | 'name' | 'time'>('hot')
const page = ref(0)
const pageSize = 12

// 轮播：top 笔记与榜单共用同一批高热数据（列表的第一屏）
const carouselIndex = ref(0)
const topNotes = computed(() => notes.value.slice(0, Math.min(5, notes.value.length)))
const currentTop = computed(() => topNotes.value[carouselIndex.value] ?? null)

let searchTimer: number | undefined
let carouselTimer: number | undefined

const sortOptions: { value: 'hot' | 'name' | 'time'; label: string }[] = [
  { value: 'hot', label: '热度' },
  { value: 'name', label: '名称' },
  { value: 'time', label: '时间' },
]

async function load(reset = true): Promise<void> {
  if (reset) page.value = 0
  loading.value = true
  try {
    const res = await fetchPublicNotes({
      limit: pageSize,
      offset: reset ? 0 : notes.value.length,
      search: search.value.trim() || undefined,
      tagId: activeTag.value ?? undefined,
      sort: sort.value,
    })
    notes.value = reset ? res.items : [...notes.value, ...res.items]
    total.value = res.total
    carouselIndex.value = 0
    startCarousel()
  } catch {
    toast.error('加载公开笔记失败')
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => void load(true), 300)
})

function selectTag(id: number | null): void {
  activeTag.value = id
  void load(true)
}

function changeSort(): void {
  void load(true)
}

function moveCarousel(delta: number): void {
  if (!topNotes.value.length) return
  carouselIndex.value = (carouselIndex.value + delta + topNotes.value.length) % topNotes.value.length
}

function startCarousel(): void {
  if (carouselTimer) clearInterval(carouselTimer)
  if (topNotes.value.length < 2) return
  carouselTimer = window.setInterval(() => moveCarousel(1), 5000)
}

watch(sort, () => void changeSort())

onMounted(async () => {
  await load(true)
  try {
    tags.value = await fetchTags()
  } catch {
    tags.value = []
  }
})

function cleanup(): void {
  if (searchTimer) clearTimeout(searchTimer)
  if (carouselTimer) clearInterval(carouselTimer)
}
onBeforeUnmount(cleanup)
</script>

<template>
  <div class="square">
    <header class="square__head">
      <div>
        <h1 class="square__title">笔记广场</h1>
        <p class="square__sub">发现平台上笔友们公开的笔记 · 共 {{ total }} 篇</p>
      </div>
    </header>

    <section class="square__filters">
      <BaseInput v-model="search" placeholder="搜索标题或内容" class="square__search" />
      <label class="square__sort">
        <span>排序</span>
        <select v-model="sort">
          <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
    </section>
    <div class="square__chips">
      <button type="button" class="chip" :class="{ 'is-active': activeTag === null }" @click="selectTag(null)">
        全部
      </button>
      <button
        v-for="t in tags"
        :key="t.id"
        type="button"
        class="chip"
        :class="{ 'is-active': activeTag === t.id }"
        @click="selectTag(t.id)"
      >
        {{ t.name }}
      </button>
    </div>

    <!-- 热门轮播：与下方榜单共用同一批高热笔记 -->
    <section v-if="topNotes.length" class="square__carousel">
      <div class="square__carousel-head">
        <h2><AppIcon name="flame" :size="16" /> 热门推荐</h2>
        <div class="square__carousel-nav">
          <button type="button" aria-label="上一个" @click="moveCarousel(-1)">
            <AppIcon name="chevron-left" :size="16" />
          </button>
          <span>{{ carouselIndex + 1 }} / {{ topNotes.length }}</span>
          <button type="button" aria-label="下一个" @click="moveCarousel(1)">
            <AppIcon name="chevron-right" :size="16" />
          </button>
        </div>
      </div>
      <div class="square__carousel-stage">
        <Transition name="slide" mode="out-in">
          <PublicNoteCard
            v-if="currentTop"
            :key="currentTop.id"
            :note="currentTop"
            featured
            class="square__carousel-card"
          />
        </Transition>
      </div>
      <div class="square__dots">
        <button
          v-for="(_, i) in topNotes"
          :key="i"
          type="button"
          :class="{ 'is-active': i === carouselIndex }"
          :aria-label="`第 ${i + 1} 篇`"
          @click="carouselIndex = i"
        />
      </div>
    </section>

    <section class="square__list">
      <h2 class="square__list-title">全部公开笔记</h2>
      <div v-if="loading && !notes.length" class="square__loading">加载中…</div>
      <EmptyState v-else-if="!notes.length" title="暂无公开笔记" />
      <div v-else class="square__grid">
        <PublicNoteCard v-for="n in notes" :key="n.id" :note="n" />
      </div>
      <div v-if="notes.length < total" class="square__more">
        <button type="button" :disabled="loading" @click="load(false)">
          {{ loading ? '加载中…' : '加载更多' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.square { display: flex; flex-direction: column; gap: var(--space-5); max-width: 1100px; margin: 0 auto; }
.square__head { display: flex; align-items: center; justify-content: space-between; }
.square__title { margin: 0; font-size: 24px; color: var(--text-primary); }
.square__sub { margin: 4px 0 0; font-size: 13px; color: var(--text-muted); }
.square__filters { display: flex; gap: var(--space-3); align-items: flex-end; flex-wrap: wrap; }
.square__search { flex: 1; min-width: 220px; }
.square__sort { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; color: var(--text-secondary); }
.square__sort select { padding: 8px 12px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-primary); }
.square__chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.chip { padding: 5px 12px; border: 1px solid var(--border-default); border-radius: var(--radius-full); background: var(--bg-card); color: var(--text-secondary); font-size: 12px; cursor: pointer; }
.chip.is-active { border-color: var(--accent-primary); color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
.square__carousel { padding: var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-lg); background: var(--bg-card); }
.square__carousel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
.square__carousel-head h2 { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 16px; color: var(--text-primary); }
.square__carousel-head h2 :deep(.app-icon) { color: var(--accent-danger); }
.square__carousel-nav { display: flex; align-items: center; gap: var(--space-2); font-size: 12px; color: var(--text-muted); }
.square__carousel-nav button { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); background: transparent; color: var(--text-secondary); cursor: pointer; }
.square__carousel-stage { min-height: 170px; }
.square__carousel-card { min-height: 160px; }
.square__dots { display: flex; justify-content: center; gap: 6px; margin-top: var(--space-3); }
.square__dots button { width: 7px; height: 7px; padding: 0; border: none; border-radius: 50%; background: var(--border-default); cursor: pointer; }
.square__dots button.is-active { background: var(--accent-primary); }
.square__list-title { margin: 0; font-size: 16px; color: var(--text-primary); }
.square__loading { padding: var(--space-6); text-align: center; color: var(--text-muted); }
.square__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-3); }
.square__more { display: flex; justify-content: center; }
.square__more button { padding: 8px 18px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; }
.slide-enter-active, .slide-leave-active { transition: opacity 240ms var(--ease-standard), transform 240ms var(--ease-standard); }
.slide-enter-from { opacity: 0; transform: translateX(16px); }
.slide-leave-to { opacity: 0; transform: translateX(-16px); }
@media (prefers-reduced-motion: reduce) { .slide-enter-active, .slide-leave-active { transition: none; } }
</style>

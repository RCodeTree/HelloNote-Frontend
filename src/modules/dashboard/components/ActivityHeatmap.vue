<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { ActivityDay } from '../types/dashboard.types'
import {
  activityLevel,
  formatDateCN,
  formatDuration,
  fromDateKey,
  mondayIndex,
} from '../utils/date'

const props = defineProps<{
  days: ActivityDay[]
  loading: boolean
  totalEvents?: number
  activeDays?: number
}>()

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const scrollRef = ref<HTMLElement | null>(null)

// 连续日期序列按「周」对齐：首日之前补空占位，末尾补齐整周，
// 使其能直接用 grid-auto-flow: column + 7 行铺成 GitHub 风格网格。
const cells = computed<(ActivityDay | null)[]>(() => {
  const arr = props.days
  if (!arr.length) return []
  const lead = mondayIndex(fromDateKey(arr[0]!.date))
  const out: (ActivityDay | null)[] = Array.from({ length: lead }, () => null)
  for (const d of arr) out.push(d)
  const tail = (7 - (out.length % 7)) % 7
  for (let i = 0; i < tail; i++) out.push(null)
  return out
})

const columns = computed(() => Math.ceil(cells.value.length / 7))

// 月份标签：某列首次出现新月份时，在该列顶部标注
const monthLabels = computed(() => {
  const map = new Map<number, string>()
  let lastMonth = -1
  for (let c = 0; c < columns.value; c++) {
    let month = -1
    for (let r = 0; r < 7; r++) {
      const day = cells.value[c * 7 + r]
      if (day) {
        month = fromDateKey(day.date).getMonth()
        break
      }
    }
    if (month !== -1 && month !== lastMonth) {
      map.set(c, `${month + 1}月`)
      lastMonth = month
    }
  }
  return map
})

// 跟随鼠标的悬浮提示（Teleport 到 body，避免被滚动容器裁切）
interface TipState {
  visible: boolean
  x: number
  y: number
  day: ActivityDay | null
}
const tip = ref<TipState>({ visible: false, x: 0, y: 0, day: null })

function showTip(e: MouseEvent, day: ActivityDay): void {
  tip.value = { visible: true, x: e.clientX, y: e.clientY, day }
}
function hideTip(): void {
  tip.value.visible = false
}

const tipStyle = computed(() => ({
  left: `${Math.min(tip.value.x + 12, window.innerWidth - 190)}px`,
  top: `${Math.max(tip.value.y - 12, 8)}px`,
}))

function levelOf(day: ActivityDay): number {
  return activityLevel(day.count)
}

function scrollToLatest(): void {
  const el = scrollRef.value
  if (el) el.scrollLeft = el.scrollWidth
}

onMounted(() => void nextTick(scrollToLatest))
watch(
  () => props.days,
  () => void nextTick(scrollToLatest),
)
</script>

<template>
  <section class="panel heatmap">
    <header class="panel__head">
      <div class="heatmap__heading">
        <span class="heatmap__heading-icon"><AppIcon name="activity" :size="17" /></span>
        <h2 class="panel__title">活跃度</h2>
      </div>
      <div class="heatmap__metrics">
        <span class="heatmap__metric">
          <strong class="font-mono">{{ totalEvents ?? 0 }}</strong> 次操作
        </span>
        <span class="heatmap__metric">
          <strong class="font-mono">{{ activeDays ?? 0 }}</strong> 活跃天
        </span>
      </div>
    </header>

    <div v-if="loading" class="heatmap__skeleton">
      <div v-for="i in 53 * 7" :key="i" class="heatmap__skeleton-cell" />
    </div>

    <div v-else-if="cells.length" class="heatmap__scroll" ref="scrollRef">
      <div class="heatmap__inner" :style="{ '--hm-cols': columns }">
        <!-- 月份标签行 -->
        <div class="heatmap__months">
          <span
            v-for="c in columns"
            :key="c"
            class="heatmap__month"
          >{{ monthLabels.get(c - 1) ?? '' }}</span>
        </div>

        <div class="heatmap__body">
          <!-- 星期标签列（隔行显示 一/三/五） -->
          <div class="heatmap__weekdays">
            <span v-for="(w, i) in WEEK_LABELS" :key="w" class="heatmap__weekday">
              {{ i % 2 === 0 ? w : '' }}
            </span>
          </div>

          <!-- 主网格 -->
          <div class="heatmap__grid">
            <template v-for="(day, idx) in cells" :key="idx">
              <span v-if="!day" class="heatmap__cell is-empty" />
              <span
                v-else
                class="heatmap__cell"
                :class="`is-l${levelOf(day)}`"
                @mouseenter="showTip($event, day)"
                @mousemove="showTip($event, day)"
                @mouseleave="hideTip"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="heatmap__empty">暂无活跃记录</div>

    <footer class="heatmap__legend">
      <span class="heatmap__legend-label">少</span>
      <span v-for="l in 5" :key="l" class="heatmap__cell is-static" :class="`is-l${l - 1}`" />
      <span class="heatmap__legend-label">多</span>
    </footer>

    <!-- 悬浮详情 -->
    <Teleport to="body">
      <div v-if="tip.visible && tip.day" class="heatmap-tip" :style="tipStyle">
        <p class="heatmap-tip__date">{{ formatDateCN(tip.day.date) }}</p>
        <p class="heatmap-tip__count">
          <strong class="font-mono">{{ tip.day.count }}</strong> 次笔记操作
        </p>
        <p class="heatmap-tip__detail">
          新增 {{ tip.day.created }} · 修改 {{ tip.day.updated }} · 删除 {{ tip.day.deleted }}
        </p>
        <p v-if="tip.day.activeSeconds > 0" class="heatmap-tip__time">
          活跃 {{ formatDuration(tip.day.activeSeconds) }}
        </p>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.panel {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.panel__title {
  font-size: 18px;
}
.heatmap__heading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.heatmap__heading-icon {
  color: var(--accent-primary);
  display: inline-flex;
}
.heatmap__metrics {
  display: inline-flex;
  gap: var(--space-4);
  font-size: 12px;
  color: var(--text-muted);
}
.heatmap__metric strong {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.heatmap__scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: var(--space-2);
  scrollbar-width: thin;
}
.heatmap__scroll::-webkit-scrollbar {
  height: 6px;
}
.heatmap__scroll::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: var(--radius-full);
}
.heatmap__inner {
  --hm-cell: 13px;
  --hm-gap: 3px;
  width: max-content;
  display: flex;
  flex-direction: column;
  gap: var(--hm-gap);
}
.heatmap__months {
  display: grid;
  grid-template-columns: 22px repeat(var(--hm-cols), var(--hm-cell));
  gap: var(--hm-gap);
  height: 14px;
}
.heatmap__month {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  line-height: 14px;
}
.heatmap__body {
  display: flex;
  gap: var(--hm-gap);
}
.heatmap__weekdays {
  display: grid;
  grid-template-rows: repeat(7, var(--hm-cell));
  gap: var(--hm-gap);
  width: 22px;
  flex-shrink: 0;
}
.heatmap__weekday {
  font-size: 10px;
  color: var(--text-muted);
  line-height: var(--hm-cell);
  text-align: left;
}
.heatmap__grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, var(--hm-cell));
  grid-auto-columns: var(--hm-cell);
  gap: var(--hm-gap);
}
.heatmap__cell {
  width: var(--hm-cell);
  height: var(--hm-cell);
  border-radius: 3px;
  background: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--text-muted) 12%, transparent);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.heatmap__cell:not(.is-empty):not(.is-static):hover {
  transform: scale(1.25);
  outline: 1px solid var(--accent-primary);
  position: relative;
  z-index: 1;
}
.heatmap__cell.is-empty {
  background: transparent;
  border-color: transparent;
}
/* 5 级色阶：基于主题强调色混合，自动适配浅/深主题 */
.heatmap__cell.is-l0 {
  background: var(--bg-secondary);
}
.heatmap__cell.is-l1 {
  background: color-mix(in srgb, var(--accent-primary) 28%, var(--bg-secondary));
  border-color: transparent;
}
.heatmap__cell.is-l2 {
  background: color-mix(in srgb, var(--accent-primary) 50%, var(--bg-secondary));
  border-color: transparent;
}
.heatmap__cell.is-l3 {
  background: color-mix(in srgb, var(--accent-primary) 74%, var(--bg-secondary));
  border-color: transparent;
}
.heatmap__cell.is-l4 {
  background: var(--accent-primary);
  border-color: transparent;
}

.heatmap__legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  flex-wrap: wrap;
}
.heatmap__legend-label {
  margin: 0 2px;
}
.heatmap__cell.is-static {
  width: 12px;
  height: 12px;
  cursor: default;
}
.heatmap__empty {
  padding: var(--space-8) 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
.heatmap__skeleton {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 13px);
  gap: 3px;
  overflow: hidden;
  height: 109px;
}
.heatmap__skeleton-cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: var(--bg-secondary);
  animation: hm-pulse 1.4s ease-in-out infinite;
}
@keyframes hm-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>

<!-- 非 scoped：tooltip 被 Teleport 到 body，需要全局样式 -->
<style>
.heatmap-tip {
  position: fixed;
  z-index: 3000;
  pointer-events: none;
  min-width: 168px;
  max-width: 210px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-floating);
  color: var(--text-primary);
  font-family: var(--font-body);
}
.heatmap-tip__date {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}
.heatmap-tip__count {
  font-size: 13px;
  color: var(--text-secondary);
}
.heatmap-tip__count strong {
  font-size: 16px;
  color: var(--accent-primary);
  font-weight: 700;
}
.heatmap-tip__detail {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}
.heatmap-tip__time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { ActivityDay } from '../types/dashboard.types'
import {
  activityLevel,
  buildActivityMap,
  formatDateCN,
  formatDuration,
  fromDateKey,
  mondayIndex,
  toDateKey,
} from '../utils/date'

const props = defineProps<{
  days: ActivityDay[]
  loading: boolean
}>()

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const activityMap = computed(() => buildActivityMap(props.days))
const endDate = computed(() => (props.days.length ? props.days[props.days.length - 1]!.date : toDateKey(new Date())))
const todayKey = toDateKey(new Date())

// 当前显示的月份（1 号）。数据异步到达后，首次同步到数据末日所在月。
const initialized = ref(false)
const view = ref<Date>(new Date())

watch(
  () => props.days,
  () => {
    if (!initialized.value && props.days.length) {
      const d = fromDateKey(endDate.value)
      view.value = new Date(d.getFullYear(), d.getMonth(), 1)
      initialized.value = true
    }
  },
  { immediate: true },
)

const year = computed(() => view.value.getFullYear())
const month = computed(() => view.value.getMonth())

// 悬浮详情（供切换月份 / 回到本月时清空）
const hovered = ref<ActivityDay | null>(null)

interface CalendarCell {
  key: string
  dayNum: number
  day: ActivityDay | null
  /** 非当月（上/下月补齐）的日期，淡化显示 */
  outside: boolean
}

/** 固定 6 行 × 7 列 = 42 格：补齐上/下月日期，使每月网格饱满、高度稳定、切换不跳动。 */
const grid = computed<CalendarCell[]>(() => {
  const y = year.value
  const m = month.value
  const lead = mondayIndex(new Date(y, m, 1)) // 周一起始，本月 1 号前需补的天数
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()
  const cells: CalendarCell[] = []

  // 上月尾部
  for (let i = lead - 1; i >= 0; i--) {
    const d = prevDays - i
    const key = toDateKey(new Date(y, m - 1, d))
    cells.push({ key, dayNum: d, day: activityMap.value.get(key) ?? null, outside: true })
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(new Date(y, m, d))
    cells.push({ key, dayNum: d, day: activityMap.value.get(key) ?? null, outside: false })
  }
  // 下月头部，补齐到 42 格
  let next = 1
  while (cells.length < 42) {
    const key = toDateKey(new Date(y, m + 1, next))
    cells.push({ key, dayNum: next, day: activityMap.value.get(key) ?? null, outside: true })
    next++
  }
  return cells
})

// 是否可切到下一月（不能超过数据末月=本月，避免查看无意义的未来）
const canNext = computed(() => {
  const last = fromDateKey(endDate.value)
  return year.value < last.getFullYear() || (year.value === last.getFullYear() && month.value < last.getMonth())
})

function shiftMonth(delta: number): void {
  if (delta > 0 && !canNext.value) return
  view.value = new Date(year.value, month.value + delta, 1)
  hovered.value = null
}
function goToday(): void {
  const last = fromDateKey(endDate.value)
  view.value = new Date(last.getFullYear(), last.getMonth(), 1)
  hovered.value = null
}

// 当月汇总
const monthSummary = computed(() => {
  let events = 0
  let seconds = 0
  let active = 0
  const prefix = `${year.value}-${String(month.value + 1).padStart(2, '0')}`
  for (const d of props.days) {
    if (!d.date.startsWith(prefix)) continue
    events += d.count
    seconds += d.activeSeconds
    if (d.count > 0 || d.activeSeconds > 0) active++
  }
  return { events, seconds, active }
})

// 悬浮详情
function onHover(cell: CalendarCell): void {
  hovered.value = cell.outside ? null : cell.day
}

function levelOf(day: ActivityDay | null): number {
  return day ? activityLevel(day.count) : 0
}
</script>

<template>
  <section class="panel calendar">
    <header class="panel__head">
      <div class="calendar__heading">
        <span class="calendar__heading-icon"><AppIcon name="calendar" :size="17" /></span>
        <h2 class="panel__title">日历</h2>
      </div>
      <div class="calendar__nav">
        <button class="calendar__nav-btn" aria-label="上个月" @click="shiftMonth(-1)">
          <AppIcon name="chevron-left" :size="16" />
        </button>
        <span class="calendar__month font-mono">{{ year }}年{{ month + 1 }}月</span>
        <button
          class="calendar__nav-btn"
          aria-label="下个月"
          :disabled="!canNext"
          @click="shiftMonth(1)"
        >
          <AppIcon name="chevron-right" :size="16" />
        </button>
        <button class="calendar__today" @click="goToday">今</button>
      </div>
    </header>

    <div v-if="loading" class="calendar__loading">加载中…</div>
    <template v-else>
      <div class="calendar__weekdays">
        <span v-for="w in WEEK_LABELS" :key="w" class="calendar__weekday">{{ w }}</span>
      </div>
      <div class="calendar__grid" @mouseleave="hovered = null">
        <span
          v-for="(cell, idx) in grid"
          :key="idx"
          class="calendar__cell"
          :class="[
            `is-l${levelOf(cell.day)}`,
            { 'is-today': !cell.outside && cell.key === todayKey, 'is-outside': cell.outside },
          ]"
          @mouseenter="onHover(cell)"
        >
          <span class="calendar__daynum font-mono">{{ cell.dayNum }}</span>
        </span>
      </div>

      <!-- 悬浮/当月详情条 -->
      <div class="calendar__detail">
        <template v-if="hovered">
          <span class="calendar__detail-date">{{ formatDateCN(hovered.date) }}</span>
          <span class="calendar__detail-stat">
            <AppIcon name="trending-up" :size="13" />
            {{ hovered.count }} 次操作
          </span>
          <span class="calendar__detail-sub">
            新增 {{ hovered.created }} · 修改 {{ hovered.updated }} · 删除 {{ hovered.deleted }}
          </span>
          <span v-if="hovered.activeSeconds > 0" class="calendar__detail-sub">
            · 活跃 {{ formatDuration(hovered.activeSeconds) }}
          </span>
        </template>
        <template v-else>
          <span class="calendar__detail-date">{{ month + 1 }}月汇总</span>
          <span class="calendar__detail-stat">
            <AppIcon name="trending-up" :size="13" />
            {{ monthSummary.events }} 次操作
          </span>
          <span class="calendar__detail-sub">
            · 活跃 {{ monthSummary.active }} 天
            <template v-if="monthSummary.seconds > 0">
              · 时长 {{ formatDuration(monthSummary.seconds) }}
            </template>
          </span>
        </template>
      </div>
    </template>
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
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.panel__title {
  font-size: 18px;
}
.calendar__heading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.calendar__heading-icon {
  color: var(--accent-primary);
  display: inline-flex;
}
.calendar__nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.calendar__month {
  min-width: 96px;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}
.calendar__nav-btn,
.calendar__today {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--duration-fast) var(--ease-standard);
}
.calendar__nav-btn:hover:not(:disabled),
.calendar__today:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.calendar__nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.calendar__weekdays,
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}
.calendar__grid {
  /* 卡片被外层拉伸铺满时，6 行均分可用高度；自然高度时每行保持 42px 下限 */
  flex: 1 1 auto;
  min-height: 0;
  grid-template-rows: repeat(6, minmax(42px, 1fr));
}
.calendar__weekday {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
  padding-bottom: 2px;
}
.calendar__cell {
  position: relative;
  width: 100%;
  min-height: 42px; /* 高度交由网格行 1fr 分配，铺满时随之变大 */
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: transform var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.calendar__cell:not(.is-outside):hover {
  transform: translateY(-1px);
  border-color: var(--accent-primary);
}
/* 非当月日期：淡化，弱化视觉权重但保留网格饱满 */
.calendar__cell.is-outside {
  background: transparent;
  border-color: transparent;
  opacity: 0.32;
}
.calendar__cell.is-today {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}
.calendar__daynum {
  font-size: 12px;
  color: var(--text-secondary);
}
/* 日历格子的色阶比热力图更淡，保证日期数字可读 */
.calendar__cell.is-l1 { background: color-mix(in srgb, var(--accent-primary) 16%, var(--bg-secondary)); }
.calendar__cell.is-l2 { background: color-mix(in srgb, var(--accent-primary) 32%, var(--bg-secondary)); }
.calendar__cell.is-l3 { background: color-mix(in srgb, var(--accent-primary) 52%, var(--bg-secondary)); }
.calendar__cell.is-l4 { background: color-mix(in srgb, var(--accent-primary) 74%, var(--bg-secondary)); }
.calendar__cell.is-l3 .calendar__daynum,
.calendar__cell.is-l4 .calendar__daynum {
  color: var(--text-primary);
  font-weight: 600;
}

.calendar__detail {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-default);
  min-height: 22px;
  font-size: 12px;
}
.calendar__detail-date {
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 4px;
}
.calendar__detail-stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--accent-primary);
  font-weight: 600;
}
.calendar__detail-sub {
  color: var(--text-muted);
}
.calendar__loading {
  padding: var(--space-10) 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

/** 当前选中的日期（YYYY-MM-DD），由输入或点击产生；null 表示未选中 */
const selectedKey = ref<string | null>(null)
// 悬浮详情（悬浮优先于选中显示）
const hovered = ref<ActivityDay | null>(null)

interface CalendarCell {
  key: string
  dayNum: number
  day: ActivityDay | null
  /** 非当月（上/下月补齐）的日期，淡化显示 */
  outside: boolean
  /** 晚于数据末日的未来日期，不可选择 */
  future: boolean
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
    cells.push({ key, dayNum: d, day: activityMap.value.get(key) ?? null, outside: true, future: key > endDate.value })
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(new Date(y, m, d))
    cells.push({ key, dayNum: d, day: activityMap.value.get(key) ?? null, outside: false, future: key > endDate.value })
  }
  // 下月头部，补齐到 42 格
  let next = 1
  while (cells.length < 42) {
    const key = toDateKey(new Date(y, m + 1, next))
    cells.push({ key, dayNum: next, day: activityMap.value.get(key) ?? null, outside: true, future: key > endDate.value })
    next++
  }
  return cells
})

// 是否可切到下一月（不能超过数据末月=本月，避免查看无意义的未来）
const canNext = computed(() => {
  const last = fromDateKey(endDate.value)
  return year.value < last.getFullYear() || (year.value === last.getFullYear() && month.value < last.getMonth())
})

/** 选中某日期：视图跳到该日所在月，并高亮该日。 */
function selectDate(key: string): void {
  if (key > endDate.value) return // 未来日期不可选
  const d = fromDateKey(key)
  view.value = new Date(d.getFullYear(), d.getMonth(), 1)
  selectedKey.value = key
  hovered.value = null
  pickerOpen.value = false
  inputError.value = ''
}

function shiftMonth(delta: number): void {
  if (delta > 0 && !canNext.value) return
  view.value = new Date(year.value, month.value + delta, 1)
  hovered.value = null
  selectedKey.value = null // 手动切月视为放弃当前选中
}
function goToday(): void {
  const last = fromDateKey(endDate.value)
  view.value = new Date(last.getFullYear(), last.getMonth(), 1)
  selectedKey.value = endDate.value
  hovered.value = null
  pickerOpen.value = false
}
function clearSelection(): void {
  selectedKey.value = null
  hovered.value = null
  dateInput.value = ''
  inputError.value = ''
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

/** 详情条数据：悬浮日 > 选中日 > 月汇总。选中日无记录时也显示日期与 0 次操作。 */
const detailDay = computed<ActivityDay | null>(() => {
  const key = hovered.value?.date ?? selectedKey.value
  if (!key) return null
  return (
    activityMap.value.get(key) ?? {
      date: key,
      created: 0,
      updated: 0,
      deleted: 0,
      count: 0,
      activeSeconds: 0,
    }
  )
})

function onHover(cell: CalendarCell): void {
  hovered.value = cell.outside ? null : cell.day
}

function levelOf(day: ActivityDay | null): number {
  return day ? activityLevel(day.count) : 0
}

/* ===== 日期选择器面板 ===== */
const pickerOpen = ref(false)
const pickerView = ref<Date>(new Date())
const pickerYear = computed(() => pickerView.value.getFullYear())
const pickerMonth = computed(() => pickerView.value.getMonth())
const dateInput = ref('')
const inputError = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)

const pickerCanNext = computed(() => {
  const last = fromDateKey(endDate.value)
  return (
    pickerYear.value < last.getFullYear() ||
    (pickerYear.value === last.getFullYear() && pickerMonth.value < last.getMonth())
  )
})

interface PickerCell {
  key: string
  dayNum: number
  current: boolean
  disabled: boolean
}
/** 选择面板的 42 格日期（不含活跃度，纯选择用） */
const pickerGrid = computed<PickerCell[]>(() => {
  const y = pickerYear.value
  const m = pickerMonth.value
  const lead = mondayIndex(new Date(y, m, 1))
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()
  const cells: PickerCell[] = []
  for (let i = lead - 1; i >= 0; i--) {
    const d = prevDays - i
    const key = toDateKey(new Date(y, m - 1, d))
    cells.push({ key, dayNum: d, current: false, disabled: key > endDate.value })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(new Date(y, m, d))
    cells.push({ key, dayNum: d, current: true, disabled: key > endDate.value })
  }
  let next = 1
  while (cells.length < 42) {
    const key = toDateKey(new Date(y, m + 1, next))
    cells.push({ key, dayNum: next, current: false, disabled: key > endDate.value })
    next++
  }
  return cells
})

function togglePicker(): void {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value) {
    pickerView.value = new Date(year.value, month.value, 1)
    dateInput.value = selectedKey.value ?? ''
    inputError.value = ''
    void nextTick(() => inputRef.value?.focus())
  }
}
function shiftPickerMonth(delta: number): void {
  if (delta > 0 && !pickerCanNext.value) return
  pickerView.value = new Date(pickerYear.value, pickerMonth.value + delta, 1)
}

/** 解析输入：支持 YYYY-MM-DD / YYYY/MM/DD / YYYY-MM（跳到该月 1 号），并校验真实日期。 */
function parseDateInput(raw: string): Date | null {
  const s = raw.trim()
  const m = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = m[3] ? Number(m[3]) : 1
  if (y < 1900 || y > 9999 || mo < 1 || mo > 12) return null
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return date
}

function submitInput(): void {
  const d = parseDateInput(dateInput.value)
  if (!d) {
    inputError.value = '请输入有效日期，如 2026-11-14'
    return
  }
  const key = toDateKey(d)
  if (key > endDate.value) {
    inputError.value = `不能晚于 ${formatDateCN(endDate.value)}`
    return
  }
  selectDate(key)
}

// 点击面板外部关闭（放在卡片根节点上，点日历格子/输入都不会误关）
function onDocPointerDown(e: PointerEvent): void {
  if (pickerOpen.value && rootRef.value && !rootRef.value.contains(e.target as Node)) {
    pickerOpen.value = false
  }
}
function onDocKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && pickerOpen.value) pickerOpen.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onDocKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onDocKeydown)
})
</script>

<template>
  <section ref="rootRef" class="panel calendar">
    <header class="panel__head">
      <div class="calendar__heading">
        <span class="calendar__heading-icon"><AppIcon name="calendar" :size="17" /></span>
        <h2 class="panel__title">日历</h2>
      </div>
      <div class="calendar__nav">
        <button class="calendar__nav-btn" aria-label="上个月" @click="shiftMonth(-1)">
          <AppIcon name="chevron-left" :size="16" />
        </button>

        <!-- 月份标题 = 日期选择入口（点击展开选择面板） -->
        <button
          class="calendar__month font-mono"
          :class="{ 'is-open': pickerOpen }"
          :aria-expanded="pickerOpen"
          aria-label="选择日期"
          title="点击选择日期"
          @click="togglePicker"
        >
          {{ year }}年{{ month + 1 }}月
          <AppIcon name="chevron-down" :size="12" />
        </button>

        <button
          class="calendar__nav-btn"
          aria-label="下个月"
          :disabled="!canNext"
          @click="shiftMonth(1)"
        >
          <AppIcon name="chevron-right" :size="16" />
        </button>
        <button class="calendar__today" title="回到今天" @click="goToday">今</button>

        <!-- 日期选择面板：输入 + 点击两种选择方式 -->
        <div v-if="pickerOpen" class="calendar__picker">
          <div class="picker__head">
            <button class="picker__nav" aria-label="上一个月" @click="shiftPickerMonth(-1)">
              <AppIcon name="chevron-left" :size="14" />
            </button>
            <span class="picker__title font-mono">{{ pickerYear }}年{{ pickerMonth + 1 }}月</span>
            <button
              class="picker__nav"
              aria-label="下一个月"
              :disabled="!pickerCanNext"
              @click="shiftPickerMonth(1)"
            >
              <AppIcon name="chevron-right" :size="14" />
            </button>
          </div>

          <div class="picker__weekdays">
            <span v-for="w in WEEK_LABELS" :key="w">{{ w }}</span>
          </div>
          <div class="picker__grid">
            <button
              v-for="c in pickerGrid"
              :key="c.key"
              class="picker__cell font-mono"
              :class="{
                'is-outside': !c.current,
                'is-selected': c.key === selectedKey,
                'is-today': c.key === todayKey,
              }"
              :disabled="c.disabled"
              @click="selectDate(c.key)"
            >
              {{ c.dayNum }}
            </button>
          </div>

          <div class="picker__input">
            <input
              ref="inputRef"
              v-model="dateInput"
              type="text"
              inputmode="numeric"
              placeholder="YYYY-MM-DD"
              aria-label="输入日期"
              @keydown.enter="submitInput"
            />
            <button class="picker__submit" @click="submitInput">跳转</button>
          </div>
          <p v-if="inputError" class="picker__error">{{ inputError }}</p>

          <div class="picker__foot">
            <button class="picker__link" @click="goToday">今天</button>
            <button v-if="selectedKey" class="picker__link" @click="clearSelection">清除选择</button>
          </div>
        </div>
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
            {
              'is-today': !cell.future && cell.key === todayKey,
              'is-outside': cell.outside,
              'is-future': cell.future,
              'is-selected': selectedKey === cell.key,
            },
          ]"
          :title="cell.future ? '' : `查看 ${formatDateCN(cell.key)}`"
          @mouseenter="onHover(cell)"
          @click="selectDate(cell.key)"
        >
          <span class="calendar__daynum font-mono">{{ cell.dayNum }}</span>
        </span>
      </div>

      <!-- 详情条：悬浮/选中日详情，否则当月汇总 -->
      <div class="calendar__detail">
        <template v-if="detailDay">
          <span class="calendar__detail-date">{{ formatDateCN(detailDay.date) }}</span>
          <span class="calendar__detail-stat">
            <AppIcon name="trending-up" :size="13" />
            {{ detailDay.count }} 次操作
          </span>
          <span class="calendar__detail-sub">
            新增 {{ detailDay.created }} · 修改 {{ detailDay.updated }} · 删除 {{ detailDay.deleted }}
          </span>
          <span v-if="detailDay.activeSeconds > 0" class="calendar__detail-sub">
            · 活跃 {{ formatDuration(detailDay.activeSeconds) }}
          </span>
          <button v-if="selectedKey && !hovered" class="calendar__detail-clear" @click="clearSelection">
            清除
          </button>
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
  position: relative; /* 日期选择面板的定位参照 */
  z-index: 2; /* 浮层向下展开时稳定盖住同列下方的热力图卡片 */
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
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.calendar__month {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 118px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.calendar__month:hover,
.calendar__month.is-open {
  color: var(--accent-primary);
  border-color: var(--border-default);
  background: var(--bg-secondary);
}
.calendar__month.is-open :deep(svg) {
  transform: rotate(180deg);
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

/* ===== 日期选择面板 ===== */
.calendar__picker {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 30;
  width: 272px;
  max-width: calc(100vw - 48px);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.picker__title {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}
.picker__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
}
.picker__nav:hover:not(:disabled) {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.picker__nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.picker__weekdays,
.picker__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
}
.picker__weekdays span {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
}
.picker__cell {
  height: 30px;
  padding: 0;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.picker__cell.is-outside {
  background: transparent;
  opacity: 0.45;
}
.picker__cell.is-today {
  outline: 1px solid var(--accent-primary);
  outline-offset: -1px;
}
.picker__cell:hover:not(:disabled) {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.picker__cell.is-selected {
  background: color-mix(in srgb, var(--accent-primary) 22%, var(--bg-secondary));
  box-shadow: inset 0 0 0 1px var(--accent-primary);
  color: var(--text-primary);
  font-weight: 700;
}
.picker__cell:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
.picker__input {
  display: flex;
  gap: 6px;
}
.picker__input input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 12px;
  font-family: var(--font-mono);
}
.picker__input input::placeholder {
  color: var(--text-muted);
}
.picker__input input:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.picker__submit {
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.picker__submit:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.picker__error {
  margin: 0;
  font-size: 11px;
  color: var(--text-muted);
}
.picker__error {
  color: var(--danger);
}
.picker__foot {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-default);
}
.picker__link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--accent-primary);
  font-size: 12px;
  cursor: pointer;
}
.picker__link:hover {
  text-decoration: underline;
}

.calendar__weekdays,
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}
.calendar__grid {
  /* 固定 6 行 × 46px：格子保持规整方块，切换月份高度稳定，
     不再随外层拉伸被拉成竖长条。 */
  grid-template-rows: repeat(6, 46px);
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
  height: 46px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
/* 未来日期：不可选择 */
.calendar__cell.is-future {
  cursor: default;
  opacity: 0.16;
}
.calendar__cell.is-future:hover {
  transform: none;
  border-color: transparent;
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
/* 选中日期：明显高亮，放在色阶规则之后以覆盖背景 */
.calendar__cell.is-selected {
  background: color-mix(in srgb, var(--accent-primary) 26%, var(--bg-secondary));
  box-shadow: inset 0 0 0 2px var(--accent-primary);
  opacity: 1;
}
.calendar__cell.is-selected .calendar__daynum {
  color: var(--text-primary);
  font-weight: 700;
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
.calendar__detail-clear {
  margin-left: auto;
  padding: 0 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
}
.calendar__detail-clear:hover {
  color: var(--accent-primary);
}
.calendar__loading {
  padding: var(--space-10) 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>

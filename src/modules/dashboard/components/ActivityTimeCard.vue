<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { ActivityDay, ActivitySummary } from '../types/dashboard.types'
import { formatDuration } from '../utils/date'

const props = defineProps<{
  summary: ActivitySummary | null
  days: ActivityDay[]
  loading: boolean
}>()

/** 时长拆成「数值 + 单位」，用于大数字主视觉。 */
function durationParts(seconds: number): { value: string; unit: string } {
  if (seconds <= 0) return { value: '0', unit: '分钟' }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return { value: `${h}.${Math.round((m / 60) * 10)}`, unit: '小时' }
  if (m > 0) return { value: `${m}`, unit: '分钟' }
  return { value: `${seconds}`, unit: '秒' }
}

const todayParts = computed(() => durationParts(props.summary?.todayActiveSeconds ?? 0))

// 近 7 日活跃时长迷你柱状图
const weekBars = computed(() => {
  const src = props.days.slice(-7)
  const max = Math.max(1, ...src.map((d) => d.activeSeconds))
  return src.map((d) => ({
    date: d.date,
    seconds: d.activeSeconds,
    ratio: d.activeSeconds / max,
  }))
})

const WEEK_SHORT = ['日', '一', '二', '三', '四', '五', '六']
function weekdayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return WEEK_SHORT[new Date(y!, (m ?? 1) - 1, d ?? 1).getDay()] ?? ''
}
</script>

<template>
  <section class="panel timecard">
    <header class="panel__head">
      <div class="timecard__heading">
        <span class="timecard__heading-icon"><AppIcon name="clock" :size="17" /></span>
        <h2 class="panel__title">活动时长</h2>
      </div>
      <span class="timecard__badge">今日</span>
    </header>

    <div v-if="loading" class="timecard__loading">统计中…</div>
    <template v-else>
      <div class="timecard__hero">
        <span class="timecard__hero-value font-mono">{{ todayParts.value }}</span>
        <span class="timecard__hero-unit">{{ todayParts.unit }}</span>
      </div>

      <!-- 近 7 日迷你柱状 -->
      <div class="timecard__bars">
        <div v-for="bar in weekBars" :key="bar.date" class="timecard__bar-col" :title="`${formatDuration(bar.seconds)}`">
          <div class="timecard__bar-track">
            <div class="timecard__bar-fill" :style="{ height: `${Math.max(bar.seconds > 0 ? 12 : 2, bar.ratio * 100)}%` }" />
          </div>
          <span class="timecard__bar-label">{{ weekdayOf(bar.date) }}</span>
        </div>
      </div>

      <div class="timecard__stats">
        <div class="timecard__stat">
          <div class="timecard__stat-icon"><AppIcon name="activity" :size="15" /></div>
          <div>
            <p class="timecard__stat-label">本周</p>
            <p class="timecard__stat-value">{{ formatDuration(summary?.weekActiveSeconds ?? 0) }}</p>
          </div>
        </div>
        <div class="timecard__stat">
          <div class="timecard__stat-icon"><AppIcon name="trending-up" :size="15" /></div>
          <div>
            <p class="timecard__stat-label">累计</p>
            <p class="timecard__stat-value">{{ formatDuration(summary?.totalActiveSeconds ?? 0) }}</p>
          </div>
        </div>
        <div class="timecard__stat">
          <div class="timecard__stat-icon is-flame"><AppIcon name="flame" :size="15" /></div>
          <div>
            <p class="timecard__stat-label">连续活跃</p>
            <p class="timecard__stat-value font-mono">{{ summary?.currentStreak ?? 0 }} <small>天</small></p>
          </div>
        </div>
        <div class="timecard__stat">
          <div class="timecard__stat-icon"><AppIcon name="calendar" :size="15" /></div>
          <div>
            <p class="timecard__stat-label">活跃天数</p>
            <p class="timecard__stat-value font-mono">{{ summary?.activeDays ?? 0 }} <small>天</small></p>
          </div>
        </div>
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
}
.panel__title {
  font-size: 18px;
}
.timecard__heading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.timecard__heading-icon {
  color: var(--accent-primary);
  display: inline-flex;
}
.timecard__badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  color: var(--accent-primary);
}
.timecard__hero {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: var(--space-2) 0;
}
.timecard__hero-value {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
  letter-spacing: -1px;
}
.timecard__hero-unit {
  font-size: 15px;
  color: var(--text-muted);
}

.timecard__bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2);
  height: 68px;
  padding-top: var(--space-2);
}
.timecard__bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  height: 100%;
}
.timecard__bar-track {
  flex: 1;
  width: 100%;
  max-width: 26px;
  display: flex;
  align-items: flex-end;
  border-radius: 4px;
  background: var(--bg-secondary);
  overflow: hidden;
}
.timecard__bar-fill {
  width: 100%;
  border-radius: 4px;
  background: color-mix(in srgb, var(--accent-primary) 62%, var(--bg-secondary));
  transition: height var(--duration-slow) var(--ease-standard);
}
.timecard__bar-label {
  font-size: 10px;
  color: var(--text-muted);
}

.timecard__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-default);
}
.timecard__stat {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.timecard__stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--accent-primary);
  flex-shrink: 0;
}
.timecard__stat-icon.is-flame {
  color: var(--accent-danger);
}
.timecard__stat-label {
  font-size: 11px;
  color: var(--text-muted);
}
.timecard__stat-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}
.timecard__stat-value small {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
}
.timecard__loading {
  padding: var(--space-10) 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>

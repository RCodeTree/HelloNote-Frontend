<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '../composables/useDashboard'
import type { IconName } from '@/components/common/AppIcon.vue'
import StatCard from '../components/StatCard.vue'
import RecentNotesCard from '../components/RecentNotesCard.vue'
import TagListCard from '../components/TagListCard.vue'
import ActivityTimeCard from '../components/ActivityTimeCard.vue'
import ActivityCalendar from '../components/ActivityCalendar.vue'
import ActivityHeatmap from '../components/ActivityHeatmap.vue'
import SkeletonStatCard from '@/components/feedback/SkeletonStatCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const { stats, recentNotes, tags, activity, loading, activityLoading, reload } = useDashboard()

interface StatConfig {
  key: string
  label: string
  icon: IconName
  hint: string
  getValue: () => number
}

// 原有四张统计卡，收进左列
const statCards: StatConfig[] = [
  { key: 'notes', label: '笔记总数', icon: 'note', hint: '篇', getValue: () => stats.value?.totalNotes ?? 0 },
  { key: 'pinned', label: '置顶笔记', icon: 'pin', hint: '篇', getValue: () => stats.value?.pinnedNotes ?? 0 },
  { key: 'tags', label: '标签数量', icon: 'tag', hint: '个', getValue: () => stats.value?.totalTags ?? 0 },
  { key: 'words', label: '累计字数', icon: 'sparkles', hint: '字', getValue: () => stats.value?.wordsWritten ?? 0 },
]

const activityDays = computed(() => activity.value?.days ?? [])
const activitySummary = computed(() => activity.value?.summary ?? null)
</script>

<template>
  <div class="dashboard-page">
    <!-- 极简工具区：仅需一个刷新图标 -->
    <div class="dashboard-page__tools">
      <button
        class="dashboard-page__refresh"
        :disabled="loading"
        title="刷新"
        aria-label="刷新"
        @click="reload()"
      >
        <AppIcon name="refresh" :size="16" :class="{ 'is-spin': loading }" />
      </button>
    </div>

    <!-- 三列独立堆叠：列间/列内用明显外边距隔开；宽屏下三列等高铺满内容区，
         由各列「可自然放大的实心块」吸收剩余高度，而非在卡片内部留白。 -->
    <div class="dashboard-grid">
      <!-- 左列：标签(顶部) + 活动时长 + 原有统计卡（统计卡组吸收剩余高度） -->
      <div class="db-col db-col--left">
        <TagListCard :tags="tags" :loading="loading" />
        <ActivityTimeCard
          :summary="activitySummary"
          :days="activityDays"
          :loading="activityLoading && !activity"
        />
        <section class="stat-grid">
          <template v-if="loading">
            <SkeletonStatCard v-for="i in 4" :key="i" />
          </template>
          <template v-else>
            <StatCard
              v-for="s in statCards"
              :key="s.key"
              :label="s.label"
              :icon="s.icon"
              :value="s.getValue()"
              :hint="s.hint"
            />
          </template>
        </section>
      </div>

      <!-- 中列：日历（网格行均分放大） + 活跃度热力图 -->
      <div class="db-col db-col--center">
        <ActivityCalendar
          class="db-center-calendar"
          :days="activityDays"
          :loading="activityLoading && !activity"
        />
        <ActivityHeatmap
          :days="activityDays"
          :loading="activityLoading && !activity"
          :total-events="activitySummary?.totalEvents"
          :active-days="activitySummary?.activeDays"
        />
      </div>

      <!-- 右列：最近笔记独占整列（列表填满、独立滚动） -->
      <div class="db-col db-col--right">
        <RecentNotesCard class="db-right-notes" :notes="recentNotes" :loading="loading" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.dashboard-page__tools {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
.dashboard-page__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.dashboard-page__refresh:hover:not(:disabled) {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.dashboard-page__refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.dashboard-page__refresh .is-spin {
  animation: hn-spin 0.8s linear infinite;
}
@keyframes hn-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 三列独立堆叠 ===== */
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(240px, 288px) minmax(0, 1fr) minmax(280px, 340px);
  gap: var(--space-5); /* 列间外边距 */
  /* 不再做「三列等高 + 拉伸铺满」：每列按内容自然高度堆叠，
     避免把日历格子、统计卡拉成畸形的大空块。 */
  align-items: start;
}
.db-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-5); /* 列内块间外边距 */
  min-width: 0;
}

/* 左列统计卡 2×2：固定紧凑高度，内容自然居中，不再被拉伸成大空卡 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}
.stat-grid :deep(.stat-card) {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
}
.stat-grid :deep(.stat-card__icon) {
  width: 34px;
  height: 34px;
}
.stat-grid :deep(.stat-card__value) {
  font-size: 22px;
}

/* 桌面宽屏：左/中列保持自然高度（不拉伸，避免格子/卡片畸形）。
   仅右列「最近笔记」这一张列表卡填满行高——但行高可能超过视口（日历列很高），
   因此给右列加视口高度上限：卡片始终完整可见，列表在卡片内部滚动查看。 */
@media (min-width: 1181px) {
  .db-col--right {
    align-self: stretch;
    max-height: calc(100dvh - 140px); /* 减去页面头部与间距，卡片不出视口 */
  }
  .db-right-notes {
    flex: 1 1 auto;
    min-height: 0;
  }
  .db-right-notes :deep(.panel__list.is-scroll) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none; /* 高度由 flex 收缩决定，随卡片一起不超出视口 */
  }
}
/* 视口较矮时给列表兜底最小可读高度，避免被压得过扁 */
@media (min-width: 1181px) and (max-height: 720px) {
  .db-col--right {
    max-height: 480px;
  }
}

/* 中屏：3 列 → 2 列，最近笔记独占下方整行；不再强撑高度 */
@media (max-width: 1180px) {
  .dashboard-page {
    min-height: 0;
  }
  .dashboard-grid {
    grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
    flex: none;
  }
  .db-col--right {
    grid-column: 1 / -1;
  }
}
/* 窄屏：单列堆叠 */
@media (max-width: 860px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .db-col--right {
    grid-column: auto;
  }
}
@media (max-width: 480px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>

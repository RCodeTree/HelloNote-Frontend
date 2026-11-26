<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import type { PublicNote } from '../types/notes.types'

const props = withDefaults(
  defineProps<{ note: PublicNote; showAuthor?: boolean; featured?: boolean }>(),
  { showAuthor: true, featured: false },
)

const router = useRouter()

function open(): void {
  void router.push(`/notes/${props.note.id}/view`)
}

const dateLabel = computed(() => {
  const d = new Date(props.note.updatedAt)
  if (isNaN(d.getTime())) return props.note.updatedAt
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
})
</script>

<template>
  <article
    class="public-card"
    :class="{ 'public-card--featured': featured }"
    role="button"
    tabindex="0"
    @click="open"
    @keydown.enter="open"
  >
    <div v-if="showAuthor" class="public-card__author">
      <UserAvatar :name="note.authorName" :url="note.authorAvatar" :size="24" />
      <span>{{ note.authorName }}</span>
      <span class="public-card__date">{{ dateLabel }}</span>
    </div>
    <div class="public-card__top">
      <h3 class="public-card__title">{{ note.title }}</h3>
    </div>
    <p class="public-card__excerpt">{{ note.excerpt || '（暂无内容）' }}</p>
    <div class="public-card__foot">
      <div class="public-card__tags">
        <BaseTag
          v-for="t in note.tags.slice(0, 3)"
          :key="t.id"
          :label="t.name"
          :color="t.color"
          size="sm"
        />
      </div>
      <div class="public-card__stats">
        <span title="点赞数"><AppIcon name="heart" :size="13" /> {{ note.likeCount }}</span>
        <span title="评论数"><AppIcon name="message" :size="13" /> {{ note.commentCount }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.public-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}
.public-card:hover {
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-floating);
}
.public-card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
.public-card--featured {
  min-height: 160px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--accent-primary) 10%, var(--bg-card)), var(--bg-card));
}
.public-card__author {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
  color: var(--text-secondary);
}
.public-card__date {
  margin-left: auto;
  color: var(--text-muted);
}
.public-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.public-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.public-card--featured .public-card__title {
  font-size: 18px;
}
.public-card__excerpt {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.public-card--featured .public-card__excerpt {
  -webkit-line-clamp: 3;
}
.public-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
  flex-wrap: wrap;
}
.public-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.public-card__stats {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-muted);
  font-size: 12px;
}
.public-card__stats span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
</style>

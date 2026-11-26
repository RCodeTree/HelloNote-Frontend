<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth'
import { useDashboardStore } from '@/modules/dashboard/stores/dashboard.store'
import type { IconName } from '@/components/common/AppIcon.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseTag from '@/components/common/BaseTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import StatCard from '@/modules/dashboard/components/StatCard.vue'

const router = useRouter()
const auth = useAuthStore()
const dashboard = useDashboardStore()
const { stats, recentNotes, loading: dashboardLoading } = storeToRefs(dashboard)

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const form = reactive({ displayName: '', bio: '' })
const nameError = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
// 头像灯箱预览：点击头像查看大图
const viewerOpen = ref(false)

function openViewer(): void {
  if (!avatarUrl.value) return
  viewerOpen.value = true
}

function closeViewer(): void {
  viewerOpen.value = false
}

function onViewerKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeViewer()
}

watch(viewerOpen, (open) => {
  if (open) document.addEventListener('keydown', onViewerKeydown)
  else document.removeEventListener('keydown', onViewerKeydown)
})

watch(
  () => auth.user,
  (user) => {
    if (!user) return
    form.displayName = user.displayName
    form.bio = user.bio ?? ''
  },
  { immediate: true },
)

const avatarUrl = computed(() => previewUrl.value ?? auth.user?.avatarUrl ?? null)

interface StatItem {
  label: string
  value: number
  icon: IconName
  hint: string
}

const statItems = computed<StatItem[]>(() => [
  { label: '笔记总数', value: stats.value?.totalNotes ?? 0, icon: 'note', hint: '篇' },
  { label: '置顶笔记', value: stats.value?.pinnedNotes ?? 0, icon: 'pin', hint: '篇' },
  { label: '标签数量', value: stats.value?.totalTags ?? 0, icon: 'tag', hint: '个' },
  { label: '累计字数', value: stats.value?.wordsWritten ?? 0, icon: 'sparkles', hint: '字' },
])

function goBack(): void {
  if (window.history.state?.back) router.back()
  else void router.push('/dashboard')
}

function pickFile(): void {
  fileInput.value?.click()
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!ACCEPTED_TYPES.includes(file.type)) {
    uploadError.value = '仅支持 PNG、JPEG、WebP、GIF 图片'
    return
  }
  if (file.size > MAX_AVATAR_SIZE) {
    uploadError.value = '图片不能超过 2MB'
    return
  }

  uploadError.value = null
  const objectUrl = URL.createObjectURL(file)
  previewUrl.value = objectUrl
  try {
    await auth.uploadAvatar(file)
  } finally {
    URL.revokeObjectURL(objectUrl)
    if (previewUrl.value === objectUrl) previewUrl.value = null
  }
}

async function onSave(): Promise<void> {
  const displayName = form.displayName.trim()
  if (!displayName) {
    nameError.value = '昵称不能为空'
    return
  }
  nameError.value = null
  await auth.updateProfile({ displayName, bio: form.bio })
}

function openNote(id: number): void {
  void router.push(`/notes/${id}/edit`)
}

function formatUpdated(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  auth.error = null
  void dashboard.loadDashboard()
})

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  document.removeEventListener('keydown', onViewerKeydown)
})
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__head">
      <button type="button" class="profile-page__back" aria-label="返回" @click="goBack">
        <AppIcon name="chevron-left" :size="20" />
      </button>
      <h1 class="profile-page__title">个人中心</h1>
    </header>

    <div class="profile-page__grid">
      <!-- 左栏：资料卡 -->
      <section class="panel profile-card">
        <div class="profile-card__identity">
          <button
            type="button"
            class="profile-card__avatar-btn"
            aria-label="查看头像"
            title="点击查看头像"
            @click="openViewer"
          >
            <UserAvatar
              :name="form.displayName || auth.user?.username || '?'"
              :url="avatarUrl"
              :size="88"
            />
          </button>
          <div class="profile-card__names">
            <p class="profile-card__display">{{ auth.user?.displayName || '—' }}</p>
            <p class="profile-card__handle font-mono">@{{ auth.user?.username || '—' }}</p>
          </div>
        </div>

        <input
          ref="fileInput"
          class="profile-card__file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          @change="onFileChange"
        />

        <div class="profile-card__section">
          <h2 class="profile-card__section-title">编辑资料</h2>

          <BaseInput v-model="form.displayName" label="昵称" :error="nameError" />

          <div class="profile-card__field">
            <div class="profile-card__field-head">
              <label class="profile-card__label" for="profile-bio">个人简介</label>
              <span class="profile-card__counter font-mono">{{ form.bio.length }}/500</span>
            </div>
            <textarea
              id="profile-bio"
              v-model="form.bio"
              class="profile-card__textarea"
              maxlength="500"
              rows="4"
            />
          </div>

          <p v-if="uploadError" class="profile-card__error">{{ uploadError }}</p>
          <p v-else-if="auth.error" class="profile-card__error">{{ auth.error }}</p>

          <div class="profile-card__actions">
            <BaseButton variant="secondary" size="sm" :disabled="auth.loading" @click="pickFile">
              <AppIcon name="upload" :size="15" />
              更换头像
            </BaseButton>
            <BaseButton variant="primary" :loading="auth.loading" @click="onSave">保存</BaseButton>
          </div>
        </div>

        <div class="profile-card__section profile-card__section--bordered">
          <h2 class="profile-card__section-title">账号信息</h2>
          <dl class="profile-card__meta">
            <div class="profile-card__meta-row">
              <dt>用户名</dt>
              <dd class="font-mono">@{{ auth.user?.username || '—' }}</dd>
            </div>
            <div class="profile-card__meta-row">
              <dt>邮箱</dt>
              <dd>{{ auth.user?.email || '—' }}</dd>
            </div>
            <div class="profile-card__meta-row">
              <dt>状态</dt>
              <dd>
                <span class="profile-card__status" :class="{ 'is-off': !auth.user?.isActive }">
                  {{ auth.user?.isActive ? '正常' : '已停用' }}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- 右栏：资料汇总 + 我的笔记 -->
      <div class="profile-page__right">
        <section class="panel summary">
          <h2 class="panel__title">资料汇总</h2>
          <div class="summary__stats">
            <StatCard
              v-for="s in statItems"
              :key="s.label"
              :label="s.label"
              :icon="s.icon"
              :value="s.value"
              :hint="s.hint"
            />
          </div>
        </section>

        <section class="panel notes">
          <header class="notes__head">
            <h2 class="panel__title">我的笔记</h2>
            <span class="notes__count font-mono">{{ recentNotes.length }}</span>
          </header>

          <div v-if="dashboardLoading && !recentNotes.length" class="notes__placeholder">加载中…</div>
          <div v-else-if="recentNotes.length" class="notes__list">
            <article
              v-for="note in recentNotes"
              :key="note.id"
              class="notes__item"
              role="button"
              tabindex="0"
              @click="openNote(note.id)"
              @keydown.enter="openNote(note.id)"
            >
              <div class="notes__item-top">
                <h3 class="notes__item-title">{{ note.title }}</h3>
                <span class="notes__item-date font-mono">{{ formatUpdated(note.updatedAt) }}</span>
              </div>
              <p class="notes__item-excerpt">{{ note.excerpt }}</p>
              <div v-if="note.tags.length" class="notes__item-tags">
                <BaseTag
                  v-for="tag in note.tags"
                  :key="tag.id"
                  :label="tag.name"
                  :color="tag.color"
                  size="sm"
                />
              </div>
            </article>
          </div>
          <p v-else class="notes__placeholder">暂无笔记</p>
        </section>
      </div>
    </div>

    <!-- 头像灯箱预览 -->
    <Teleport to="body">
      <Transition name="viewer">
        <div v-if="viewerOpen" class="avatar-viewer" @click.self="closeViewer">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="form.displayName || '头像'"
            class="avatar-viewer__img"
          />
          <p v-else class="avatar-viewer__placeholder">暂未设置头像</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.profile-page__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}
.profile-page__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.profile-page__back:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.profile-page__title {
  font-size: 22px;
}

.profile-page__grid {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: var(--space-6);
  align-items: start;
}
.profile-page__right {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.panel__title {
  font-size: 17px;
}

/* ===== 左栏资料卡 ===== */
.profile-card__identity {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.profile-card__avatar-btn {
  position: relative;
  display: inline-flex;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  cursor: zoom-in;
  transition: transform var(--duration-fast) var(--ease-standard);
}
.profile-card__avatar-btn:hover {
  transform: scale(1.03);
}
.profile-card__avatar-btn :deep(.user-avatar) {
  box-shadow: 0 0 0 3px var(--bg-card), 0 0 0 4px var(--border-default);
}
.profile-card__names {
  min-width: 0;
}
.profile-card__display {
  font-size: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-card__handle {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-card__file {
  display: none;
}
.profile-card__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.profile-card__section--bordered {
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-default);
}
.profile-card__section-title {
  font-size: 15px;
  color: var(--text-primary);
}
.profile-card__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.profile-card__field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.profile-card__label {
  font-size: 13px;
  color: var(--text-secondary);
}
.profile-card__counter {
  font-size: 12px;
  color: var(--text-muted);
}
.profile-card__textarea {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--font-body);
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  resize: vertical;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}
.profile-card__textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 20%, transparent);
}
.profile-card__error {
  font-size: 13px;
  color: var(--danger);
}
.profile-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.profile-card__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
}
.profile-card__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  font-size: 13px;
}
.profile-card__meta-row dt {
  color: var(--text-muted);
  flex-shrink: 0;
}
.profile-card__meta-row dd {
  margin: 0;
  color: var(--text-primary);
  text-align: right;
  overflow-wrap: anywhere;
}
.profile-card__status {
  color: var(--accent-olive);
}
.profile-card__status.is-off {
  color: var(--danger);
}

/* ===== 右栏汇总与笔记 ===== */
.summary__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}
.notes__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}
.notes__count {
  font-size: 14px;
  color: var(--text-muted);
}
.notes__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 440px;
  overflow-y: auto;
  padding-right: 6px;
  scrollbar-width: thin;
}
.notes__list::-webkit-scrollbar {
  width: 6px;
}
.notes__list::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: var(--radius-full);
}
.notes__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.notes__item:hover {
  border-color: var(--accent-primary);
  transform: translateY(-1px);
}
.notes__item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
.notes__item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}
.notes__item-title {
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notes__item-date {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.notes__item-excerpt {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notes__item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.notes__placeholder {
  font-size: 13px;
  color: var(--text-muted);
  padding: var(--space-6) 0;
  text-align: center;
}

/* ===== 头像灯箱 ===== */
.avatar-viewer {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: rgb(0 0 0 / 72%);
  cursor: zoom-out;
}
.avatar-viewer__img {
  /* 固定展示宽度：小图（如占位头像）也放大可看，大图按比例缩放不溢出 */
  width: min(70vw, 420px);
  height: auto;
  max-height: min(80vh, 520px);
  object-fit: contain;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-floating);
  background: var(--bg-secondary);
}
.avatar-viewer__placeholder {
  color: #fff;
  font-size: 14px;
}
.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 200ms var(--ease-standard);
}
.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .viewer-enter-active,
  .viewer-leave-active {
    transition: none;
  }
}

@media (max-width: 900px) {
  .profile-page__grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .summary__stats {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useToast } from '@/composables/useToast'
import { useFriendsStore } from '../stores/friends.store'
import type {
  Friend,
  FriendBrief,
  FriendCloseness,
  FriendPrivacy,
} from '../types/friends.types'

const router = useRouter()
const store = useFriendsStore()
const toast = useToast()
const { friends, loading, error } = storeToRefs(store)

const addOpen = ref(false)
const keyword = ref('')
const results = ref<FriendBrief[]>([])
const searching = ref(false)
const searched = ref(false)
const adding = ref(false)
const settingsTarget = ref<Friend | null>(null)
const settingsOpen = computed(() => settingsTarget.value !== null)
const settingsSaving = ref(false)
const formNote = ref('')
const formPrivacy = ref<FriendPrivacy>('all')
const formRelationType = ref('')
const formCloseness = ref<FriendCloseness>('acquaintance')

const deleteTarget = ref<Friend | null>(null)
const deleteOpen = computed(() => deleteTarget.value !== null)

const privacyLabel: Record<FriendPrivacy, string> = {
  all: '公开',
  friends: '仅好友',
  hidden: '隐藏',
}
const closenessLabel: Record<FriendCloseness, string> = {
  acquaintance: '认识',
  friend: '好友',
  close: '亲密',
  intimate: '至交',
}

let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  void store.init()
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

watch(keyword, (val) => {
  if (timer) clearTimeout(timer)
  searched.value = val.trim().length > 0
  if (!searched.value) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  timer = setTimeout(async () => {
    results.value = await store.search(val)
    searching.value = false
  }, 300)
})

function displayName(friend: Friend): string {
  return friend.note || friend.displayName
}

function toggleAdd(): void {
  addOpen.value = !addOpen.value
  if (!addOpen.value) {
    keyword.value = ''
    results.value = []
    searched.value = false
  }
}

function openChat(userId: number): void {
  void router.push(`/chats/${userId}`)
}

async function addByName(): Promise<void> {
  const name = keyword.value.trim()
  if (!name || adding.value) return
  adding.value = true
  const ok = await store.add(name)
  adding.value = false
  if (ok) {
    toast.success('已发送申请')
    keyword.value = ''
  } else {
    toast.error(error.value || '添加失败')
  }
}

async function addFromResult(brief: FriendBrief): Promise<void> {
  if (adding.value) return
  adding.value = true
  const ok = await store.add(brief.username)
  adding.value = false
  if (ok) toast.success('已发送申请')
  else toast.error(error.value || '添加失败')
}

function openSettings(friend: Friend): void {
  settingsTarget.value = friend
  formNote.value = friend.note
  formPrivacy.value = friend.privacy
  formRelationType.value = friend.relationType
  formCloseness.value = friend.closeness
}

async function saveSettings(): Promise<void> {
  const target = settingsTarget.value
  if (!target || settingsSaving.value) return
  settingsSaving.value = true
  const ok = await store.updateSettings(target.id, {
    note: formNote.value.trim(),
    privacy: formPrivacy.value,
    relationType: formRelationType.value.trim(),
    closeness: formCloseness.value,
  })
  settingsSaving.value = false
  if (!ok) {
    toast.error(error.value || '保存失败')
    return
  }
  settingsTarget.value = null
  toast.success('已保存')
}

function requestDeleteFromSettings(): void {
  if (!settingsTarget.value) return
  deleteTarget.value = settingsTarget.value
  settingsTarget.value = null
}

async function onDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  deleteTarget.value = null
  const ok = await store.remove(target.id)
  if (ok) toast.success('已删除')
  else toast.error(error.value || '删除失败')
}
</script>

<template>
  <div class="friends-page">
    <header class="friends-page__head">
      <h1 class="friends-page__title">笔友</h1>
      <div class="friends-page__ops">
        <button
          type="button"
          class="icon-button"
          :class="{ 'is-active': addOpen }"
          aria-label="添加笔友"
          @click="toggleAdd"
        >
          <AppIcon name="user-plus" :size="18" />
        </button>
        <button type="button" class="icon-button" aria-label="刷新" @click="store.init()">
          <AppIcon name="refresh" :size="17" />
        </button>
      </div>
    </header>

    <section v-if="addOpen" class="friend-add">
      <BaseInput v-model="keyword" placeholder="搜索用户名" class="friend-add__input" />
      <ul v-if="results.length" class="friend-add__results">
        <li v-for="brief in results" :key="brief.id" class="friend-row">
          <UserAvatar :name="brief.displayName" :url="brief.avatarUrl" :size="36" />
          <div class="friend-row__info">
            <span class="friend-row__name">{{ brief.displayName }}</span>
            <span class="friend-row__sub">@{{ brief.username }}</span>
          </div>
          <BaseButton variant="secondary" size="sm" :loading="adding" @click="addFromResult(brief)">
            <AppIcon name="user-plus" :size="14" />
            <span>添加</span>
          </BaseButton>
        </li>
      </ul>
      <EmptyState v-else-if="searched && !searching" title="暂无结果" />
      <div v-if="keyword.trim()" class="friend-add__actions">
        <BaseButton variant="secondary" size="sm" :disabled="adding" @click="addByName">按用户名添加</BaseButton>
      </div>
    </section>

    <!-- 笔友列表：每个 item 是独立卡片 -->
    <div class="friend-list-panel">
      <template v-if="loading && !friends.length">
        <div class="friend-list-loading">加载中…</div>
      </template>
      <template v-else-if="friends.length">
        <div
          v-for="friend in friends"
          :key="friend.id"
          class="list-item list-item--friend"
          @click="openChat(friend.userId)"
        >
          <span class="list-item__avatar">
            <UserAvatar :name="friend.displayName" :url="friend.avatarUrl" :size="42" />
            <span v-if="friend.unreadCount > 0" class="list-item__dot">{{ friend.unreadCount }}</span>
          </span>
          <span class="list-item__body">
            <span class="list-item__line">
              <span class="list-item__name">{{ displayName(friend) }}</span>
              <span class="friend-tag">{{ friend.relationType || '笔友' }}</span>
              <span class="friend-tag friend-tag--soft">{{ closenessLabel[friend.closeness] }}</span>
              <span v-if="friend.privacy !== 'all'" class="friend-tag friend-tag--soft">
                {{ privacyLabel[friend.privacy] }}
              </span>
            </span>
            <span class="list-item__sub">@{{ friend.username }}</span>
          </span>
          <button
            type="button"
            class="friend-row__setting"
            aria-label="好友设置"
            @click.stop="openSettings(friend)"
          >
            <AppIcon name="settings" :size="16" />
          </button>
        </div>
      </template>
      <EmptyState v-else title="暂无笔友" />
    </div>

    <!-- 好友设置 -->
    <Teleport to="body">
      <div v-if="settingsOpen" class="settings">
        <div class="settings__scrim" @click="settingsTarget = null" />
        <div class="settings__card" role="dialog" aria-modal="true">
          <div class="settings__head">
            <h2 class="settings__title">好友设置</h2>
            <button type="button" class="settings__close" aria-label="关闭" @click="settingsTarget = null">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="settings__body">
            <BaseInput v-model="formNote" label="备注" placeholder="备注" />
            <label class="settings__field">
              <span>关系类别</span>
              <input v-model="formRelationType" class="settings__control" placeholder="如：笔友" />
            </label>
            <label class="settings__field">
              <span>隐私</span>
              <select v-model="formPrivacy" class="settings__control">
                <option value="all">公开</option>
                <option value="friends">仅好友</option>
                <option value="hidden">隐藏</option>
              </select>
            </label>
            <label class="settings__field">
              <span>亲密程度</span>
              <select v-model="formCloseness" class="settings__control">
                <option value="acquaintance">认识</option>
                <option value="friend">好友</option>
                <option value="close">亲密</option>
                <option value="intimate">至交</option>
              </select>
            </label>
            <button type="button" class="settings__delete" @click="requestDeleteFromSettings">删除笔友</button>
          </div>
          <div class="settings__actions">
            <BaseButton variant="ghost" size="sm" @click="settingsTarget = null">取消</BaseButton>
            <BaseButton variant="primary" size="sm" :loading="settingsSaving" @click="saveSettings">保存</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmDialog
      :open="deleteOpen"
      title="删除笔友"
      message="删除后将移除这段笔友关系"
      confirm-text="删除"
      danger
      @confirm="onDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
.friends-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.friends-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.friends-page__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}
.friends-page__ops {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard);
}
.icon-button:hover,
.icon-button.is-active {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.friend-add {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.friend-add__input {
  max-width: 420px;
}
.friend-add__results {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
.friend-add__actions {
  display: flex;
  justify-content: flex-end;
}
/* 列表容器：仅负责纵向排列与间距，每个 item 是独立卡片 */
.friend-list-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.list-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}
.list-item:hover {
  border-color: color-mix(in srgb, var(--accent-primary) 45%, var(--border-default));
  transform: translateY(-1px);
  box-shadow: var(--shadow-floating);
}
.list-item__avatar {
  position: relative;
  flex-shrink: 0;
}
.list-item__dot {
  position: absolute;
  top: -4px;
  right: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background: var(--accent-danger);
  color: #fff;
  font-size: 10px;
  line-height: 17px;
  text-align: center;
}
.list-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.list-item__line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.list-item__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.list-item__sub {
  font-size: 12px;
  color: var(--text-muted);
}
.friend-list-loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

.friend-list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
.friend-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-default);
}
.friend-row:last-child {
  border-bottom: none;
}
.friend-row--friend {
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-standard);
}
.friend-row--friend:hover {
  background: var(--bg-secondary);
}
.friend-row__avatar {
  position: relative;
  flex-shrink: 0;
}
.friend-row__badge {
  position: absolute;
  top: -4px;
  right: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background: var(--accent-danger);
  color: #fff;
  font-size: 10px;
  line-height: 17px;
  text-align: center;
}
.friend-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.friend-row__line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.friend-row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.friend-row__sub {
  font-size: 12px;
  color: var(--text-muted);
}
.friend-tag {
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
  color: var(--accent-primary);
  font-size: 11px;
  white-space: nowrap;
}
.friend-tag--soft {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.friend-row__setting {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.friend-row__setting:hover {
  color: var(--accent-primary);
  background: var(--bg-card);
}
.settings {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: modal-fade var(--duration-fast) var(--ease-standard);
}
@keyframes modal-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.settings__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.settings__card {
  position: relative;
  z-index: 1;
  width: min(92vw, 420px);
  padding: 22px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-floating);
}
.settings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.settings__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.settings__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.settings__close:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}
.settings__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.settings__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--text-secondary);
}
.settings__control {
  width: 100%;
  padding: 9px 12px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.settings__control:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.settings__delete {
  align-self: flex-start;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--danger);
  font-size: 13px;
  cursor: pointer;
}
.settings__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

@media (max-width: 640px) {
  .list-item {
    padding: var(--space-3);
  }
  .list-item__name {
    font-size: 13px;
  }
}
</style>

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
import type { Friend, FriendBrief } from '../types/friends.types'

const router = useRouter()
const store = useFriendsStore()
const toast = useToast()
const { friends, incoming, outgoing, loading, error } = storeToRefs(store)

const keyword = ref('')
const results = ref<FriendBrief[]>([])
const searching = ref(false)
const searched = ref(false)
const adding = ref(false)
const acceptingId = ref<number | null>(null)
const deleteTarget = ref<Friend | null>(null)
const deleteOpen = computed(() => deleteTarget.value !== null)

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

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    accepted: '已接受',
    rejected: '已拒绝',
    declined: '已拒绝',
    blocked: '已屏蔽',
  }
  return map[status] ?? status ?? ''
}

function openChat(userId: number, name: string): void {
  void router.push({ path: '/chats', query: { user_id: String(userId), name } })
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

async function accept(friend: Friend): Promise<void> {
  if (acceptingId.value !== null) return
  acceptingId.value = friend.id
  const ok = await store.accept(friend.id)
  acceptingId.value = null
  if (ok) toast.success('已接受')
  else toast.error(error.value || '操作失败')
}

function requestDelete(friend: Friend): void {
  deleteTarget.value = friend
}

async function onDelete(): Promise<void> {
  const target = deleteTarget.value
  if (target === null) return
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
      <button
        type="button"
        class="friends-page__refresh"
        title="刷新"
        aria-label="刷新"
        @click="store.init()"
      >
        <AppIcon name="refresh" :size="17" />
      </button>
    </header>

    <div class="friends-grid">
      <!-- 添加笔友：搜索结果点「添加」，也可用输入的用户名直接添加 -->
      <section class="friend-card friend-card--wide">
        <h2 class="friend-card__title">添加笔友</h2>
        <BaseInput v-model="keyword" placeholder="搜索用户名" class="friend-add__input" />
        <div v-if="searching" class="friend-add__hint">搜索中…</div>
        <ul v-else-if="results.length" class="friend-add__results">
          <li v-for="brief in results" :key="brief.id" class="friend-row">
            <UserAvatar :name="brief.displayName" :url="brief.avatarUrl" :size="36" />
            <div class="friend-row__info">
              <span class="friend-row__name">{{ brief.displayName }}</span>
              <span class="friend-row__sub">@{{ brief.username }}</span>
            </div>
            <div class="friend-row__ops">
              <BaseButton variant="secondary" size="sm" :loading="adding" @click="addFromResult(brief)">
                <AppIcon name="user-plus" :size="14" />
                <span>添加</span>
              </BaseButton>
              <BaseButton variant="ghost" size="sm" @click="openChat(brief.id, brief.displayName)">
                <AppIcon name="message" :size="14" />
                <span>发消息</span>
              </BaseButton>
            </div>
          </li>
        </ul>
        <EmptyState v-else-if="searched" title="暂无结果" />
        <div class="friend-add__direct">
          <BaseButton variant="secondary" size="sm" :disabled="!keyword.trim() || adding" @click="addByName">
            按用户名添加
          </BaseButton>
        </div>
      </section>

      <!-- 我的笔友 -->
      <section class="friend-card">
        <h2 class="friend-card__title">我的笔友 <span class="friend-card__count">{{ friends.length }}</span></h2>
        <div v-if="loading && !friends.length" class="friend-card__loading">加载中…</div>
        <EmptyState v-else-if="!friends.length" title="暂无笔友" />
        <ul v-else class="friend-list">
          <li v-for="friend in friends" :key="friend.id" class="friend-row">
            <UserAvatar :name="friend.displayName" :url="friend.avatarUrl" :size="40" />
            <div class="friend-row__info">
              <div class="friend-row__line">
                <span class="friend-row__name">{{ friend.displayName }}</span>
                <span class="friend-status">{{ statusLabel(friend.status) }}</span>
              </div>
              <span class="friend-row__sub">@{{ friend.username }}</span>
              <p v-if="friend.bio" class="friend-row__bio">{{ friend.bio }}</p>
            </div>
            <div class="friend-row__ops">
              <BaseButton variant="ghost" size="sm" @click="openChat(friend.userId, friend.displayName)">
                <AppIcon name="message" :size="14" />
                <span>发消息</span>
              </BaseButton>
              <BaseButton variant="ghost" size="sm" @click="requestDelete(friend)">
                <AppIcon name="trash" :size="14" />
              </BaseButton>
            </div>
          </li>
        </ul>
      </section>

      <!-- 申请记录 -->
      <section class="friend-card">
        <h2 class="friend-card__title">申请记录 <span class="friend-card__count">{{ incoming.length + outgoing.length }}</span></h2>
        <EmptyState v-if="!incoming.length && !outgoing.length" title="暂无申请" />
        <div v-else class="friend-requests">
          <div v-if="incoming.length" class="friend-requests__group">
            <h3 class="friend-requests__label">收到的</h3>
            <div v-for="friend in incoming" :key="friend.id" class="friend-row">
              <UserAvatar :name="friend.displayName" :url="friend.avatarUrl" :size="36" />
              <div class="friend-row__info">
                <span class="friend-row__name">{{ friend.displayName }}</span>
                <span class="friend-row__sub">@{{ friend.username }}</span>
              </div>
              <div class="friend-row__ops">
                <BaseButton
                  variant="primary"
                  size="sm"
                  :loading="acceptingId === friend.id"
                  @click="accept(friend)"
                >
                  接受
                </BaseButton>
                <BaseButton variant="ghost" size="sm" @click="requestDelete(friend)">忽略</BaseButton>
              </div>
            </div>
          </div>
          <div v-if="outgoing.length" class="friend-requests__group">
            <h3 class="friend-requests__label">发出的</h3>
            <div v-for="friend in outgoing" :key="friend.id" class="friend-row">
              <UserAvatar :name="friend.displayName" :url="friend.avatarUrl" :size="36" />
              <div class="friend-row__info">
                <span class="friend-row__name">{{ friend.displayName }}</span>
                <span class="friend-row__sub">@{{ friend.username }} · {{ statusLabel(friend.status) }}</span>
              </div>
              <div class="friend-row__ops">
                <BaseButton variant="ghost" size="sm" @click="requestDelete(friend)">撤回</BaseButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

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
.friends-page__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
}
.friends-page__refresh:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.friends-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
  align-items: start;
}
.friend-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.friend-card--wide {
  grid-column: 1 / -1;
}
.friend-card__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}
.friend-card__count {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}
.friend-card__loading {
  padding: var(--space-6) 0;
  font-size: 13px;
  color: var(--text-muted);
}
.friend-add__input {
  max-width: 420px;
}
.friend-add__hint {
  padding: var(--space-3) 0;
  font-size: 13px;
  color: var(--text-muted);
}
.friend-add__results,
.friend-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}
.friend-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-default);
}
.friend-row:last-child {
  border-bottom: none;
}
.friend-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.friend-row__line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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
.friend-row__bio {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  word-break: break-word;
}
.friend-status {
  padding: 1px 8px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 11px;
}
.friend-row__ops {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}
.friend-add__direct {
  display: flex;
  justify-content: flex-end;
}
.friend-requests {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.friend-requests__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.friend-requests__label {
  margin: 0 0 var(--space-1);
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .friends-grid {
    grid-template-columns: 1fr;
  }
  .friend-card--wide {
    grid-column: auto;
  }
  .friend-row {
    flex-wrap: wrap;
  }
  .friend-row__ops {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
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

// 置顶 > 未读 > 其余；同档保持接口返回顺序
const sortedFriends = computed(() => {
  const rank = (f: Friend) => (f.isPinned ? 2 : f.unreadCount > 0 ? 1 : 0)
  return [...friends.value].sort((a, b) => rank(b) - rank(a))
})

// 右键 / 长按上下文菜单
const menuOpen = ref(false)
const menuFriend = ref<Friend | null>(null)
const menuPos = ref({ x: 0, y: 0 })
const menuEl = ref<HTMLElement | null>(null)
const MENU_WIDTH = 160
const MENU_HEIGHT = 96

let searchTimer: ReturnType<typeof setTimeout> | null = null
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressFired = false
let pressStart = { x: 0, y: 0 }
let friendsPollTimer: number | undefined
const FRIEND_POLL_MS = 8000

onMounted(() => {
  void store.init()
  // 好友未读来自 /friends，定期刷新让新消息驱动的排序自动生效
  friendsPollTimer = window.setInterval(() => {
    if (friends.value.length) void store.loadFriends()
  }, FRIEND_POLL_MS)
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onDocKeydown)
})
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (longPressTimer) clearTimeout(longPressTimer)
  if (friendsPollTimer !== undefined) window.clearInterval(friendsPollTimer)
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onDocKeydown)
})

watch(keyword, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searched.value = val.trim().length > 0
  if (!searched.value) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  searchTimer = setTimeout(async () => {
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

function openProfile(friend: Friend): void {
  if (longPressFired) {
    longPressFired = false
    return
  }
  void router.push(`/friends/${friend.userId}/profile`)
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

function clampPos(x: number, y: number): { x: number; y: number } {
  const pad = 8
  return {
    x: Math.max(pad, Math.min(x, window.innerWidth - MENU_WIDTH - pad)),
    y: Math.max(pad, Math.min(y, window.innerHeight - MENU_HEIGHT - pad)),
  }
}

function openMenu(friend: Friend, x: number, y: number): void {
  menuFriend.value = friend
  menuPos.value = clampPos(x, y)
  menuOpen.value = true
}

function closeMenu(): void {
  menuOpen.value = false
  menuFriend.value = null
}

function onContextMenu(event: MouseEvent, friend: Friend): void {
  openMenu(friend, event.clientX, event.clientY)
}

function onDocPointerDown(event: PointerEvent): void {
  if (!menuOpen.value) return
  if (menuEl.value?.contains(event.target as Node)) return
  closeMenu()
}

function onDocKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && menuOpen.value) closeMenu()
}

function onTouchStart(event: TouchEvent, friend: Friend): void {
  const touch = event.touches[0]
  if (!touch) return
  pressStart = { x: touch.clientX, y: touch.clientY }
  longPressFired = false
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = setTimeout(() => {
    longPressFired = true
    openMenu(friend, touch.clientX, touch.clientY)
  }, 500)
}

function onTouchMove(event: TouchEvent): void {
  const touch = event.touches[0]
  if (!touch) return
  if (
    Math.abs(touch.clientX - pressStart.x) > 10 ||
    Math.abs(touch.clientY - pressStart.y) > 10
  ) {
    if (longPressTimer) clearTimeout(longPressTimer)
  }
}

function onTouchEnd(): void {
  if (longPressTimer) clearTimeout(longPressTimer)
  // 有些浏览器长按后不派发 click，短暂保留标记后重置，避免影响下一次点击
  window.setTimeout(() => {
    longPressFired = false
  }, 350)
}

function onItemClick(friend: Friend): void {
  if (longPressFired) {
    longPressFired = false
    return
  }
  openChat(friend.userId)
}

async function menuMarkRead(): Promise<void> {
  const friend = menuFriend.value
  closeMenu()
  if (!friend) return
  const ok = await store.markRead(friend.userId)
  if (ok) toast.success('已标记已读')
  else toast.error(error.value || '操作失败')
}

async function menuTogglePin(): Promise<void> {
  const friend = menuFriend.value
  if (!friend) return
  const wasPinned = friend.isPinned
  closeMenu()
  const ok = await store.updateSettings(friend.id, { isPinned: !wasPinned })
  if (ok) toast.success(wasPinned ? '已取消置顶' : '已置顶')
  else toast.error(error.value || '操作失败')
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

    <!-- 笔友列表：每个 item 是独立卡片，置顶/未读变化时平滑重排 -->
    <div class="friend-list-panel">
      <template v-if="loading && !friends.length">
        <div class="friend-list-loading">加载中…</div>
      </template>
      <template v-else-if="friends.length">
        <TransitionGroup name="friend" tag="div" class="friend-list">
          <div
            v-for="friend in sortedFriends"
            :key="friend.id"
            class="list-item list-item--friend"
            @click="onItemClick(friend)"
            @contextmenu.prevent="onContextMenu($event, friend)"
            @touchstart="onTouchStart($event, friend)"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
          >
            <span class="list-item__avatar" title="查看笔友资料" @click.stop="openProfile(friend)">
              <UserAvatar :name="friend.displayName" :url="friend.avatarUrl" :size="42" />
              <span v-if="friend.unreadCount > 0" class="list-item__dot">{{ friend.unreadCount }}</span>
            </span>
            <span class="list-item__body">
              <span class="list-item__line">
                <AppIcon v-if="friend.isPinned" name="pin" :size="13" class="friend-pin" />
                <span class="list-item__name">{{ displayName(friend) }}</span>
                <span class="friend-tag">{{ friend.relationType || '笔友' }}</span>
                <span class="friend-tag friend-tag--soft">{{ closenessLabel[friend.closeness] }}</span>
                <span v-if="friend.privacy !== 'all'" class="friend-tag friend-tag--soft">
                  {{ privacyLabel[friend.privacy] }}
                </span>
              </span>
              <span class="list-item__sub">@{{ friend.username }}</span>
            </span>
          </div>
        </TransitionGroup>
      </template>
      <EmptyState v-else title="暂无笔友" />
    </div>

    <!-- 右键 / 长按菜单 -->
    <Teleport to="body">
      <div
        v-if="menuOpen"
        ref="menuEl"
        class="ctx-menu"
        role="menu"
        :style="{ left: `${menuPos.x}px`, top: `${menuPos.y}px` }"
        @click.stop
        @contextmenu.prevent
      >
        <button type="button" class="ctx-menu__item" role="menuitem" @click="menuMarkRead">
          <AppIcon name="check" :size="15" />
          <span>标记已读</span>
        </button>
        <button type="button" class="ctx-menu__item" role="menuitem" @click="menuTogglePin">
          <AppIcon name="pin" :size="15" />
          <span>{{ menuFriend?.isPinned ? '取消置顶' : '置顶' }}</span>
        </button>
      </div>
    </Teleport>
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
  position: relative;
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
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
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
  cursor: pointer;
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
.friend-pin {
  color: var(--accent-primary);
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
  gap: var(--space-3);
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
/* 置顶 / 未读引起的重排动画 */
.friend-move {
  transition: transform 350ms var(--ease-standard);
}
.friend-enter-active {
  transition:
    opacity 300ms var(--ease-standard),
    transform 300ms var(--ease-standard);
}
.friend-leave-active {
  position: absolute;
  width: 100%;
  transition:
    opacity 220ms var(--ease-standard),
    transform 220ms var(--ease-standard);
}
.friend-enter-from,
.friend-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 上下文菜单 */
.ctx-menu {
  position: fixed;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  width: 160px;
  padding: 4px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  box-shadow: var(--shadow-floating);
}
.ctx-menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.ctx-menu__item:hover {
  background: var(--bg-secondary);
  color: var(--accent-primary);
}

@media (prefers-reduced-motion: reduce) {
  .friend-move,
  .friend-enter-active,
  .friend-leave-active {
    transition: none;
  }
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

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useToast } from '@/composables/useToast'
import { useFriendsStore } from '../stores/friends.store'
import type { FriendCloseness, FriendPrivacy } from '../types/friends.types'

const route = useRoute()
const router = useRouter()
const store = useFriendsStore()
const toast = useToast()
const { friends, loading, error } = storeToRefs(store)

const userId = computed(() => {
  const raw = route.params.userId
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(value) ? value : 0
})
const friend = computed(() => friends.value.find((f) => f.userId === userId.value) ?? null)

const note = ref('')
const relationType = ref('')
const privacy = ref<FriendPrivacy>('all')
const closeness = ref<FriendCloseness>('acquaintance')
const saving = ref(false)
const deleteOpen = ref(false)

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

// 好友切换或首次加载时，用 store 数据初始化表单
watch(
  () => friend.value?.id ?? null,
  () => {
    const f = friend.value
    if (!f) return
    note.value = f.note
    relationType.value = f.relationType
    privacy.value = f.privacy
    closeness.value = f.closeness
  },
  { immediate: true },
)

onMounted(async () => {
  if (!friends.value.length || !friend.value) await store.init()
})

async function save(): Promise<void> {
  const f = friend.value
  if (!f || saving.value) return
  saving.value = true
  const ok = await store.updateSettings(f.id, {
    note: note.value.trim(),
    relationType: relationType.value.trim(),
    privacy: privacy.value,
    closeness: closeness.value,
  })
  saving.value = false
  if (!ok) {
    toast.error(error.value || '保存失败')
    return
  }
  note.value = note.value.trim()
  relationType.value = relationType.value.trim()
  toast.success('已保存')
}

function openChat(): void {
  const f = friend.value
  if (f) void router.push(`/chats/${f.userId}`)
}

async function onDelete(): Promise<void> {
  const f = friend.value
  if (!f) return
  deleteOpen.value = false
  const ok = await store.remove(f.id)
  if (!ok) {
    toast.error(error.value || '删除失败')
    return
  }
  toast.success('已删除')
  router.back()
}
</script>

<template>
  <div class="profile-page">
    <div v-if="loading && !friend" class="profile-page__loading">加载中…</div>
    <EmptyState v-else-if="!friend" title="未找到笔友" />
    <template v-else>
      <header class="profile-page__head">
        <button type="button" class="profile-page__back" aria-label="返回" @click="router.back()">
          <AppIcon name="chevron-left" :size="18" />
        </button>
      </header>

      <section class="profile-hero">
        <UserAvatar :name="friend.displayName" :url="friend.avatarUrl" :size="72" />
        <h1 class="profile-hero__name">{{ friend.note || friend.displayName }}</h1>
        <span class="profile-hero__username">@{{ friend.username }}</span>
        <p v-if="friend.bio" class="profile-hero__bio">{{ friend.bio }}</p>
      </section>

      <section class="profile-form">
        <BaseInput v-model="note" label="备注" placeholder="备注" />
        <BaseInput v-model="relationType" label="关系类别" placeholder="如：笔友" />
        <label class="profile-form__field">
          <span>隐私</span>
          <select v-model="privacy" class="profile-form__control">
            <option v-for="(label, value) in privacyLabel" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>
        <label class="profile-form__field">
          <span>亲密程度</span>
          <select v-model="closeness" class="profile-form__control">
            <option v-for="(label, value) in closenessLabel" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>
        <div class="profile-form__actions">
          <BaseButton variant="primary" :loading="saving" @click="save">保存</BaseButton>
        </div>
      </section>

      <section class="profile-ops">
        <BaseButton variant="secondary" block @click="openChat">
          <AppIcon name="message" :size="16" />
          <span>发消息</span>
        </BaseButton>
        <BaseButton variant="ghost" block @click="deleteOpen = true">
          <AppIcon name="trash" :size="16" />
          <span>删除笔友</span>
        </BaseButton>
      </section>
    </template>

    <ConfirmDialog
      :open="deleteOpen"
      title="删除笔友"
      message="删除后将移除这段笔友关系"
      confirm-text="删除"
      danger
      @confirm="onDelete"
      @cancel="deleteOpen = false"
    />
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 560px;
  margin: 0 auto;
}
.profile-page__head {
  display: flex;
  align-items: center;
}
.profile-page__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard);
}
.profile-page__back:hover {
  color: var(--accent-primary);
  background: var(--bg-secondary);
}
.profile-page__loading {
  padding: var(--space-8) 0;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  text-align: center;
}
.profile-hero__name {
  margin: var(--space-2) 0 0;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}
.profile-hero__username {
  font-size: 13px;
  color: var(--text-muted);
}
.profile-hero__bio {
  margin: var(--space-1) 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}
.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.profile-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--text-secondary);
}
.profile-form__control {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.profile-form__control:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.profile-form__actions {
  display: flex;
  justify-content: flex-end;
}
.profile-ops {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
@media (max-width: 640px) {
  .profile-form {
    padding: var(--space-4);
  }
}
</style>

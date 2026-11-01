<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useAuthStore } from '@/modules/auth'
import UserAvatar from '@/components/common/UserAvatar.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()

const PRESET_AVATARS = ['🐱', '🦊', '🐼', '🐨', '🦁', '🐸', '🌻', '🌈', '⚡', '🍀', '🌙', '⭐']

const form = reactive({ displayName: '', avatarUrl: '' })

watch(
  () => props.open,
  (open) => {
    if (!open) return
    form.displayName = auth.user?.displayName ?? ''
    form.avatarUrl = auth.user?.avatarUrl ?? ''
    auth.error = null
  },
)

function pickPreset(emoji: string): void {
  form.avatarUrl = form.avatarUrl === emoji ? '' : emoji
}

async function onSave(): Promise<void> {
  const name = form.displayName.trim()
  if (!name) {
    auth.error = '昵称不能为空'
    return
  }
  const ok = await auth.updateProfile({
    displayName: name,
    avatarUrl: form.avatarUrl,
  })
  if (ok) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="profile">
        <div class="profile__scrim" @click="emit('close')" />
        <div class="profile__card" role="dialog" aria-modal="true" aria-label="编辑个人资料">
          <header class="profile__head">
            <h2 class="profile__title">编辑个人资料</h2>
            <button class="profile__close" aria-label="关闭" @click="emit('close')">
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <div class="profile__body">
            <div class="profile__preview">
              <UserAvatar :name="form.displayName || auth.user?.username || '?'" :url="form.avatarUrl || null" :size="64" />
            </div>

            <div class="profile__field">
              <span class="profile__label">头像</span>
              <div class="profile__grid">
                <button
                  v-for="emoji in PRESET_AVATARS"
                  :key="emoji"
                  type="button"
                  class="profile__emoji"
                  :class="{ 'is-active': form.avatarUrl === emoji }"
                  @click="pickPreset(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
              <BaseInput v-model="form.avatarUrl" placeholder="或粘贴头像图片链接（留空使用首字母头像）" />
            </div>

            <BaseInput v-model="form.displayName" label="昵称" placeholder="输入新的昵称" />
            <p class="profile__hint">用户名 @{{ auth.user?.username }} 不可修改</p>

            <p v-if="auth.error" class="profile__error">{{ auth.error }}</p>
          </div>

          <footer class="profile__foot">
            <BaseButton variant="ghost" :disabled="auth.loading" @click="emit('close')">取消</BaseButton>
            <BaseButton variant="primary" :loading="auth.loading" @click="onSave">保存</BaseButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.profile {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.profile__scrim {
  position: absolute;
  inset: 0;
  background: rgba(30, 22, 14, 0.4);
}
.profile__card {
  position: relative;
  width: min(440px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-floating);
}
.profile__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-default);
}
.profile__title {
  font-size: 17px;
}
.profile__close {
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
}
.profile__close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.profile__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}
.profile__preview {
  display: flex;
  justify-content: center;
}
.profile__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.profile__label {
  font-size: 13px;
  color: var(--text-secondary);
}
.profile__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.profile__emoji {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.profile__emoji:hover {
  border-color: var(--accent-primary);
}
.profile__emoji.is-active {
  border-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
}
.profile__hint {
  font-size: 12px;
  color: var(--text-muted);
}
.profile__error {
  font-size: 13px;
  color: var(--danger);
}
.profile__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-default);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

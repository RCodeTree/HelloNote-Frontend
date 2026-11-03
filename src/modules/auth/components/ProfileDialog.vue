<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AppIcon from '@/components/common/AppIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()

const activeTab = ref<'account' | 'security'>('account')
const pwForm = ref({ current: '', new: '' })

function close(): void {
  emit('close')
}

function changePassword(): void {
  // 占位：实际需调用后端接口
  pwForm.value = { current: '', new: '' }
  close()
}

const confirmDelete = ref(false)
function confirmDeleteAccount(): void {
  confirmDelete.value = false
  // 占位：调用后端删除账户
  close()
}
</script>

<template>
  <Teleport to="body">
    <TransitionRoot :show="open" as="template">
      <!-- @close 在 Esc 或点击遮罩时触发，等价于关闭 -->
      <Dialog @close="close" class="profile">
        <TransitionChild
          as="template"
          enter="transition-opacity duration-150 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity duration-150 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="profile__scrim" />
        </TransitionChild>
        <TransitionChild
          as="template"
          enter="transition duration-150 ease-out"
          enter-from="opacity-0 translate-y-1.5 scale-95"
          enter-to="opacity-100 translate-y-0 scale-100"
          leave="transition duration-150 ease-in"
          leave-from="opacity-100 translate-y-0 scale-100"
          leave-to="opacity-0 translate-y-1.5 scale-95"
        >
          <DialogPanel class="profile__dialog glass-floating">
            <button class="profile__close" @click="close" aria-label="关闭">
              <AppIcon name="close" :size="18" />
            </button>

            <div class="profile__tabs">
              <button
                class="profile__tab"
                :class="{ 'is-active': activeTab === 'account' }"
                @click="activeTab = 'account'"
              >
                资料
              </button>
              <button
                class="profile__tab"
                :class="{ 'is-active': activeTab === 'security' }"
                @click="activeTab = 'security'"
              >
                安全
              </button>
            </div>

            <div class="profile__body">
              <div v-if="activeTab === 'account'" class="profile__panel">
                <div class="profile__row">
                  <span class="profile__label">用户名</span>
                  <span class="profile__value">{{ authStore.user?.username }}</span>
                </div>
                <div class="profile__row">
                  <span class="profile__label">邮箱</span>
                  <span class="profile__value">{{ authStore.user?.email || '—' }}</span>
                </div>
                <div class="profile__row">
                  <span class="profile__label">昵称</span>
                  <span class="profile__value">{{ authStore.user?.displayName || '—' }}</span>
                </div>
              </div>

              <div v-else class="profile__panel">
                <form class="profile__form" @submit.prevent="changePassword">
                  <label class="profile__field">
                    <span>当前密码</span>
                    <input v-model="pwForm.current" type="password" autocomplete="current-password" />
                  </label>
                  <label class="profile__field">
                    <span>新密码</span>
                    <input v-model="pwForm.new" type="password" autocomplete="new-password" />
                  </label>
                  <BaseButton type="submit" size="sm">修改密码</BaseButton>
                </form>

                <div class="profile__danger">
                  <p class="profile__danger-title">删除账户</p>
                  <p class="profile__danger-desc">此操作不可恢复，将永久删除你的所有笔记与标签。</p>
                  <BaseButton variant="danger" size="sm" @click="confirmDelete = true">删除账户</BaseButton>
                </div>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </TransitionRoot>
  </Teleport>

  <ConfirmDialog
    :open="confirmDelete"
    title="删除账户"
    message="确定要删除账户吗？此操作不可恢复。"
    confirm-text="删除"
    danger
    @confirm="confirmDeleteAccount"
    @cancel="confirmDelete = false"
  />
</template>

<style scoped>
.profile {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.profile__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.profile__dialog {
  position: relative;
  z-index: 1;
  width: min(92vw, 440px);
  padding: 28px 26px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-floating);
}
.profile__close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.profile__close:hover {
  color: var(--text-primary);
  background: var(--accent-primary);
}
.profile__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-default);
}
.profile__tab {
  padding: 10px 4px;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.profile__tab.is-active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
.profile__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-default);
}
.profile__label {
  font-size: 13px;
  color: var(--text-muted);
}
.profile__value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}
.profile__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}
.profile__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.profile__field span {
  font-size: 12px;
  color: var(--text-muted);
}
.profile__field input {
  height: 38px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.profile__field input:focus {
  border-color: var(--accent-primary);
}
.profile__danger {
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-danger);
  background: color-mix(in srgb, var(--accent-danger) 8%, transparent);
}
.profile__danger-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-danger);
}
.profile__danger-desc {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}
</style>

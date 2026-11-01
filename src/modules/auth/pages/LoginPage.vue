<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'register'>('login')
function switchMode(m: 'login' | 'register'): void {
  mode.value = m
  auth.error = null
}

const loginForm = reactive({ account: '', password: '' })
const registerForm = reactive({ username: '', displayName: '', email: '', password: '' })

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/

// 提交前校验：给出即时中文提示，避免依赖后端 422
function validateRegister(): string | null {
  if (registerForm.username.trim().length < 3) return '用户名至少 3 个字符'
  if (registerForm.displayName.trim().length < 1) return '请填写昵称'
  if (!EMAIL_RE.test(registerForm.email.trim())) return '请输入有效的邮箱地址'
  if (registerForm.password.length < 6) return '密码至少 6 位'
  return null
}

async function onSubmit(): Promise<void> {
  if (mode.value === 'register') {
    const invalid = validateRegister()
    if (invalid) {
      auth.error = invalid
      return
    }
  }
  let ok = false
  if (mode.value === 'login') {
    ok = await auth.login({ account: loginForm.account, password: loginForm.password })
  } else {
    ok = await auth.register({
      username: registerForm.username,
      displayName: registerForm.displayName,
      email: registerForm.email,
      password: registerForm.password,
    })
  }
  if (ok) {
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card glass-floating">
      <div class="login-card__head">
        <AppLogo :show-text="true" />
        <p class="login-card__sub">欢迎回来，开始记录你的想法</p>
      </div>

      <div class="login-tabs">
        <button
          class="login-tabs__item"
          :class="{ 'is-active': mode === 'login' }"
          @click="switchMode('login')"
        >
          登录
        </button>
        <button
          class="login-tabs__item"
          :class="{ 'is-active': mode === 'register' }"
          @click="switchMode('register')"
        >
          注册
        </button>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <template v-if="mode === 'login'">
          <BaseInput
            v-model="loginForm.account"
            label="用户名 / 邮箱"
            placeholder="demo 或 demo@hellonote.app"
            autocomplete="username"
          />
          <BaseInput
            v-model="loginForm.password"
            label="密码"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </template>

        <template v-else>
          <BaseInput v-model="registerForm.username" label="用户名" placeholder="3-50 个字符" />
          <BaseInput v-model="registerForm.displayName" label="昵称" placeholder="展示名称" />
          <BaseInput
            v-model="registerForm.email"
            label="邮箱"
            type="email"
            placeholder="you@example.com"
          />
          <BaseInput
            v-model="registerForm.password"
            label="密码"
            type="password"
            placeholder="至少 6 位"
            autocomplete="new-password"
          />
        </template>

        <p v-if="auth.error" class="login-form__error">{{ auth.error }}</p>

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="auth.loading"
          :disabled="auth.loading"
          class="login-form__submit"
        >
          {{ mode === 'login' ? '登录' : '创建账号' }}
        </BaseButton>
      </form>

      <p class="login-card__hint">
        演示账号：<strong>demo</strong> / <strong>demo1234</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  max-width: 400px;
}
.login-card {
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  background: var(--bg-card);
}
.login-card__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
}
.login-card__sub {
  font-size: 14px;
  color: var(--text-muted);
}
.login-tabs {
  display: flex;
  gap: var(--space-2);
  padding: 4px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}
.login-tabs__item {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
}
.login-tabs__item.is-active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.login-form__error {
  font-size: 13px;
  color: var(--danger);
  text-align: center;
}
.login-form__submit {
  width: 100%;
  justify-content: center;
}
.login-card__hint {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}
</style>

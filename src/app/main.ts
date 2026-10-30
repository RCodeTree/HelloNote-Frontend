import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from '@/stores/theme.store'
import '@/assets/styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 同步主题状态到 Pinia。
// 首屏 data-theme 已由 index.html 内联脚本在绘制前设置，这里仅用于保持 Pinia 状态一致，避免闪屏。
useThemeStore().initTheme()

app.mount('#app')

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 根据环境变量决定是否启用 Mock
async function setupApp() {
  const useMock = import.meta.env.VITE_USE_MOCK === 'true'

  if (useMock) {
    const { setupMock } = await import('./mock')
    setupMock()
  }

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
}

// 启动应用
setupApp()

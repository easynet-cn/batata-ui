import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { toast } from '@/utils/error'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Global error handler - catches unhandled errors in components
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global Error]', err, info)
  const message = err instanceof Error ? err.message : String(err)
  toast.error(message || 'An unexpected error occurred')
}

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  event.preventDefault() // Prevent default browser behavior
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason || '')
  if (message && !message.includes('canceled')) {
    toast.error(message || 'An unexpected error occurred')
  }
})

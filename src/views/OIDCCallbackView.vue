<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { storage } from '@/composables/useStorage'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const status = ref<'processing' | 'success' | 'error'>('processing')
const errorMessage = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const authMethod = storage.get('consul_oidc_auth_method') as string

  if (!code || !state || !authMethod) {
    status.value = 'error'
    errorMessage.value = t('consulOidcLoginFailed')
    setTimeout(() => router.replace('/login'), 3000)
    return
  }

  try {
    const success = await authStore.completeOIDCLogin(authMethod, code, state)
    if (success) {
      status.value = 'success'
      // Clean up stored auth method
      storage.remove('consul_oidc_auth_method')
      setTimeout(() => router.replace('/consul/dashboard'), 1000)
    } else {
      status.value = 'error'
      errorMessage.value = authStore.error || t('consulOidcLoginFailed')
      setTimeout(() => router.replace('/login'), 3000)
    }
  } catch {
    status.value = 'error'
    errorMessage.value = t('consulOidcLoginFailed')
    setTimeout(() => router.replace('/login'), 3000)
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-[#f0f2f5] dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors duration-300"
  >
    <div
      class="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-10 text-center"
    >
      <!-- Processing -->
      <template v-if="status === 'processing'">
        <div class="flex justify-center mb-6">
          <div
            class="w-12 h-12 border-4 border-fuchsia-200 dark:border-fuchsia-900 border-t-fuchsia-600 rounded-full animate-spin"
          />
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {{ t('consulOidcProcessing') }}
        </p>
      </template>

      <!-- Success -->
      <template v-else-if="status === 'success'">
        <div class="flex justify-center mb-6">
          <div
            class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {{ t('consulOidcRedirecting') }}
        </p>
      </template>

      <!-- Error -->
      <template v-else>
        <div class="flex justify-center mb-6">
          <div
            class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <p class="text-red-500 dark:text-red-400 text-sm font-medium">
          {{ errorMessage }}
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { useProvider } from '@/composables/useProvider'
import { Home, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const { t } = useI18n()
const { providerBgClass, providerHoverBgClass } = useProvider()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <div class="text-center max-w-md">
      <p class="text-8xl font-extrabold text-gray-200 dark:text-gray-800 select-none">404</p>
      <h1 class="mt-4 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
        {{ t('notFoundTitle') }}
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ t('notFoundDescription') }}
      </p>
      <div class="mt-8 flex items-center justify-center gap-3">
        <button
          @click="goBack"
          class="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft :size="16" />
          {{ t('goBack') }}
        </button>
        <button
          @click="goHome"
          :class="[
            'inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl text-white transition-colors',
            providerBgClass,
            providerHoverBgClass,
          ]"
        >
          <Home :size="16" />
          {{ t('goHome') }}
        </button>
      </div>
    </div>
  </div>
</template>

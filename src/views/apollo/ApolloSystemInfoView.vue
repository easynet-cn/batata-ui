<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloSystemInfo') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloSystemInfoDesc') }}
        </p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- System Info Card -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('apolloSystemDetails') }}
      </h3>

      <div
        v-if="!portalStore.systemInfo && !loading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Activity :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('noData') }}</p>
      </div>

      <div v-else-if="portalStore.systemInfo" class="space-y-3">
        <div
          v-if="portalStore.systemInfo.version"
          class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{
            t('version')
          }}</span>
          <span
            class="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
          >
            {{ portalStore.systemInfo.version }}
          </span>
        </div>
        <div
          v-if="portalStore.systemInfo.environments"
          class="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{
            t('apolloEnvironments')
          }}</span>
          <div class="flex flex-wrap gap-1.5 justify-end">
            <span
              v-for="env in portalStore.systemInfo.environments"
              :key="env"
              class="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
            >
              {{ env }}
            </span>
          </div>
        </div>
        <template v-for="(value, key) in extraInfo" :key="key">
          <div
            class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
          >
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ key }}</span>
            <span class="text-sm text-gray-900 dark:text-gray-100">{{ value }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Health Check Card -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('apolloHealthCheck') }}
      </h3>

      <div class="flex items-center gap-3 mb-4">
        <input
          v-model="healthInstanceId"
          :placeholder="t('apolloInstanceIdPlaceholder')"
          class="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
        <button
          @click="checkHealth"
          :disabled="healthLoading"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <HeartPulse :size="14" />
          {{ t('apolloCheckHealth') }}
        </button>
      </div>

      <div v-if="portalStore.healthCheck" class="space-y-3">
        <div class="flex items-center gap-3 py-3">
          <div
            :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center',
              portalStore.healthCheck.status === 'UP'
                ? 'bg-emerald-50 dark:bg-emerald-950/30'
                : 'bg-red-50 dark:bg-red-950/30',
            ]"
          >
            <HeartPulse
              :size="20"
              :class="
                portalStore.healthCheck.status === 'UP'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              "
            />
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900 dark:text-gray-100">
              {{ t('status') }}:
              <span
                :class="
                  portalStore.healthCheck.status === 'UP'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                {{ portalStore.healthCheck.status }}
              </span>
            </p>
          </div>
        </div>

        <div
          v-if="portalStore.healthCheck.details"
          class="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
        >
          <pre class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{
            JSON.stringify(portalStore.healthCheck.details, null, 2)
          }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, Activity, HeartPulse } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloPortalStore } from '@/stores/apollo-portal'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const portalStore = useApolloPortalStore()

const loading = ref(false)
const healthLoading = ref(false)
const healthInstanceId = ref('')

const extraInfo = computed(() => {
  if (!portalStore.systemInfo) return {}
  const excludeKeys = new Set(['version', 'environments'])
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(portalStore.systemInfo)) {
    if (!excludeKeys.has(k) && v !== null && v !== undefined) {
      result[k] = String(v)
    }
  }
  return result
})

async function refreshData() {
  loading.value = true
  try {
    await portalStore.fetchSystemInfo()
  } catch (err) {
    logger.error('Failed to fetch system info:', err)
  } finally {
    loading.value = false
  }
}

async function checkHealth() {
  healthLoading.value = true
  try {
    await portalStore.checkInstanceHealth(healthInstanceId.value || undefined)
  } catch (err) {
    logger.error('Failed to check health:', err)
  } finally {
    healthLoading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>

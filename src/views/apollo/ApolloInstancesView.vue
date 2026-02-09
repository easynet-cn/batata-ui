<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/apps" class="hover:text-orange-600 dark:hover:text-orange-400">
        {{ t('apolloApps') }}
      </RouterLink>
      <ChevronRight :size="12" />
      <RouterLink :to="`/app/${appId}`" class="hover:text-orange-600 dark:hover:text-orange-400">
        {{ appId }}
      </RouterLink>
      <ChevronRight :size="12" />
      <RouterLink
        :to="`/namespace/${appId}/${env}/${clusterName}/${namespaceName}`"
        class="hover:text-orange-600 dark:hover:text-orange-400"
      >
        {{ namespaceName }}
      </RouterLink>
      <ChevronRight :size="12" />
      <span class="text-gray-900 dark:text-gray-100 font-medium">
        {{ t('apolloInstances') }}
      </span>
    </div>

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloInstances') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ appId }} &middot; {{ env }} &middot; {{ clusterName }} &middot; {{ namespaceName }}
        </p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Instance Count -->
    <div
      v-if="instanceList.length > 0"
      class="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl"
    >
      <div class="flex items-center gap-2 text-sm">
        <Monitor :size="14" class="text-orange-600 dark:text-orange-400" />
        <span class="font-bold text-orange-700 dark:text-orange-400">
          {{ t('apolloInstanceCount') }}:
        </span>
        <span class="text-orange-600 dark:text-orange-300">
          {{ instanceList.length }}
        </span>
      </div>
    </div>

    <!-- Instances Table -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <div
        v-if="instanceList.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <Monitor :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoInstances') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloInstanceIp') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloCluster') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloInstanceDataCenter') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloReleaseKey') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloReleaseDeliveryTime') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inst in instanceList" :key="inst.ip">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                  {{ inst.ip }}
                </div>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ inst.clusterName }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ inst.dataCenter || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                <template v-if="inst.configs && inst.configs.length > 0">
                  <span
                    v-for="config in inst.configs"
                    :key="config.releaseKey"
                    class="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 mr-1"
                  >
                    {{ config.releaseKey }}
                  </span>
                </template>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                <template v-if="inst.configs && inst.configs.length > 0">
                  {{ inst.configs[0]?.releaseDeliveryTime || '-' }}
                </template>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="instanceList.length > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ t('total') }} {{ instanceList.length }} {{ t('items') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronRight, RefreshCw, Monitor } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloStore } from '@/stores/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const route = useRoute()
const apolloStore = useApolloStore()

const appId = route.params.appId as string
const env = route.params.env as string
const clusterName = route.params.clusterName as string
const namespaceName = route.params.namespaceName as string

const loading = ref(false)

const instanceList = computed(() => {
  return apolloStore.instances?.content || []
})

async function refreshData() {
  loading.value = true
  try {
    await apolloStore.fetchInstances(env, appId, clusterName, namespaceName)
  } catch (err) {
    logger.error('Failed to fetch instances:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>

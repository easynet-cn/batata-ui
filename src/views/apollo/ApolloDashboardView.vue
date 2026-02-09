<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloDashboard') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloDashboardDesc') }}
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

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Apps -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('apolloTotalApps') }}
            </p>
            <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {{ apolloStore.apps.length }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
          >
            <Box :size="24" class="text-orange-500" />
          </div>
        </div>
      </div>

      <!-- Total Namespaces -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('apolloTotalNamespaces') }}
            </p>
            <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {{ totalNamespaces }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
          >
            <Layers :size="24" class="text-orange-500" />
          </div>
        </div>
      </div>

      <!-- Recent Releases -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('apolloRecentReleases') }}
            </p>
            <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {{ apolloStore.apps.length > 0 ? '-' : '0' }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
          >
            <Rocket :size="24" class="text-orange-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('quickActions') }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <RouterLink
          to="/apps"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
        >
          <div
            class="w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
          >
            <Box :size="16" class="text-orange-500" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('apolloApps') }}
          </span>
        </RouterLink>

        <button
          @click="refreshData"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all text-left"
        >
          <div
            class="w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
          >
            <RefreshCw :size="16" class="text-orange-500" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('refresh') }}
          </span>
        </button>

        <RouterLink
          to="/settings"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
        >
          <div
            class="w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
          >
            <Cog :size="16" class="text-orange-500" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('settings') }}
          </span>
        </RouterLink>
      </div>
    </div>

    <!-- Apps Table -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('apolloApps') }}
      </h3>

      <div
        v-if="apolloStore.apps.length === 0 && !loading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Box :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('apolloNoApps') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloAppId') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloAppName') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloOrgName') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloOwnerName') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in apolloStore.apps.slice(0, 5)" :key="app.appId">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                <RouterLink
                  :to="`/app/${app.appId}`"
                  class="text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {{ app.appId }}
                </RouterLink>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ app.name }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ app.orgName || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ app.ownerName || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Box, Layers, Rocket, RefreshCw, Cog } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloStore } from '@/stores/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const apolloStore = useApolloStore()

const loading = ref(false)

const totalNamespaces = computed(() => {
  return apolloStore.envClusters.reduce((acc, ec) => acc + ec.clusters.length, 0)
})

async function fetchData() {
  loading.value = true
  try {
    await apolloStore.fetchApps()
  } catch (err) {
    logger.error('Failed to fetch Apollo dashboard data:', err)
  } finally {
    loading.value = false
  }
}

function refreshData() {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
        {{ t('apolloGlobalSearch') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ t('apolloGlobalSearchDesc') }}
      </p>
    </div>

    <!-- Search Box -->
    <div
      class="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="relative">
        <Search
          :size="16"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          v-model="searchKeyword"
          :placeholder="t('apolloSearchAppPlaceholder')"
          class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- Results -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <div v-if="!searched" class="text-center py-12 text-gray-400 dark:text-gray-500">
        <Search :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloSearchHint') }}</p>
      </div>

      <div
        v-else-if="results.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <Search :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoSearchResults') }}</p>
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
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in results" :key="app.appId">
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
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <RouterLink
                  :to="`/app/${app.appId}`"
                  class="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                >
                  {{ t('viewDetails') }}
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="results.length > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
      >
        <span>{{ t('total') }} {{ portalStore.searchResults?.total || 0 }} {{ t('items') }}</span>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage <= 0"
            @click="goPage(currentPage - 1)"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ t('previous') }}
          </button>
          <button
            :disabled="!hasNextPage"
            @click="goPage(currentPage + 1)"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ t('next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloPortalStore } from '@/stores/apollo-portal'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const portalStore = useApolloPortalStore()

const loading = ref(false)
const searched = ref(false)
const searchKeyword = ref('')
const currentPage = ref(0)

const results = computed(() => portalStore.searchResults?.content || [])
const hasNextPage = computed(() => {
  if (!portalStore.searchResults) return false
  return (currentPage.value + 1) * portalStore.searchResults.size < portalStore.searchResults.total
})

async function handleSearch() {
  if (!searchKeyword.value.trim()) return
  loading.value = true
  searched.value = true
  currentPage.value = 0
  try {
    await portalStore.searchApps(searchKeyword.value, currentPage.value)
  } catch (err) {
    logger.error('Failed to search apps:', err)
  } finally {
    loading.value = false
  }
}

async function goPage(page: number) {
  currentPage.value = page
  loading.value = true
  try {
    await portalStore.searchApps(searchKeyword.value, page)
  } catch (err) {
    logger.error('Failed to search apps:', err)
  } finally {
    loading.value = false
  }
}
</script>

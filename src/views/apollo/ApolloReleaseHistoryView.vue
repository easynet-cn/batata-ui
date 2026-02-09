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
        {{ t('apolloReleaseHistory') }}
      </span>
    </div>

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloReleaseHistory') }}
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

    <!-- Releases Table -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <div
        v-if="releaseList.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <Rocket :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoReleases') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloReleaseId') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('name') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloReleaseKey') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloComment') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('status') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloCreatedBy') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloCreatedTime') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="release in releaseList" :key="release.releaseKey">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ release.id || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ release.name }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
              >
                {{ release.releaseKey }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-500"
              >
                {{ release.comment || '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-1.5">
                  <span
                    :class="[
                      'px-2.5 py-1 text-xs font-bold rounded-lg',
                      release.isAbandoned
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                    ]"
                  >
                    {{ release.isAbandoned ? t('apolloIsAbandoned') : t('active') }}
                  </span>
                  <span
                    v-if="release.isEmergencyPublish"
                    class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                  >
                    {{ t('apolloIsEmergencyPublish') }}
                  </span>
                </div>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ release.dataChangeCreatedBy || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ release.dataChangeCreatedTime || '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <button
                    @click="viewReleaseDetail(release)"
                    class="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    :title="t('viewDetails')"
                  >
                    <Eye :size="14" />
                  </button>
                  <button
                    v-if="release.id && !release.isAbandoned"
                    @click="confirmRollback(release)"
                    class="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    :title="t('apolloRollback')"
                  >
                    <RotateCcw :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalReleases > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('total') }} {{ totalReleases }} {{ t('items') }}
        </span>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage === 0"
            @click="goToPage(currentPage - 1)"
            class="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {{ t('previous') }}
          </button>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ currentPage + 1 }} / {{ totalPages }}
          </span>
          <button
            :disabled="currentPage >= totalPages - 1"
            @click="goToPage(currentPage + 1)"
            class="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {{ t('next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Release Detail Modal -->
    <template v-if="showDetailModal && selectedRelease">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDetailModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDetailModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloReleaseConfigurations') }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ selectedRelease.name }} ({{ selectedRelease.releaseKey }})
            </p>
          </div>
          <div class="p-6 overflow-y-auto flex-1">
            <div
              v-if="Object.keys(selectedRelease.configurations).length > 0"
              class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 overflow-x-auto"
            >
              <table class="w-full">
                <thead>
                  <tr>
                    <th
                      class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left"
                    >
                      {{ t('apolloKey') }}
                    </th>
                    <th
                      class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left"
                    >
                      {{ t('apolloValue') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key) in selectedRelease.configurations" :key="key">
                    <td class="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ key }}
                    </td>
                    <td
                      class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 max-w-md break-all"
                    >
                      {{ value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              {{ t('noData') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end">
            <button
              @click="showDetailModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('close') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Rollback Confirmation -->
    <template v-if="showRollbackModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showRollbackModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showRollbackModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloRollback') }}
            </h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmRollback') }}
            </p>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-2">
              {{ t('apolloRollbackWarning') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showRollbackModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleRollback"
              class="px-5 py-2 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
            >
              {{ t('apolloRollback') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronRight, RefreshCw, Rocket, Eye, RotateCcw } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloStore } from '@/stores/apollo'
import type { ApolloRelease } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const route = useRoute()
const apolloStore = useApolloStore()

const appId = route.params.appId as string
const env = route.params.env as string
const clusterName = route.params.clusterName as string
const namespaceName = route.params.namespaceName as string

const loading = ref(false)
const currentPage = ref(0)
const pageSize = ref(20)
const showDetailModal = ref(false)
const showRollbackModal = ref(false)
const selectedRelease = ref<ApolloRelease | null>(null)
const rollbackTarget = ref<ApolloRelease | null>(null)

const releaseList = computed(() => {
  return apolloStore.releases?.content || []
})

const totalReleases = computed(() => {
  return apolloStore.releases?.total || 0
})

const totalPages = computed(() => {
  if (!apolloStore.releases) return 1
  return Math.max(1, Math.ceil(apolloStore.releases.total / pageSize.value))
})

function viewReleaseDetail(release: ApolloRelease) {
  selectedRelease.value = release
  showDetailModal.value = true
}

function confirmRollback(release: ApolloRelease) {
  rollbackTarget.value = release
  showRollbackModal.value = true
}

async function handleRollback() {
  if (!rollbackTarget.value?.id) return
  try {
    await apolloStore.rollbackRelease(env, rollbackTarget.value.id, 'admin')
    showRollbackModal.value = false
    rollbackTarget.value = null
    await fetchReleases()
  } catch (err) {
    logger.error('Failed to rollback release:', err)
  }
}

async function goToPage(page: number) {
  currentPage.value = page
  await fetchReleases()
}

async function fetchReleases() {
  loading.value = true
  try {
    await apolloStore.fetchReleases(
      env,
      appId,
      clusterName,
      namespaceName,
      currentPage.value,
      pageSize.value,
    )
  } catch (err) {
    logger.error('Failed to fetch releases:', err)
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  currentPage.value = 0
  await fetchReleases()
}

onMounted(() => {
  refreshData()
})
</script>

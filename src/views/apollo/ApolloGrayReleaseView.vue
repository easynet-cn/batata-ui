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
        {{ t('apolloGrayRelease') }}
      </span>
    </div>

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloGrayRelease') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ appId }} &middot; {{ env }} &middot; {{ clusterName }} &middot; {{ namespaceName }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="refreshData"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button
          v-if="!apolloStore.branch"
          @click="handleCreateBranch"
          :disabled="loading"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <GitBranch :size="14" />
          {{ t('apolloCreateBranch') }}
        </button>
      </div>
    </div>

    <!-- No Branch State -->
    <div
      v-if="!apolloStore.branch && !loading"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 text-center"
    >
      <GitBranch :size="40" class="mx-auto mb-3 text-gray-300 dark:text-gray-600 opacity-50" />
      <p class="text-sm text-gray-400 dark:text-gray-500">{{ t('apolloNoBranch') }}</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {{ t('apolloCreateBranch') }}
      </p>
    </div>

    <!-- Branch Info -->
    <template v-if="apolloStore.branch">
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ t('apolloBranch') }}
          </h3>
          <div class="flex items-center gap-2">
            <button
              @click="showGrayPublishModal = true"
              class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
            >
              <Rocket :size="14" />
              {{ t('apolloGrayPublish') }}
            </button>
            <button
              @click="showMergeModal = true"
              class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <GitMerge :size="14" />
              {{ t('apolloMerge') }}
            </button>
            <button
              @click="showDeleteBranchModal = true"
              class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
            >
              <Trash2 :size="14" />
              {{ t('apolloDeleteBranch') }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
              {{ t('apolloBranchName') }}
            </p>
            <p class="text-sm text-gray-900 dark:text-gray-100 font-medium">
              {{ apolloStore.branch.branchName }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
              {{ t('apolloBranchStatus') }}
            </p>
            <span
              class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            >
              {{ apolloStore.branch.status || 'active' }}
            </span>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
              {{ t('apolloCreatedBy') }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ apolloStore.branch.dataChangeCreatedBy || '-' }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
            >
              {{ t('apolloCreatedTime') }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ apolloStore.branch.dataChangeCreatedTime || '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Gray Release Rules -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ t('apolloGrayRules') }}
          </h3>
          <button
            @click="showEditRulesModal = true"
            class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl transition-colors"
          >
            <Pencil :size="14" />
            {{ t('apolloEditGrayRules') }}
          </button>
        </div>

        <div
          v-if="!apolloStore.grayRules || apolloStore.grayRules.ruleItems.length === 0"
          class="text-center py-8 text-gray-400 dark:text-gray-500"
        >
          <Shield :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">{{ t('apolloNoGrayRules') }}</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th
                  class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
                >
                  {{ t('apolloClientAppId') }}
                </th>
                <th
                  class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
                >
                  {{ t('apolloClientIpList') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rule, idx) in apolloStore.grayRules.ruleItems" :key="idx">
                <td
                  class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {{ rule.clientAppId }}
                </td>
                <td
                  class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
                >
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="ip in rule.clientIpList"
                      :key="ip"
                      class="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {{ ip }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Edit Gray Rules Modal -->
    <template v-if="showEditRulesModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showEditRulesModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showEditRulesModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-lg"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloEditGrayRules') }}
            </h3>
          </div>
          <div class="p-6 space-y-4 max-h-96 overflow-y-auto">
            <div
              v-for="(rule, idx) in rulesForm"
              :key="idx"
              class="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Rule {{ idx + 1 }}
                </span>
                <button
                  @click="rulesForm.splice(idx, 1)"
                  class="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloClientAppId') }}
                </label>
                <input
                  v-model="rule.clientAppId"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloClientIpList') }}
                </label>
                <input
                  v-model="rule.ipListStr"
                  :placeholder="t('apolloIpPlaceholder')"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <button
              @click="rulesForm.push({ clientAppId: '', ipListStr: '' })"
              class="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-orange-600 dark:text-orange-400 border border-dashed border-orange-300 dark:border-orange-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors justify-center"
            >
              <Plus :size="14" />
              {{ t('apolloAddRule') }}
            </button>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showEditRulesModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleSaveRules"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('save') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Gray Publish Modal -->
    <template v-if="showGrayPublishModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showGrayPublishModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showGrayPublishModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloGrayPublish') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleaseTitle') }}
              </label>
              <input
                v-model="grayReleaseForm.releaseTitle"
                :placeholder="t('apolloReleaseTitlePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleaseComment') }}
              </label>
              <textarea
                v-model="grayReleaseForm.releaseComment"
                :placeholder="t('apolloReleaseCommentPlaceholder')"
                rows="3"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 resize-none"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleasedBy') }}
              </label>
              <input
                v-model="grayReleaseForm.releasedBy"
                placeholder="admin"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showGrayPublishModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleGrayPublish"
              class="px-5 py-2 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
            >
              {{ t('apolloGrayPublish') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Merge Modal -->
    <template v-if="showMergeModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showMergeModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showMergeModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloMerge') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmMerge') }}
            </p>
            <p class="text-xs text-amber-600 dark:text-amber-400">
              {{ t('apolloMergeWarning') }}
            </p>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleaseTitle') }}
              </label>
              <input
                v-model="mergeForm.releaseTitle"
                :placeholder="t('apolloReleaseTitlePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleasedBy') }}
              </label>
              <input
                v-model="mergeForm.releasedBy"
                placeholder="admin"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showMergeModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleMerge"
              class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              {{ t('apolloMerge') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Branch Modal -->
    <template v-if="showDeleteBranchModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDeleteBranchModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteBranchModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloDeleteBranch') }}
            </h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmDeleteBranch') }}
            </p>
            <p class="text-xs text-red-600 dark:text-red-400 mt-2">
              {{ t('apolloDeleteBranchWarning') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showDeleteBranchModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleDeleteBranch"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ChevronRight,
  RefreshCw,
  GitBranch,
  GitMerge,
  Rocket,
  Shield,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-vue-next'
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
const showEditRulesModal = ref(false)
const showGrayPublishModal = ref(false)
const showMergeModal = ref(false)
const showDeleteBranchModal = ref(false)

const rulesForm = ref<{ clientAppId: string; ipListStr: string }[]>([])
const grayReleaseForm = ref({ releaseTitle: '', releaseComment: '', releasedBy: 'admin' })
const mergeForm = ref({ releaseTitle: '', releaseComment: '', releasedBy: 'admin' })

async function refreshData() {
  loading.value = true
  try {
    await apolloStore.fetchBranch(env, appId, clusterName, namespaceName)
    if (apolloStore.branch) {
      await apolloStore.fetchGrayRules(
        env,
        appId,
        clusterName,
        namespaceName,
        apolloStore.branch.branchName,
      )
      // Populate rules form
      if (apolloStore.grayRules) {
        rulesForm.value = apolloStore.grayRules.ruleItems.map((r) => ({
          clientAppId: r.clientAppId,
          ipListStr: r.clientIpList.join(', '),
        }))
      }
    }
  } catch (err) {
    logger.error('Failed to fetch gray release data:', err)
  } finally {
    loading.value = false
  }
}

async function handleCreateBranch() {
  try {
    await apolloStore.createBranch(env, appId, clusterName, namespaceName, 'admin')
    await refreshData()
  } catch (err) {
    logger.error('Failed to create branch:', err)
  }
}

async function handleSaveRules() {
  if (!apolloStore.branch) return
  try {
    await apolloStore.updateGrayRules(
      env,
      appId,
      clusterName,
      namespaceName,
      apolloStore.branch.branchName,
      {
        ruleItems: rulesForm.value.map((r) => ({
          clientAppId: r.clientAppId,
          clientIpList: r.ipListStr
            .split(',')
            .map((ip) => ip.trim())
            .filter(Boolean),
        })),
      },
    )
    showEditRulesModal.value = false
    await refreshData()
  } catch (err) {
    logger.error('Failed to save gray rules:', err)
  }
}

async function handleGrayPublish() {
  if (!apolloStore.branch) return
  try {
    await apolloStore.createGrayRelease(
      env,
      appId,
      clusterName,
      namespaceName,
      apolloStore.branch.branchName,
      grayReleaseForm.value,
    )
    showGrayPublishModal.value = false
    grayReleaseForm.value = { releaseTitle: '', releaseComment: '', releasedBy: 'admin' }
  } catch (err) {
    logger.error('Failed to create gray release:', err)
  }
}

async function handleMerge() {
  if (!apolloStore.branch) return
  try {
    await apolloStore.mergeGrayRelease(
      env,
      appId,
      clusterName,
      namespaceName,
      apolloStore.branch.branchName,
      mergeForm.value,
    )
    showMergeModal.value = false
    mergeForm.value = { releaseTitle: '', releaseComment: '', releasedBy: 'admin' }
    await refreshData()
  } catch (err) {
    logger.error('Failed to merge gray release:', err)
  }
}

async function handleDeleteBranch() {
  if (!apolloStore.branch) return
  try {
    await apolloStore.deleteBranch(
      env,
      appId,
      clusterName,
      namespaceName,
      apolloStore.branch.branchName,
      'admin',
    )
    showDeleteBranchModal.value = false
    await refreshData()
  } catch (err) {
    logger.error('Failed to delete branch:', err)
  }
}

onMounted(() => {
  refreshData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb / Back -->
    <div class="flex items-center gap-2 text-sm">
      <RouterLink
        to="/apps"
        class="text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1"
      >
        <ArrowLeft :size="14" />
        {{ t('apolloBackToApps') }}
      </RouterLink>
    </div>

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ currentApp?.name || appId }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloAppId') }}: {{ appId }}
          <template v-if="currentApp?.orgName"> &middot; {{ currentApp.orgName }} </template>
          <template v-if="currentApp?.ownerName"> &middot; {{ currentApp.ownerName }} </template>
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
          @click="showCreateClusterModal = true"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Plus :size="14" />
          {{ t('apolloCreateCluster') }}
        </button>
        <button
          @click="showCreateNamespaceModal = true"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Plus :size="14" />
          {{ t('apolloCreateNamespace') }}
        </button>
      </div>
    </div>

    <!-- Environments & Clusters -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('apolloEnvClusters') }}
      </h3>

      <div
        v-if="apolloStore.envClusters.length === 0 && !loading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Layers :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('noData') }}</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="ec in apolloStore.envClusters"
          :key="ec.env"
          class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
        >
          <!-- Env Header -->
          <div
            class="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between cursor-pointer"
            @click="toggleEnv(ec.env)"
          >
            <div class="flex items-center gap-2">
              <ChevronRight
                :size="16"
                :class="[
                  'text-gray-400 transition-transform',
                  expandedEnvs.has(ec.env) && 'rotate-90',
                ]"
              />
              <span
                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
              >
                {{ ec.env }}
              </span>
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ ec.clusters.length }} {{ t('apolloClusters').toLowerCase() }}
              </span>
            </div>
          </div>

          <!-- Clusters -->
          <div
            v-if="expandedEnvs.has(ec.env)"
            class="divide-y divide-gray-100 dark:divide-gray-800"
          >
            <div
              v-for="cluster in ec.clusters"
              :key="`${ec.env}-${cluster}`"
              class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center"
                >
                  <Server :size="14" class="text-orange-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ cluster }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ ec.env }} / {{ cluster }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="viewNamespaces(ec.env, cluster)"
                  class="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                >
                  {{ t('apolloViewNamespace') }}
                </button>
                <button
                  v-if="cluster !== 'default'"
                  @click="confirmDeleteCluster(ec.env, cluster)"
                  class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  :title="t('apolloDeleteCluster')"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Namespaces (shown when env/cluster is selected) -->
    <div
      v-if="selectedEnv && selectedCluster"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ t('apolloNamespaces') }} — {{ selectedEnv }} / {{ selectedCluster }}
        </h3>
      </div>

      <div
        v-if="apolloStore.namespaces.length === 0 && !nsLoading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Layers :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('apolloNoNamespaces') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloNamespace') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloFormat') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('type') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ns in apolloStore.namespaces" :key="ns.namespaceName">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                <RouterLink
                  :to="`/namespace/${appId}/${selectedEnv}/${selectedCluster}/${ns.namespaceName}`"
                  class="text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {{ ns.namespaceName }}
                </RouterLink>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                <span
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  {{ ns.format }}
                </span>
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <span
                  :class="[
                    'px-2.5 py-1 text-xs font-bold rounded-lg',
                    ns.isPublic
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                  ]"
                >
                  {{ ns.isPublic ? t('apolloPublic') : t('apolloPrivate') }}
                </span>
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <RouterLink
                    :to="`/namespace/${appId}/${selectedEnv}/${selectedCluster}/${ns.namespaceName}`"
                    class="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                  >
                    {{ t('viewDetails') }}
                  </RouterLink>
                  <button
                    @click="confirmDeleteNamespace(ns.namespaceName)"
                    class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    :title="t('apolloDeleteNamespace')"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Cluster Modal -->
    <template v-if="showCreateClusterModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showCreateClusterModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateClusterModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloCreateCluster') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloEnvironment') }}
              </label>
              <input
                v-model="clusterForm.env"
                placeholder="DEV"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('name') }}
              </label>
              <input
                v-model="clusterForm.name"
                :placeholder="t('apolloClusterNamePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showCreateClusterModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleCreateCluster"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('create') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Cluster Modal -->
    <template v-if="showDeleteClusterModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDeleteClusterModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteClusterModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloDeleteCluster') }}
            </h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmDeleteCluster') }}
            </p>
            <p class="text-xs text-red-600 dark:text-red-400 mt-2">
              {{ t('apolloDeleteClusterWarning') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showDeleteClusterModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleDeleteCluster"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Namespace Modal -->
    <template v-if="showDeleteNamespaceModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDeleteNamespaceModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteNamespaceModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloDeleteNamespace') }}
            </h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmDeleteNamespace') }}
            </p>
            <p class="text-xs text-red-600 dark:text-red-400 mt-2">
              {{ t('apolloDeleteNamespaceWarning') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showDeleteNamespaceModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleDeleteNamespace"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Namespace Modal -->
    <template v-if="showCreateNamespaceModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showCreateNamespaceModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateNamespaceModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloCreateNamespace') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('name') }}
              </label>
              <input
                v-model="nsForm.name"
                :placeholder="t('apolloNamespaceNamePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloFormat') }}
              </label>
              <select
                v-model="nsForm.format"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="properties">properties</option>
                <option value="yaml">yaml</option>
                <option value="json">json</option>
                <option value="xml">xml</option>
                <option value="yml">yml</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                v-model="nsForm.isPublic"
                class="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
              />
              <label for="isPublic" class="text-sm text-gray-700 dark:text-gray-300">
                {{ t('apolloPublic') }}
              </label>
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showCreateNamespaceModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleCreateNamespace"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('create') }}
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
import { ArrowLeft, RefreshCw, Plus, Layers, Server, ChevronRight, Trash2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloStore } from '@/stores/apollo'
import type { ApolloNamespaceFormat } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const route = useRoute()
const apolloStore = useApolloStore()

const appId = route.params.appId as string
const currentApp = ref(apolloStore.currentApp)
const loading = ref(false)
const nsLoading = ref(false)

const expandedEnvs = ref<Set<string>>(new Set())
const selectedEnv = ref('')
const selectedCluster = ref('')

const showCreateClusterModal = ref(false)
const showCreateNamespaceModal = ref(false)
const showDeleteClusterModal = ref(false)
const showDeleteNamespaceModal = ref(false)
const deleteClusterTarget = ref<{ env: string; name: string } | null>(null)
const deleteNamespaceTarget = ref<string | null>(null)

const clusterForm = ref({ env: '', name: '' })
const nsForm = ref<{ name: string; format: ApolloNamespaceFormat; isPublic: boolean }>({
  name: '',
  format: 'properties',
  isPublic: false,
})

function toggleEnv(env: string) {
  if (expandedEnvs.value.has(env)) {
    expandedEnvs.value.delete(env)
  } else {
    expandedEnvs.value.add(env)
  }
}

async function viewNamespaces(env: string, cluster: string) {
  selectedEnv.value = env
  selectedCluster.value = cluster
  nsLoading.value = true
  try {
    await apolloStore.fetchNamespaces(env, appId, cluster)
  } catch (err) {
    logger.error('Failed to fetch namespaces:', err)
  } finally {
    nsLoading.value = false
  }
}

async function refreshData() {
  loading.value = true
  try {
    await Promise.allSettled([apolloStore.fetchApp(appId), apolloStore.fetchEnvClusters(appId)])
    currentApp.value = apolloStore.currentApp
    // Expand all envs by default
    apolloStore.envClusters.forEach((ec) => expandedEnvs.value.add(ec.env))
  } catch (err) {
    logger.error('Failed to fetch app detail:', err)
  } finally {
    loading.value = false
  }
}

async function handleCreateCluster() {
  try {
    await apolloStore.createCluster(appId, clusterForm.value.env, {
      name: clusterForm.value.name,
    })
    await apolloStore.fetchEnvClusters(appId)
    showCreateClusterModal.value = false
    clusterForm.value = { env: '', name: '' }
  } catch (err) {
    logger.error('Failed to create cluster:', err)
  }
}

function confirmDeleteCluster(env: string, clusterName: string) {
  deleteClusterTarget.value = { env, name: clusterName }
  showDeleteClusterModal.value = true
}

async function handleDeleteCluster() {
  if (!deleteClusterTarget.value) return
  try {
    await apolloStore.deleteCluster(
      deleteClusterTarget.value.env,
      appId,
      deleteClusterTarget.value.name,
      'admin',
    )
    await apolloStore.fetchEnvClusters(appId)
    showDeleteClusterModal.value = false
    deleteClusterTarget.value = null
  } catch (err) {
    logger.error('Failed to delete cluster:', err)
  }
}

function confirmDeleteNamespace(namespaceName: string) {
  deleteNamespaceTarget.value = namespaceName
  showDeleteNamespaceModal.value = true
}

async function handleDeleteNamespace() {
  if (!deleteNamespaceTarget.value || !selectedEnv.value || !selectedCluster.value) return
  try {
    await apolloStore.deleteNamespace(
      appId,
      selectedEnv.value,
      selectedCluster.value,
      deleteNamespaceTarget.value,
      'admin',
    )
    await apolloStore.fetchNamespaces(selectedEnv.value, appId, selectedCluster.value)
    showDeleteNamespaceModal.value = false
    deleteNamespaceTarget.value = null
  } catch (err) {
    logger.error('Failed to delete namespace:', err)
  }
}

async function handleCreateNamespace() {
  try {
    await apolloStore.createNamespace(appId, {
      name: nsForm.value.name,
      appId,
      format: nsForm.value.format,
      isPublic: nsForm.value.isPublic,
    })
    // Refresh namespaces if viewing a cluster
    if (selectedEnv.value && selectedCluster.value) {
      await apolloStore.fetchNamespaces(selectedEnv.value, appId, selectedCluster.value)
    }
    showCreateNamespaceModal.value = false
    nsForm.value = { name: '', format: 'properties', isPublic: false }
  } catch (err) {
    logger.error('Failed to create namespace:', err)
  }
}

onMounted(() => {
  refreshData()
})
</script>

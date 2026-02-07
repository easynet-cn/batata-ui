<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('configSync') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('configSyncDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="handleRefresh" class="btn btn-secondary btn-sm">
          <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button @click="showSyncModal = true" class="btn btn-primary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('syncNow') }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"
          >
            <Server class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('targetEnvironments') }}</p>
            <p class="text-lg font-semibold text-text-primary">{{ environments.length }}</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"
          >
            <CheckCircle class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('syncedConfigs') }}</p>
            <p class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {{ syncStats.synced }}
            </p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center"
          >
            <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('pendingSync') }}</p>
            <p class="text-lg font-semibold text-amber-600 dark:text-amber-400">
              {{ syncStats.pending }}
            </p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center"
          >
            <XCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('syncFailed') }}</p>
            <p class="text-lg font-semibold text-red-600 dark:text-red-400">
              {{ syncStats.failed }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Environment Selection -->
    <div class="card">
      <div class="p-4">
        <h2 class="text-sm font-semibold text-text-primary mb-3">{{ t('targetEnvironments') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            v-for="env in environments"
            :key="env.id"
            class="p-3 rounded-lg border-2 cursor-pointer transition-all"
            :class="
              selectedEnvs.includes(env.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            "
            @click="toggleEnvSelection(env.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="env.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'"
                />
                <span class="font-medium text-text-primary">{{ env.name }}</span>
              </div>
              <input
                type="checkbox"
                :checked="selectedEnvs.includes(env.id)"
                class="w-4 h-4 rounded text-primary"
                @click.stop
                @change="toggleEnvSelection(env.id)"
              />
            </div>
            <p class="text-xs text-text-tertiary mt-1">{{ env.endpoint }}</p>
            <div class="flex items-center gap-2 mt-2 text-xs">
              <span class="text-text-secondary">{{ env.configCount }} {{ t('configs') }}</span>
              <span class="text-text-tertiary">|</span>
              <span
                :class="
                  env.status === 'online'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                {{ t(env.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Config Selection -->
    <div class="card">
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-text-primary">{{ t('configsToSync') }}</h2>
          <div class="flex items-center gap-2">
            <input
              v-model="configSearch"
              type="text"
              class="input w-64"
              :placeholder="t('searchConfig')"
            />
            <button @click="selectAllConfigs" class="btn btn-ghost btn-sm">
              {{ t('selectAll') }}
            </button>
            <button @click="deselectAllConfigs" class="btn btn-ghost btn-sm">
              {{ t('deselectAll') }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th class="w-8">
                  <input
                    type="checkbox"
                    :checked="isAllConfigsSelected"
                    @change="toggleSelectAllConfigs"
                    class="w-3.5 h-3.5 rounded"
                  />
                </th>
                <th>{{ t('dataId') }}</th>
                <th>{{ t('group') }}</th>
                <th>{{ t('configType') }}</th>
                <th>{{ t('lastSync') }}</th>
                <th>{{ t('syncStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-6">
                  <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
                </td>
              </tr>
              <tr v-else-if="filteredConfigs.length === 0">
                <td colspan="6" class="text-center py-6 text-text-secondary">
                  {{ t('noData') }}
                </td>
              </tr>
              <tr v-for="config in filteredConfigs" :key="config.id" class="hover:bg-bg-secondary">
                <td>
                  <input
                    type="checkbox"
                    :checked="selectedConfigs.includes(config.id)"
                    @change="toggleConfigSelection(config.id)"
                    class="w-3.5 h-3.5 rounded"
                  />
                </td>
                <td class="font-medium">{{ config.dataId }}</td>
                <td>{{ config.groupName }}</td>
                <td>
                  <span class="badge badge-info">{{ config.type?.toUpperCase() || 'TEXT' }}</span>
                </td>
                <td class="text-text-secondary text-sm">
                  {{ config.lastSyncTime ? formatTime(config.lastSyncTime) : '-' }}
                </td>
                <td>
                  <span :class="getSyncStatusClass(config.syncStatus)">
                    {{ t(config.syncStatus || 'notSynced') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Sync History -->
    <div class="card">
      <div class="p-4">
        <h2 class="text-sm font-semibold text-text-primary mb-3">{{ t('syncHistory') }}</h2>
        <div class="space-y-2">
          <div
            v-for="history in syncHistory"
            :key="history.id"
            class="flex items-center justify-between p-3 rounded-lg bg-bg-secondary"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :class="
                  history.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    : history.status === 'failed'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                "
              >
                <CheckCircle v-if="history.status === 'success'" class="w-4 h-4" />
                <XCircle v-else-if="history.status === 'failed'" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
              </div>
              <div>
                <p class="text-sm font-medium text-text-primary">
                  {{ history.configCount }} {{ t('configsSynced') }}
                </p>
                <p class="text-xs text-text-tertiary">
                  {{ history.targetEnv }} • {{ formatTime(history.timestamp) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <span :class="getSyncStatusClass(history.status)">
                {{ t(history.status) }}
              </span>
              <p v-if="history.error" class="text-xs text-red-500 dark:text-red-400 mt-1">
                {{ history.error }}
              </p>
            </div>
          </div>
          <div v-if="syncHistory.length === 0" class="text-center py-6 text-text-secondary text-sm">
            {{ t('noSyncHistory') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Sync Modal -->
    <div v-if="showSyncModal" class="modal-backdrop" @click="showSyncModal = false">
      <div class="modal max-w-lg" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('syncConfigs') }}</h3>
          <button @click="showSyncModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-4">
          <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <RefreshCw class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                {{ t('syncConfirmTitle') }}
              </p>
              <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {{ t('syncConfirmDesc') }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">{{ t('selectedConfigs') }}:</span>
              <span class="font-medium text-text-primary">{{ selectedConfigs.length }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">{{ t('targetEnvironments') }}:</span>
              <span class="font-medium text-text-primary">{{ selectedEnvs.length }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('conflictPolicy') }}
            </label>
            <select v-model="syncPolicy" class="input">
              <option value="SKIP">{{ t('policySkip') }}</option>
              <option value="OVERWRITE">{{ t('policyOverwrite') }}</option>
              <option value="ABORT">{{ t('policyAbort') }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showSyncModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button
            @click="executeSync"
            class="btn btn-primary"
            :disabled="syncing || selectedConfigs.length === 0 || selectedEnvs.length === 0"
          >
            <Loader2 v-if="syncing" class="w-3.5 h-3.5 animate-spin" />
            <RefreshCw v-else class="w-3.5 h-3.5" />
            {{ t('startSync') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  RotateCcw,
  RefreshCw,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  X,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import type { ConfigInfo, Namespace } from '@/types'

interface SyncEnvironment {
  id: string
  name: string
  endpoint: string
  status: 'online' | 'offline'
  configCount: number
}

interface SyncConfig extends ConfigInfo {
  lastSyncTime?: number
  syncStatus?: 'synced' | 'pending' | 'failed' | 'notSynced'
}

interface SyncHistory {
  id: string
  configCount: number
  targetEnv: string
  timestamp: number
  status: 'success' | 'failed' | 'running'
  error?: string
}

const props = defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const syncing = ref(false)
const environments = ref<SyncEnvironment[]>([])
const configs = ref<SyncConfig[]>([])
const syncHistory = ref<SyncHistory[]>([])
const selectedEnvs = ref<string[]>([])
const selectedConfigs = ref<string[]>([])
const configSearch = ref('')
const syncPolicy = ref<'SKIP' | 'OVERWRITE' | 'ABORT'>('SKIP')
const showSyncModal = ref(false)

// Computed
const syncStats = computed(() => {
  return {
    synced: configs.value.filter((c) => c.syncStatus === 'synced').length,
    pending: configs.value.filter((c) => c.syncStatus === 'pending').length,
    failed: configs.value.filter((c) => c.syncStatus === 'failed').length,
  }
})

const filteredConfigs = computed(() => {
  if (!configSearch.value) return configs.value
  const search = configSearch.value.toLowerCase()
  return configs.value.filter(
    (c) => c.dataId.toLowerCase().includes(search) || c.groupName.toLowerCase().includes(search),
  )
})

const isAllConfigsSelected = computed(() => {
  return (
    filteredConfigs.value.length > 0 &&
    filteredConfigs.value.every((c) => selectedConfigs.value.includes(c.id))
  )
})

// Methods
const fetchEnvironments = async () => {
  try {
    const response = await batataApi.getSyncEnvironments()
    environments.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch environments:', error)
    // Fallback to empty array
    environments.value = []
  }
}

const fetchConfigs = async () => {
  loading.value = true
  try {
    const response = await batataApi.getConfigList({
      pageNo: 1,
      pageSize: 1000,
      namespaceId: props.namespace.namespace,
    })
    configs.value = (response.data.data.pageItems || []).map((c: ConfigInfo) => ({
      ...c,
      syncStatus: 'notSynced' as const,
    }))
  } catch (error) {
    console.error('Failed to fetch configs:', error)
  } finally {
    loading.value = false
  }
}

const fetchSyncHistory = async () => {
  try {
    const response = await batataApi.getSyncHistory(props.namespace.namespace)
    syncHistory.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch sync history:', error)
    syncHistory.value = []
  }
}

const handleRefresh = () => {
  fetchEnvironments()
  fetchConfigs()
  fetchSyncHistory()
}

const toggleEnvSelection = (envId: string) => {
  const index = selectedEnvs.value.indexOf(envId)
  if (index > -1) {
    selectedEnvs.value.splice(index, 1)
  } else {
    selectedEnvs.value.push(envId)
  }
}

const toggleConfigSelection = (configId: string) => {
  const index = selectedConfigs.value.indexOf(configId)
  if (index > -1) {
    selectedConfigs.value.splice(index, 1)
  } else {
    selectedConfigs.value.push(configId)
  }
}

const toggleSelectAllConfigs = () => {
  if (isAllConfigsSelected.value) {
    selectedConfigs.value = []
  } else {
    selectedConfigs.value = filteredConfigs.value.map((c) => c.id)
  }
}

const selectAllConfigs = () => {
  selectedConfigs.value = filteredConfigs.value.map((c) => c.id)
}

const deselectAllConfigs = () => {
  selectedConfigs.value = []
}

const executeSync = async () => {
  if (selectedConfigs.value.length === 0 || selectedEnvs.value.length === 0) {
    toast.warning(t('selectConfigsAndEnvs'))
    return
  }

  syncing.value = true
  try {
    await batataApi.syncConfigs({
      configIds: selectedConfigs.value,
      targetEnvIds: selectedEnvs.value,
      policy: syncPolicy.value,
      sourceTenant: props.namespace.namespace,
    })
    toast.success(t('syncStarted'))
    showSyncModal.value = false
    // Refresh after sync
    setTimeout(() => {
      fetchSyncHistory()
      fetchConfigs()
    }, 1000)
  } catch (error) {
    console.error('Failed to sync configs:', error)
    toast.error(t('syncFailed'))
  } finally {
    syncing.value = false
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

const getSyncStatusClass = (status?: string) => {
  const classes: Record<string, string> = {
    synced: 'badge badge-success',
    success: 'badge badge-success',
    pending: 'badge badge-warning',
    running: 'badge badge-info',
    failed: 'badge badge-danger',
    notSynced: 'badge badge-secondary',
  }
  return classes[status || 'notSynced'] || 'badge badge-secondary'
}

// Watch namespace change
watch(
  () => props.namespace,
  () => {
    fetchConfigs()
    fetchSyncHistory()
  },
)

// Lifecycle
onMounted(() => {
  fetchEnvironments()
  fetchConfigs()
  fetchSyncHistory()
})
</script>

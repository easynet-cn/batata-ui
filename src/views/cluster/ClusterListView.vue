<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('cluster') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('clusterDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="handleRefreshSelf" class="btn btn-secondary btn-sm" :disabled="refreshing">
          <Zap class="w-3.5 h-3.5" />
          {{ t('refreshSelf') }}
        </button>
        <button @click="fetchAll" class="btn btn-secondary btn-sm" :disabled="loading">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
      </div>
    </div>

    <!-- Health Summary -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
      <div class="card p-3">
        <div class="text-xs text-text-secondary">{{ t('clusterTotal') }}</div>
        <div class="text-xl font-semibold text-text-primary mt-0.5">{{ health?.total ?? '-' }}</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-text-secondary">{{ t('stateUp') }}</div>
        <div class="text-xl font-semibold text-emerald-600 mt-0.5">{{ health?.up ?? '-' }}</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-text-secondary">{{ t('stateDown') }}</div>
        <div class="text-xl font-semibold text-red-600 mt-0.5">{{ health?.down ?? '-' }}</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-text-secondary">{{ t('stateSuspicious') }}</div>
        <div class="text-xl font-semibold text-amber-600 mt-0.5">
          {{ health?.suspicious ?? '-' }}
        </div>
      </div>
      <div class="card p-3 col-span-2 md:col-span-1">
        <div class="text-xs text-text-secondary">{{ t('clusterLeader') }}</div>
        <div
          class="text-sm font-mono font-semibold text-text-primary mt-0.5 truncate"
          :title="leader?.leader || ''"
        >
          {{ leader?.leader || t('noLeader') }}
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('searchByIp')
            }}</label>
            <input
              v-model="searchKeyword"
              type="text"
              class="input"
              :placeholder="t('searchByIp')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex items-end gap-1.5">
            <button @click="handleSearch" class="btn btn-primary">
              <Search class="w-3.5 h-3.5" />
              {{ t('search') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cluster Nodes -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('nodeAddress') }}</th>
              <th>{{ t('state') }}</th>
              <th>{{ t('abilities') }}</th>
              <th>{{ t('extendInfo') }}</th>
              <th class="text-right">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && nodes.length === 0">
              <td colspan="5" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="nodes.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <template v-for="node in nodes" :key="node.address">
              <tr class="hover:bg-bg-secondary">
                <td>
                  <div class="flex items-center gap-2">
                    <Server class="w-3.5 h-3.5 text-primary" />
                    <span class="font-mono">{{ node.address }}</span>
                    <span
                      v-if="leader?.leader === node.address"
                      class="badge badge-primary text-xs"
                      :title="t('clusterLeader')"
                    >
                      <Crown class="w-3 h-3 inline-block mr-0.5" />
                      Leader
                    </span>
                  </div>
                </td>
                <td>
                  <span :class="getStateClass(node.state)">
                    {{ node.state }}
                  </span>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-if="node.abilities?.remoteAbility?.supportRemoteConnection"
                      class="badge badge-success text-xs"
                    >
                      Remote
                    </span>
                    <span
                      v-if="node.abilities?.configAbility?.supportRemoteMetrics"
                      class="badge badge-info text-xs"
                    >
                      Metrics
                    </span>
                    <span
                      v-if="node.abilities?.namingAbility?.supportJraft"
                      class="badge badge-primary text-xs"
                    >
                      Raft
                    </span>
                  </div>
                </td>
                <td>
                  <button
                    v-if="node.extendInfo && Object.keys(node.extendInfo).length > 0"
                    @click="toggleNode(node.address)"
                    class="btn btn-ghost btn-sm"
                    :title="t('viewDetails')"
                  >
                    <ChevronDown
                      class="w-3.5 h-3.5 transition-transform"
                      :class="{ 'rotate-180': expandedNodes.has(node.address) }"
                    />
                    <span class="text-xs text-text-secondary">
                      {{ Object.keys(node.extendInfo).length }} keys
                    </span>
                  </button>
                  <span v-else class="text-text-tertiary">-</span>
                </td>
                <td class="text-right">
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="openStateDialog(node)"
                    :title="t('updateState')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                    {{ t('updateState') }}
                  </button>
                </td>
              </tr>
              <!-- Expanded extendInfo row -->
              <tr v-if="expandedNodes.has(node.address) && node.extendInfo">
                <td colspan="5" class="!pt-0 !pb-4 !px-6">
                  <div
                    class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono border border-border-primary"
                  >
                    <pre class="whitespace-pre-wrap break-all">{{
                      JSON.stringify(node.extendInfo, null, 2)
                    }}</pre>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Update State Modal -->
    <div
      v-if="stateDialog.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="stateDialog.open = false"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 border dark:border-gray-800"
      >
        <div class="p-6 border-b border-border-primary">
          <h3 class="text-base font-semibold text-text-primary">{{ t('updateState') }}</h3>
          <p class="text-xs text-text-secondary mt-1 font-mono">{{ stateDialog.address }}</p>
        </div>
        <div class="p-6 space-y-3">
          <label class="block text-xs font-medium text-text-secondary">{{ t('newState') }}</label>
          <select v-model="stateDialog.newState" class="input">
            <option v-for="s in VALID_STATES" :key="s" :value="s">{{ s }}</option>
          </select>
          <p class="text-xs text-text-tertiary">
            {{ t('currentState') }}: <span class="font-mono">{{ stateDialog.currentState }}</span>
          </p>
        </div>
        <div class="p-4 bg-bg-secondary rounded-b-3xl flex justify-end gap-2">
          <button class="btn btn-secondary btn-sm" @click="stateDialog.open = false">
            {{ t('cancel') }}
          </button>
          <button
            class="btn btn-primary btn-sm"
            :disabled="stateDialog.submitting || stateDialog.newState === stateDialog.currentState"
            @click="submitStateChange"
          >
            <Loader2 v-if="stateDialog.submitting" class="w-3.5 h-3.5 animate-spin" />
            {{ t('confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  RefreshCw,
  Server,
  Loader2,
  ChevronDown,
  Search,
  RotateCcw,
  Pencil,
  Zap,
  Crown,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { NodeInfo, Namespace, ClusterHealth, ClusterLeader, ClusterNodeState } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

const VALID_STATES: ClusterNodeState[] = ['UP', 'DOWN', 'SUSPICIOUS', 'STARTING', 'ISOLATION']

// State
const loading = ref(false)
const refreshing = ref(false)
const nodes = ref<NodeInfo[]>([])
const health = ref<ClusterHealth | null>(null)
const leader = ref<ClusterLeader | null>(null)
const expandedNodes = ref<Set<string>>(new Set())
const searchKeyword = ref('')

const stateDialog = reactive({
  open: false,
  address: '',
  currentState: '' as string,
  newState: 'UP' as ClusterNodeState,
  submitting: false,
})

// Methods
const fetchNodes = async () => {
  loading.value = true
  try {
    const params = searchKeyword.value ? { keyword: searchKeyword.value } : undefined
    const response = await batataApi.getClusterNodes(params)
    nodes.value = response.data.data || []
  } catch (error) {
    logger.error('Failed to fetch nodes:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

const fetchHealth = async () => {
  try {
    const response = await batataApi.getClusterHealth()
    health.value = response.data.data || null
  } catch (error) {
    logger.error('Failed to fetch cluster health:', error)
  }
}

const fetchLeader = async () => {
  try {
    const response = await batataApi.getClusterLeader()
    leader.value = response.data.data || null
  } catch (error) {
    logger.error('Failed to fetch leader:', error)
  }
}

const fetchAll = async () => {
  await Promise.all([fetchNodes(), fetchHealth(), fetchLeader()])
}

const handleSearch = () => {
  fetchNodes()
}

const handleReset = () => {
  searchKeyword.value = ''
  fetchNodes()
}

const handleRefreshSelf = async () => {
  refreshing.value = true
  try {
    await batataApi.refreshClusterSelf()
    toast.success(t('refreshSelfSuccess'))
    await fetchAll()
  } catch (error) {
    logger.error('Failed to refresh self:', error)
    toast.apiError(error)
  } finally {
    refreshing.value = false
  }
}

const openStateDialog = (node: NodeInfo) => {
  stateDialog.address = node.address
  stateDialog.currentState = node.state
  stateDialog.newState = node.state as ClusterNodeState
  stateDialog.open = true
}

const submitStateChange = async () => {
  stateDialog.submitting = true
  try {
    await batataApi.updateClusterNodeState(stateDialog.address, stateDialog.newState)
    toast.success(t('updateStateSuccess'))
    stateDialog.open = false
    await fetchAll()
  } catch (error) {
    logger.error('Failed to update node state:', error)
    toast.apiError(error)
  } finally {
    stateDialog.submitting = false
  }
}

const getStateClass = (state: string) => {
  const classes: Record<string, string> = {
    UP: 'badge badge-success',
    DOWN: 'badge badge-danger',
    SUSPICIOUS: 'badge badge-warning',
    STARTING: 'badge badge-info',
    ISOLATION: 'badge',
  }
  return classes[state] || 'badge'
}

const toggleNode = (address: string) => {
  if (expandedNodes.value.has(address)) {
    expandedNodes.value.delete(address)
  } else {
    expandedNodes.value.add(address)
  }
}

onMounted(() => {
  fetchAll()
})
</script>

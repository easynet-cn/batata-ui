<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">
            {{ t('serviceDetail') }}: {{ serviceName }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('backToServices') }}</p>
        </div>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && serviceNodes.length === 0" class="card">
      <div class="p-6 text-center">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-fuchsia-600" />
        <p class="text-sm text-text-secondary mt-2">{{ t('loading') }}</p>
      </div>
    </div>

    <template v-else>
      <!-- Service Info Header -->
      <div class="card">
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ serviceName }}</h2>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="tag in serviceTags"
                  :key="tag"
                  class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                >
                  {{ tag }}
                </span>
                <span v-if="serviceTags.length === 0" class="text-xs text-text-tertiary">
                  {{ t('noTags') }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-success">
                {{ healthSummary.passing }} {{ t('passing') }}
              </span>
              <span v-if="healthSummary.warning > 0" class="badge badge-warning">
                {{ healthSummary.warning }} {{ t('warning') }}
              </span>
              <span v-if="healthSummary.critical > 0" class="badge badge-danger">
                {{ healthSummary.critical }} {{ t('critical') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="flex gap-1 p-1 bg-bg-secondary rounded-xl">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="switchTab(tab.key)"
          :class="
            activeTab === tab.key
              ? 'bg-fuchsia-600 text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary'
          "
          class="px-4 py-2 text-xs font-bold rounded-xl transition-colors"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Instances Table -->
      <div v-show="activeTab === 'instances'" class="card">
        <div class="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('serviceInstances') }} ({{ filteredServiceNodes.length }})
          </h3>
          <select v-model="instanceStatusFilter" class="input w-40 text-xs">
            <option value="all">{{ t('all') }}</option>
            <option value="passing">{{ t('passing') }}</option>
            <option value="warning">{{ t('warning') }}</option>
            <option value="critical">{{ t('critical') }}</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('node') }}</th>
                <th>{{ t('address') }}</th>
                <th>{{ t('servicePort') }}</th>
                <th>{{ t('serviceId') }}</th>
                <th>{{ t('healthStatus') }}</th>
                <th class="w-32">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredServiceNodes.length === 0">
                <td colspan="6" class="text-center py-6 text-text-secondary">
                  {{ t('noInstances') }}
                </td>
              </tr>
              <tr
                v-for="node in filteredServiceNodes"
                :key="node.Service.ID"
                class="hover:bg-bg-secondary"
              >
                <td class="font-medium text-text-primary">{{ node.Node.Node }}</td>
                <td class="text-text-secondary font-mono text-xs">
                  {{ node.Service.Address || node.Node.Address }}
                </td>
                <td>{{ node.Service.Port }}</td>
                <td class="text-text-secondary text-xs">{{ node.Service.ID }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <template v-if="node.Checks && node.Checks.length > 0">
                      <span
                        v-for="check in node.Checks"
                        :key="check.CheckID"
                        :class="statusBadgeClass(check.Status)"
                        class="badge"
                      >
                        {{ check.Status }}
                      </span>
                    </template>
                    <span v-else class="text-xs text-text-tertiary">-</span>
                  </div>
                </td>
                <td>
                  <button
                    @click="toggleNodeDetail(node.Service.ID)"
                    class="btn btn-ghost btn-sm"
                    :title="t('viewDetails')"
                  >
                    <ChevronDown
                      class="w-3.5 h-3.5 transition-transform"
                      :class="{ 'rotate-180': expandedNodes.has(node.Service.ID) }"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Health Checks Section -->
      <div v-show="activeTab === 'health'" class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('healthChecksList') }} ({{ allHealthChecks.length }})
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('checkId') }}</th>
                <th>{{ t('node') }}</th>
                <th>{{ t('status') }}</th>
                <th>{{ t('output') }}</th>
                <th>{{ t('type') }}</th>
                <th>{{ t('interval') }}</th>
                <th>{{ t('timeout') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="allHealthChecks.length === 0">
                <td colspan="7" class="text-center py-6 text-text-secondary">
                  {{ t('noHealthChecks') }}
                </td>
              </tr>
              <tr
                v-for="check in allHealthChecks"
                :key="`${check.Node}-${check.CheckID}`"
                class="hover:bg-bg-secondary"
              >
                <td class="font-medium text-text-primary text-xs">{{ check.CheckID }}</td>
                <td class="text-text-secondary">{{ check.Node }}</td>
                <td>
                  <span :class="statusBadgeClass(check.Status)" class="badge">
                    {{ check.Status }}
                  </span>
                </td>
                <td>
                  <span class="text-xs text-text-secondary max-w-xs truncate block">
                    {{ check.Output || '-' }}
                  </span>
                </td>
                <td class="text-text-secondary text-xs">{{ check.Type || '-' }}</td>
                <td class="text-text-secondary text-xs">{{ check.Interval || '-' }}</td>
                <td class="text-text-secondary text-xs">{{ check.Timeout || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Topology Tab -->
      <div v-show="activeTab === 'topology'">
        <!-- Loading state -->
        <div v-if="topologyLoading" class="card">
          <div class="p-6 text-center">
            <Loader2 class="w-6 h-6 animate-spin mx-auto text-fuchsia-600" />
            <p class="text-sm text-text-secondary mt-2">{{ t('loading') }}</p>
          </div>
        </div>

        <!-- Topology content -->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Upstreams -->
          <div class="card">
            <div class="px-6 py-4 border-b border-border">
              <h3 class="text-sm font-semibold text-text-primary">
                {{ t('consulUpstreams') }}
                <span class="text-text-tertiary font-normal">
                  ({{ topology?.Upstreams?.length ?? 0 }})
                </span>
              </h3>
            </div>
            <div class="p-4 space-y-2">
              <div
                v-if="!topology?.Upstreams || topology.Upstreams.length === 0"
                class="text-center py-6 text-text-tertiary"
              >
                <GitBranch class="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p class="text-xs">{{ t('consulNoUpstreams') }}</p>
              </div>
              <div
                v-for="up in topology?.Upstreams"
                :key="up.Name"
                class="p-3 rounded-xl border border-border hover:bg-bg-secondary transition-colors"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-text-primary">{{ up.Name }}</span>
                  <span
                    :class="up.Intention?.Allowed ? 'badge badge-success' : 'badge badge-danger'"
                  >
                    {{
                      up.Intention?.Allowed
                        ? t('consulIntentionAllowed')
                        : t('consulIntentionDenied')
                    }}
                  </span>
                </div>
                <span v-if="up.Datacenter" class="text-xs text-text-tertiary mt-1 inline-block">
                  {{ up.Datacenter }}
                </span>
              </div>
            </div>
          </div>

          <!-- Current Service -->
          <div class="card">
            <div class="px-6 py-4 border-b border-border">
              <h3 class="text-sm font-semibold text-text-primary">{{ t('service') }}</h3>
            </div>
            <div class="p-6 flex flex-col items-center justify-center">
              <div
                class="w-16 h-16 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-2xl flex items-center justify-center mb-3"
              >
                <Server class="w-8 h-8 text-fuchsia-600" />
              </div>
              <p class="text-sm font-bold text-text-primary">{{ serviceName }}</p>
              <p v-if="topology?.Protocol" class="text-xs text-text-tertiary mt-1">
                {{ topology.Protocol }}
              </p>
            </div>
          </div>

          <!-- Downstreams -->
          <div class="card">
            <div class="px-6 py-4 border-b border-border">
              <h3 class="text-sm font-semibold text-text-primary">
                {{ t('consulDownstreams') }}
                <span class="text-text-tertiary font-normal">
                  ({{ topology?.Downstreams?.length ?? 0 }})
                </span>
              </h3>
            </div>
            <div class="p-4 space-y-2">
              <div
                v-if="!topology?.Downstreams || topology.Downstreams.length === 0"
                class="text-center py-6 text-text-tertiary"
              >
                <GitBranch class="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p class="text-xs">{{ t('consulNoDownstreams') }}</p>
              </div>
              <div
                v-for="down in topology?.Downstreams"
                :key="down.Name"
                class="p-3 rounded-xl border border-border hover:bg-bg-secondary transition-colors"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-text-primary">{{ down.Name }}</span>
                  <span
                    :class="down.Intention?.Allowed ? 'badge badge-success' : 'badge badge-danger'"
                  >
                    {{
                      down.Intention?.Allowed
                        ? t('consulIntentionAllowed')
                        : t('consulIntentionDenied')
                    }}
                  </span>
                </div>
                <span v-if="down.Datacenter" class="text-xs text-text-tertiary mt-1 inline-block">
                  {{ down.Datacenter }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, RefreshCw, Loader2, ChevronDown, Server, GitBranch } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'
import type {
  ConsulServiceNode,
  ConsulHealthCheck,
  ConsulHealthStatus,
  ConsulServiceTopology,
} from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// State
const loading = ref(false)
const serviceName = computed(() => (route.params.name as string) || '')
const serviceNodes = ref<ConsulServiceNode[]>([])
const expandedNodes = ref<Set<string>>(new Set())
const instanceStatusFilter = ref<'all' | 'passing' | 'warning' | 'critical'>('all')

// Tabs
type TabKey = 'instances' | 'health' | 'topology'
const activeTab = ref<TabKey>('instances')
const tabs = computed(() => [
  { key: 'instances' as TabKey, label: t('serviceInstances') },
  { key: 'health' as TabKey, label: t('healthChecksList') },
  { key: 'topology' as TabKey, label: t('consulTopology') },
])

// Topology
const topology = ref<ConsulServiceTopology | null>(null)
const topologyLoading = ref(false)
const topologyLoaded = ref(false)

async function switchTab(tab: TabKey) {
  activeTab.value = tab
  if (tab === 'topology' && !topologyLoaded.value) {
    topologyLoading.value = true
    try {
      const response = await consulApi.getServiceTopology(serviceName.value)
      topology.value = response.data
      topologyLoaded.value = true
    } catch (err) {
      logger.error('Failed to fetch service topology:', err)
    } finally {
      topologyLoading.value = false
    }
  }
}

// Computed
const serviceTags = computed(() => {
  const tags = new Set<string>()
  for (const node of serviceNodes.value) {
    if (node.Service.Tags) {
      for (const tag of node.Service.Tags) {
        tags.add(tag)
      }
    }
  }
  return Array.from(tags)
})

const filteredServiceNodes = computed(() => {
  if (instanceStatusFilter.value === 'all') return serviceNodes.value
  return serviceNodes.value.filter((node) => {
    if (!node.Checks || node.Checks.length === 0) return instanceStatusFilter.value === 'passing'
    return node.Checks.some((c) => c.Status === instanceStatusFilter.value)
  })
})

const allHealthChecks = computed<ConsulHealthCheck[]>(() => {
  const checks: ConsulHealthCheck[] = []
  for (const node of serviceNodes.value) {
    if (node.Checks) {
      checks.push(...node.Checks)
    }
  }
  return checks
})

const healthSummary = computed(() => {
  let passing = 0
  let warning = 0
  let critical = 0
  for (const check of allHealthChecks.value) {
    if (check.Status === 'passing') passing++
    else if (check.Status === 'warning') warning++
    else if (check.Status === 'critical') critical++
  }
  return { passing, warning, critical }
})

// Methods
const statusBadgeClass = (status: ConsulHealthStatus) => {
  switch (status) {
    case 'passing':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
    case 'warning':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    case 'critical':
      return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
    case 'maintenance':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

const toggleNodeDetail = (serviceId: string) => {
  if (expandedNodes.value.has(serviceId)) {
    expandedNodes.value.delete(serviceId)
  } else {
    expandedNodes.value.add(serviceId)
  }
}

const fetchServiceDetail = async () => {
  if (!serviceName.value) return
  loading.value = true
  try {
    // Use health endpoint to get nodes with checks
    const response = await consulApi.getHealthService(serviceName.value)
    serviceNodes.value = response.data || []
  } catch (err) {
    logger.error('Failed to fetch service detail:', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  fetchServiceDetail()
}

const goBack = () => {
  router.push({ name: 'consul-services' })
}

// Lifecycle
onMounted(() => {
  fetchServiceDetail()
})
</script>

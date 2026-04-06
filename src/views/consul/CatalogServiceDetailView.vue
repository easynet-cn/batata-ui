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
              <template v-for="node in filteredServiceNodes" :key="node.Service.ID">
                <tr class="hover:bg-bg-secondary">
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
                <!-- Expanded Instance Detail Row -->
                <tr v-if="expandedNodes.has(node.Service.ID)">
                  <td colspan="6" class="p-0">
                    <div class="p-4 bg-bg-secondary space-y-3">
                      <!-- Service Meta -->
                      <div v-if="node.Service.Meta && Object.keys(node.Service.Meta).length > 0">
                        <h4 class="text-xs font-medium text-text-secondary mb-1">
                          {{ t('metadata') }}
                        </h4>
                        <div class="flex flex-wrap gap-1">
                          <span
                            v-for="(val, key) in node.Service.Meta"
                            :key="key"
                            class="badge badge-default"
                          >
                            {{ key }}={{ val }}
                          </span>
                        </div>
                      </div>

                      <!-- Transparent Proxy Indicator -->
                      <div v-if="getTransparentProxyPort(node)" class="flex items-center gap-2">
                        <span class="badge badge-info">
                          <Shield class="w-3 h-3 mr-1" />
                          Transparent Proxy
                        </span>
                        <span class="text-xs text-text-tertiary">
                          {{ t('consulOutboundPort') }}: {{ getTransparentProxyPort(node) }}
                        </span>
                      </div>

                      <!-- Exposed Paths -->
                      <div v-if="getExposedPaths(node).length > 0">
                        <h4 class="text-xs font-medium text-text-secondary mb-1">
                          {{ t('consulExposedPaths') }}
                        </h4>
                        <div class="overflow-x-auto">
                          <table class="w-full text-xs">
                            <thead>
                              <tr class="border-b border-border">
                                <th class="text-left py-1.5 px-2 text-text-tertiary font-medium">
                                  {{ t('consulPathProtocol') }}
                                </th>
                                <th class="text-left py-1.5 px-2 text-text-tertiary font-medium">
                                  {{ t('consulListenerPort') }}
                                </th>
                                <th class="text-left py-1.5 px-2 text-text-tertiary font-medium">
                                  {{ t('consulPath') }}
                                </th>
                                <th class="text-left py-1.5 px-2 text-text-tertiary font-medium">
                                  {{ t('consulLocalPort') }}
                                </th>
                                <th class="text-left py-1.5 px-2 text-text-tertiary font-medium">
                                  {{ t('consulEndpoint') }}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(path, idx) in getExposedPaths(node)"
                                :key="idx"
                                class="border-b border-border/50"
                              >
                                <td class="py-1.5 px-2">{{ path.Protocol || 'http' }}</td>
                                <td class="py-1.5 px-2 font-mono">{{ path.ListenerPort }}</td>
                                <td class="py-1.5 px-2 font-mono">{{ path.Path }}</td>
                                <td class="py-1.5 px-2 font-mono">{{ path.LocalPathPort }}</td>
                                <td class="py-1.5 px-2 font-mono text-primary">
                                  {{ node.Service.Address || node.Node.Address }}:{{
                                    path.ListenerPort
                                  }}{{ path.Path }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- Health Checks for this instance -->
                      <div v-if="node.Checks && node.Checks.length > 0">
                        <h4 class="text-xs font-medium text-text-secondary mb-1">
                          {{ t('healthChecksList') }}
                        </h4>
                        <div class="space-y-1">
                          <div
                            v-for="check in node.Checks"
                            :key="check.CheckID"
                            class="flex items-center gap-2 text-xs"
                          >
                            <span :class="statusBadgeClass(check.Status)" class="badge">
                              {{ check.Status }}
                            </span>
                            <span class="text-text-primary">{{ check.CheckID }}</span>
                            <span v-if="check.Output" class="text-text-tertiary truncate max-w-xs">
                              {{ check.Output }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
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

        <!-- Topology Graph -->
        <div v-else class="card p-4">
          <ServiceTopologyGraph
            :service-name="serviceName"
            :upstreams="topology?.Upstreams || []"
            :downstreams="topology?.Downstreams || []"
            :filter-by-ac-ls="topology?.FilteredByACLs"
            :protocol="topology?.Protocol"
          />
        </div>
      </div>

      <!-- Routing (Discovery Chain) Tab -->
      <div v-show="activeTab === 'routing'" class="card p-4">
        <DiscoveryChainView :service-name="serviceName" />
      </div>

      <!-- Tags Tab -->
      <div v-show="activeTab === 'tags'" class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('consulServiceTags') }} ({{ serviceTags.length }})
          </h3>
        </div>
        <div class="p-6">
          <div v-if="serviceTags.length === 0" class="text-center py-6 text-text-tertiary">
            <Tag class="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p class="text-xs">{{ t('noTags') }}</p>
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="tag in serviceTags"
              :key="tag"
              class="px-3 py-1.5 text-sm font-medium rounded-xl bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Upstreams Tab -->
      <div v-show="activeTab === 'upstreams'">
        <div v-if="topologyLoading" class="card">
          <div class="p-6 text-center">
            <Loader2 class="w-6 h-6 animate-spin mx-auto text-fuchsia-600" />
            <p class="text-sm text-text-secondary mt-2">{{ t('loading') }}</p>
          </div>
        </div>
        <div v-else class="card">
          <div class="px-6 py-4 border-b border-border">
            <h3 class="text-sm font-semibold text-text-primary">
              {{ t('consulUpstreamServices') }}
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
                <span :class="up.Intention?.Allowed ? 'badge badge-success' : 'badge badge-danger'">
                  {{
                    up.Intention?.Allowed ? t('consulIntentionAllowed') : t('consulIntentionDenied')
                  }}
                </span>
              </div>
              <span v-if="up.Datacenter" class="text-xs text-text-tertiary mt-1 inline-block">
                {{ up.Datacenter }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Intentions Tab -->
      <div v-show="activeTab === 'intentions'">
        <div v-if="intentionsLoading" class="card">
          <div class="p-6 text-center">
            <Loader2 class="w-6 h-6 animate-spin mx-auto text-fuchsia-600" />
            <p class="text-sm text-text-secondary mt-2">{{ t('loading') }}</p>
          </div>
        </div>
        <div v-else class="card">
          <div class="px-6 py-4 border-b border-border">
            <h3 class="text-sm font-semibold text-text-primary">
              {{ t('consulRelatedIntentions') }}
              <span class="text-text-tertiary font-normal"> ({{ relatedIntentions.length }}) </span>
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ t('sourceService') }}</th>
                  <th>{{ t('destinationService') }}</th>
                  <th>{{ t('action') }}</th>
                  <th>{{ t('precedence') }}</th>
                  <th>{{ t('description') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="relatedIntentions.length === 0">
                  <td colspan="5" class="text-center py-6 text-text-secondary">
                    <Link class="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p class="text-xs">{{ t('consulNoRelatedIntentions') }}</p>
                  </td>
                </tr>
                <tr
                  v-for="intention in relatedIntentions"
                  :key="intention.ID"
                  class="hover:bg-bg-secondary"
                >
                  <td class="font-medium text-text-primary">{{ intention.SourceName }}</td>
                  <td class="font-medium text-text-primary">{{ intention.DestinationName }}</td>
                  <td>
                    <span
                      :class="
                        intention.Action === 'allow' ? 'badge badge-success' : 'badge badge-danger'
                      "
                    >
                      {{ intention.Action }}
                    </span>
                  </td>
                  <td class="text-text-secondary">{{ intention.Precedence }}</td>
                  <td class="text-text-secondary">{{ intention.Description || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  ChevronDown,
  GitBranch,
  Link,
  Tag,
  Shield,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'
import ServiceTopologyGraph from '@/components/consul/ServiceTopologyGraph.vue'
import DiscoveryChainView from '@/components/consul/DiscoveryChainView.vue'
import type {
  ConsulServiceNode,
  ConsulHealthCheck,
  ConsulHealthStatus,
  ConsulServiceTopology,
  ConsulIntention,
} from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const serviceName = computed(() => (route.params.name as string) || '')
const serviceNodes = ref<ConsulServiceNode[]>([])
const expandedNodes = ref<Set<string>>(new Set())
const instanceStatusFilter = ref<'all' | 'passing' | 'warning' | 'critical'>('all')

// Tabs
type TabKey = 'instances' | 'health' | 'topology' | 'routing' | 'tags' | 'upstreams' | 'intentions'
const activeTab = ref<TabKey>('instances')
const tabs = computed(() => [
  { key: 'instances' as TabKey, label: t('serviceInstances') },
  { key: 'health' as TabKey, label: t('healthChecksList') },
  { key: 'topology' as TabKey, label: t('consulTopology') },
  { key: 'routing' as TabKey, label: t('consulRouting') },
  { key: 'tags' as TabKey, label: t('consulServiceTags') },
  { key: 'upstreams' as TabKey, label: t('consulUpstreamServices') },
  { key: 'intentions' as TabKey, label: t('consulServiceIntentions') },
])

// Topology
const topology = ref<ConsulServiceTopology | null>(null)
const topologyLoading = ref(false)
const topologyLoaded = ref(false)

// Intentions
const relatedIntentions = ref<ConsulIntention[]>([])
const intentionsLoading = ref(false)
const intentionsLoaded = ref(false)

async function loadTopology() {
  if (topologyLoaded.value) return
  topologyLoading.value = true
  try {
    const dc = consulStore.currentDc || undefined
    const response = await consulApi.getServiceTopology(serviceName.value, dc)
    topology.value = response.data
    topologyLoaded.value = true
  } catch (err) {
    logger.error('Failed to fetch service topology:', err)
  } finally {
    topologyLoading.value = false
  }
}

async function switchTab(tab: TabKey) {
  activeTab.value = tab
  if ((tab === 'topology' || tab === 'upstreams') && !topologyLoaded.value) {
    await loadTopology()
  }
  if (tab === 'intentions' && !intentionsLoaded.value) {
    intentionsLoading.value = true
    try {
      const response = await consulApi.listIntentions()
      const all = response.data || []
      relatedIntentions.value = all.filter(
        (i) =>
          i.SourceName === serviceName.value ||
          i.DestinationName === serviceName.value ||
          i.SourceName === '*' ||
          i.DestinationName === '*',
      )
      intentionsLoaded.value = true
    } catch (err) {
      logger.error('Failed to fetch intentions:', err)
    } finally {
      intentionsLoading.value = false
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

// Exposed Paths helper (uses properly typed ConsulServiceProxy)
const getTransparentProxyPort = (node: ConsulServiceNode): number | null => {
  return node.Service.Proxy?.TransparentProxy?.OutboundListenerPort || null
}

const getExposedPaths = (node: ConsulServiceNode) => {
  return node.Service.Proxy?.Expose?.Paths || []
}

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
    const dc = consulStore.currentDc || undefined
    const response = await consulApi.getHealthService(serviceName.value, dc)
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

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
            {{ t('nodeDetail') }}: {{ nodeName }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('backToNodes') }}</p>
        </div>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !nodeData" class="card">
      <div class="p-6 text-center">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-fuchsia-600" />
        <p class="text-sm text-text-secondary mt-2">{{ t('loading') }}</p>
      </div>
    </div>

    <template v-if="nodeData">
      <!-- Node Info Card -->
      <div class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('nodeInfo') }}</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Node ID -->
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('nodeId') }}
              </label>
              <p class="text-sm text-text-primary font-mono">{{ nodeData.ID || '-' }}</p>
            </div>
            <!-- Node Name -->
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('nodeName') }}
              </label>
              <p class="text-sm text-text-primary font-medium">{{ nodeData.Node }}</p>
            </div>
            <!-- Address -->
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('address') }}
              </label>
              <p class="text-sm text-text-primary font-mono">{{ nodeData.Address }}</p>
            </div>
            <!-- Consul Version -->
            <div v-if="nodeData.Meta?.['consul-version']">
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('consulNodeVersion') }}
              </label>
              <p class="text-sm text-text-primary">{{ nodeData.Meta['consul-version'] }}</p>
            </div>
          </div>

          <!-- Tagged Addresses -->
          <div
            v-if="nodeData.TaggedAddresses && Object.keys(nodeData.TaggedAddresses).length > 0"
            class="mt-6"
          >
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('taggedAddresses') }}
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="(addr, key) in nodeData.TaggedAddresses"
                :key="key"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary uppercase">{{ key }}:</span>
                <span class="text-sm text-text-primary font-mono">{{ addr }}</span>
              </div>
            </div>
          </div>

          <!-- Meta -->
          <div v-if="filteredMeta.length > 0" class="mt-6">
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('meta') }}
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="[key, val] in filteredMeta"
                :key="key"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary">{{ key }}:</span>
                <span class="text-sm text-text-primary">{{ val }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="card">
        <div class="border-b border-border">
          <nav class="flex gap-0 px-4">
            <button
              v-for="tab in availableTabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === tab.key
                  ? 'border-fuchsia-600 text-fuchsia-600 dark:border-fuchsia-400 dark:text-fuchsia-400'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              "
            >
              {{ tab.label }}
              <span class="ml-1 text-xs text-text-tertiary">({{ tab.count }})</span>
            </button>
          </nav>
        </div>

        <!-- Health Checks Tab -->
        <div v-if="activeTab === 'healthchecks'" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('checkId') }}</th>
                <th>{{ t('serviceName') }}</th>
                <th>{{ t('status') }}</th>
                <th>{{ t('output') }}</th>
                <th>{{ t('checkType') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="nodeData.Checks.length === 0">
                <td colspan="5" class="text-center py-6 text-text-secondary">
                  {{ t('noHealthChecks') }}
                </td>
              </tr>
              <tr
                v-for="check in nodeData.Checks"
                :key="check.CheckID"
                class="hover:bg-bg-secondary"
              >
                <td class="font-medium text-text-primary text-xs">{{ check.CheckID }}</td>
                <td class="text-text-secondary">{{ check.ServiceName || '-' }}</td>
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
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Services Tab -->
        <div v-if="activeTab === 'services'" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('serviceName') }}</th>
                <th>{{ t('serviceId') }}</th>
                <th>{{ t('servicePort') }}</th>
                <th>{{ t('serviceTags') }}</th>
                <th class="w-24">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="nodeData.Services.length === 0">
                <td colspan="5" class="text-center py-6 text-text-secondary">
                  {{ t('noServices') }}
                </td>
              </tr>
              <tr v-for="svc in nodeData.Services" :key="svc.ID" class="hover:bg-bg-secondary">
                <td>
                  <router-link
                    :to="{ name: 'consul-service-detail', params: { name: svc.Service } }"
                    class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                  >
                    {{ svc.Service }}
                  </router-link>
                  <span
                    v-if="svc.Kind"
                    class="ml-2 badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px]"
                  >
                    {{ svc.Kind }}
                  </span>
                </td>
                <td class="text-text-secondary text-xs">{{ svc.ID }}</td>
                <td>{{ svc.Port }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in (svc.Tags || []).slice(0, 3)"
                      :key="tag"
                      class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                    >
                      {{ tag }}
                    </span>
                    <span
                      v-if="svc.Tags && svc.Tags.length > 3"
                      class="badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    >
                      +{{ svc.Tags.length - 3 }}
                    </span>
                    <span
                      v-if="!svc.Tags || svc.Tags.length === 0"
                      class="text-xs text-text-tertiary"
                    >
                      {{ t('noTags') }}
                    </span>
                  </div>
                </td>
                <td>
                  <router-link
                    :to="{ name: 'consul-service-detail', params: { name: svc.Service } }"
                    class="btn btn-ghost btn-sm"
                    :title="t('viewDetails')"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- RTT Tab -->
        <div v-if="activeTab === 'rtt'">
          <div v-if="!rttStats" class="p-6 text-center py-4 text-text-tertiary">
            <p class="text-xs">{{ t('consulNoCoordinateData') }}</p>
          </div>
          <template v-else>
            <!-- Summary stats -->
            <div class="p-6 grid grid-cols-3 gap-4">
              <div class="text-center p-4 bg-bg-secondary rounded-xl">
                <label
                  class="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1"
                >
                  {{ t('consulMinRtt') }}
                </label>
                <p class="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {{ formatRtt(rttStats.min) }}
                </p>
              </div>
              <div class="text-center p-4 bg-bg-secondary rounded-xl">
                <label
                  class="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1"
                >
                  {{ t('consulMedianRtt') }}
                </label>
                <p class="text-lg font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                  {{ formatRtt(rttStats.median) }}
                </p>
              </div>
              <div class="text-center p-4 bg-bg-secondary rounded-xl">
                <label
                  class="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1"
                >
                  {{ t('consulMaxRtt') }}
                </label>
                <p class="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {{ formatRtt(rttStats.max) }}
                </p>
              </div>
            </div>

            <!-- Per-node RTT table -->
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>{{ t('nodeName') }}</th>
                    <th>{{ t('estimatedRtt') }}</th>
                    <th>{{ t('datacenter') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="rttEntries.length === 0">
                    <td colspan="3" class="text-center py-4 text-text-secondary">
                      {{ t('noData') }}
                    </td>
                  </tr>
                  <tr v-for="entry in rttEntries" :key="entry.node" class="hover:bg-bg-secondary">
                    <td>
                      <router-link
                        :to="{ name: 'consul-node-detail', params: { name: entry.node } }"
                        class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                      >
                        {{ entry.node }}
                      </router-link>
                    </td>
                    <td>
                      <span class="font-mono text-sm">{{ formatRtt(entry.rtt) }}</span>
                    </td>
                    <td class="text-text-secondary">{{ entry.dc || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <!-- Sessions Tab -->
        <div v-if="activeTab === 'sessions'" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('sessionId') }}</th>
                <th>{{ t('name') }}</th>
                <th>{{ t('ttl') }}</th>
                <th>{{ t('behavior') }}</th>
                <th>{{ t('checks') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="nodeSessions.length === 0">
                <td colspan="5" class="text-center py-4 text-text-secondary">
                  {{ t('consulNoSessions') }}
                </td>
              </tr>
              <tr v-for="session in nodeSessions" :key="session.ID" class="hover:bg-bg-secondary">
                <td class="font-mono text-xs">{{ session.ID.substring(0, 8) }}...</td>
                <td class="text-text-primary">{{ session.Name || '-' }}</td>
                <td class="text-text-secondary">{{ session.TTL || '-' }}</td>
                <td>
                  <span
                    :class="
                      session.Behavior === 'release' ? 'badge badge-success' : 'badge badge-danger'
                    "
                  >
                    {{ session.Behavior }}
                  </span>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="check in session.Checks || []"
                      :key="check"
                      class="badge badge-info text-[10px]"
                    >
                      {{ check }}
                    </span>
                    <span v-if="!session.Checks?.length" class="text-text-tertiary">-</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Metadata Tab -->
        <div v-if="activeTab === 'metadata'" class="p-6">
          <div
            v-if="!nodeData.Meta || Object.keys(nodeData.Meta).length === 0"
            class="text-center py-4 text-text-tertiary"
          >
            <p class="text-xs">{{ t('noData') }}</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              v-for="(val, key) in nodeData.Meta"
              :key="key"
              class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
            >
              <span class="text-xs font-bold text-text-tertiary">{{ key }}:</span>
              <span class="text-sm text-text-primary">{{ val }}</span>
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
import { ArrowLeft, RefreshCw, Loader2, Eye } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'
import type {
  ConsulUINode,
  ConsulHealthStatus,
  ConsulSession,
  ConsulCoordinate,
} from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const nodeName = computed(() => (route.params.name as string) || '')
const nodeData = ref<ConsulUINode | null>(null)
const nodeSessions = ref<ConsulSession[]>([])
const rttStats = ref<{ min: number; median: number; max: number } | null>(null)
const rttEntries = ref<Array<{ node: string; rtt: number; dc: string }>>([])
const activeTab = ref('healthchecks')

// Computed
const filteredMeta = computed(() => {
  if (!nodeData.value?.Meta) return []
  // Filter out consul-version from meta display (shown in header)
  return Object.entries(nodeData.value.Meta).filter(([key]) => key !== 'consul-version')
})

const availableTabs = computed(() => {
  if (!nodeData.value) return []
  const tabs = [
    { key: 'healthchecks', label: t('healthChecksList'), count: nodeData.value.Checks.length },
    { key: 'services', label: t('nodeServices'), count: nodeData.value.Services.length },
  ]
  if (rttStats.value) {
    tabs.push({ key: 'rtt', label: t('consulRtt'), count: rttEntries.value.length })
  }
  tabs.push({ key: 'sessions', label: t('consulNodeSessions'), count: nodeSessions.value.length })
  tabs.push({
    key: 'metadata',
    label: t('meta'),
    count: nodeData.value.Meta ? Object.keys(nodeData.value.Meta).length : 0,
  })
  return tabs
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

// Vivaldi coordinate distance formula
function computeRtt(a: ConsulCoordinate['Coord'], b: ConsulCoordinate['Coord']): number {
  let sumsq = 0
  const len = Math.min(a.Vec.length, b.Vec.length)
  for (let i = 0; i < len; i++) {
    const diff = (a.Vec[i] ?? 0) - (b.Vec[i] ?? 0)
    sumsq += diff * diff
  }
  const dist = Math.sqrt(sumsq) + a.Height + b.Height
  const adjusted = dist + a.Adjustment + b.Adjustment
  return Math.max(adjusted, 0)
}

function formatRtt(seconds: number): string {
  if (seconds < 0.001) return `${(seconds * 1_000_000).toFixed(0)} µs`
  if (seconds < 1) return `${(seconds * 1_000).toFixed(2)} ms`
  return `${seconds.toFixed(3)} s`
}

const fetchNodeCoordinates = async () => {
  try {
    const dc = consulStore.currentDc || undefined
    const response = await consulApi.getCoordinateNodes(dc)
    const coords: ConsulCoordinate[] = response.data || []
    const thisNode = coords.find((c) => c.Node === nodeName.value)
    if (!thisNode || coords.length < 2) {
      rttStats.value = null
      rttEntries.value = []
      return
    }
    const entries: Array<{ node: string; rtt: number; dc: string }> = []
    for (const other of coords) {
      if (other.Node === nodeName.value) continue
      const rtt = computeRtt(thisNode.Coord, other.Coord)
      entries.push({ node: other.Node, rtt, dc: dc || '' })
    }
    // Sort by RTT ascending
    entries.sort((a, b) => a.rtt - b.rtt)
    rttEntries.value = entries

    if (entries.length === 0) {
      rttStats.value = null
      return
    }
    const rtts = entries.map((e) => e.rtt)
    const mid = Math.floor(rtts.length / 2)
    rttStats.value = {
      min: rtts[0]!,
      median: rtts.length % 2 !== 0 ? rtts[mid]! : (rtts[mid - 1]! + rtts[mid]!) / 2,
      max: rtts[rtts.length - 1]!,
    }
  } catch {
    rttStats.value = null
    rttEntries.value = []
  }
}

const fetchNodeSessions = async () => {
  try {
    const dc = consulStore.currentDc || undefined
    const response = await consulApi.listSessions(dc)
    nodeSessions.value = (response.data || []).filter((s) => s.Node === nodeName.value)
  } catch {
    nodeSessions.value = []
  }
}

const fetchNodeDetail = async () => {
  if (!nodeName.value) return
  loading.value = true
  try {
    const dc = consulStore.currentDc || undefined
    const response = await consulApi.getUINode(nodeName.value, dc)
    nodeData.value = response.data

    // Set default tab based on data
    if (nodeData.value.Checks.length > 0) {
      activeTab.value = 'healthchecks'
    } else {
      activeTab.value = 'services'
    }

    // Fetch sessions and coordinates in parallel
    await Promise.all([fetchNodeSessions(), fetchNodeCoordinates()])
  } catch (err) {
    logger.error('Failed to fetch node detail:', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  fetchNodeDetail()
}

const goBack = () => {
  router.push({ name: 'consul-nodes' })
}

// Lifecycle
onMounted(() => {
  fetchNodeDetail()
})
</script>

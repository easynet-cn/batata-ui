<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('catalogNodes') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('catalogNodesDesc') }}</p>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <!-- Search -->
          <div class="md:col-span-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10"
                :placeholder="t('searchNodes')"
              />
            </div>
          </div>
          <!-- Status Filter -->
          <div>
            <select v-model="statusFilter" class="input">
              <option value="">{{ t('consulFilterAll') }}</option>
              <option value="passing">{{ t('consulFilterPassing') }}</option>
              <option value="warning">{{ t('consulFilterWarning') }}</option>
              <option value="critical">{{ t('consulFilterCritical') }}</option>
            </select>
          </div>
          <!-- Sort -->
          <div>
            <select v-model="sortBy" class="input">
              <option value="status">{{ t('sortBy') }}: {{ t('consulSortByStatus') }}</option>
              <option value="name">{{ t('sortBy') }}: {{ t('consulSortByName') }}</option>
              <option value="version">{{ t('sortBy') }}: {{ t('consulSortByVersion') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Node Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('healthStatus') }}</th>
              <th>{{ t('nodeName') }}</th>
              <th>{{ t('address') }}</th>
              <th>{{ t('consulNodeServiceCount') }}</th>
              <th>{{ t('consulNodeVersion') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-fuchsia-600" />
              </td>
            </tr>
            <tr v-else-if="sortedNodes.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noNodes') }}
              </td>
            </tr>
            <tr
              v-for="node in sortedNodes"
              :key="node.ID || node.Node"
              class="hover:bg-bg-secondary"
            >
              <!-- Health Status -->
              <td>
                <span :class="healthBadgeClass(getNodeHealthStatus(node))">
                  {{ healthStatusLabel(getNodeHealthStatus(node)) }}
                </span>
              </td>
              <!-- Node Name + Leader Badge -->
              <td>
                <div class="flex items-center gap-2">
                  <router-link
                    :to="{ name: 'consul-node-detail', params: { name: node.Node } }"
                    class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                  >
                    {{ node.Node }}
                  </router-link>
                  <span
                    v-if="isLeader(node)"
                    class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 text-[10px]"
                  >
                    {{ t('consulLeader') }}
                  </span>
                </div>
              </td>
              <!-- Address -->
              <td class="text-text-secondary font-mono text-xs">{{ node.Address }}</td>
              <!-- Service Count -->
              <td>
                <span class="text-sm text-text-secondary">
                  {{ getMeshServiceCount(node) }}
                </span>
              </td>
              <!-- Consul Version -->
              <td>
                <span v-if="getNodeVersion(node)" class="text-xs text-text-secondary">
                  {{ getNodeVersion(node) }}
                </span>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <!-- Actions -->
              <td>
                <router-link
                  :to="{ name: 'consul-node-detail', params: { name: node.Node } }"
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

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ sortedNodes.length }} {{ t('items') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, RefreshCw, Eye, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'
import type { ConsulUINode } from '@/types/consul'

const { t } = useI18n()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('status')
const leaderAddress = ref('')

// Health status helpers
type NodeHealthStatus = 'critical' | 'warning' | 'passing' | 'empty'

const getNodeHealthStatus = (node: ConsulUINode): NodeHealthStatus => {
  if (!node.Checks || node.Checks.length === 0) return 'empty'
  for (const check of node.Checks) {
    if (check.Status === 'critical') return 'critical'
  }
  for (const check of node.Checks) {
    if (check.Status === 'warning') return 'warning'
  }
  return 'passing'
}

const healthStatusLabel = (status: NodeHealthStatus): string => {
  const map: Record<NodeHealthStatus, string> = {
    critical: t('critical'),
    warning: t('warning'),
    passing: t('passing'),
    empty: t('passing'),
  }
  return map[status]
}

const healthBadgeClass = (status: NodeHealthStatus): string => {
  const map: Record<NodeHealthStatus, string> = {
    critical: 'badge bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    warning: 'badge bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    passing: 'badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    empty: 'badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  }
  return map[status]
}

// Mesh service count: exclude connect-proxy services (same as Consul UI)
const getMeshServiceCount = (node: ConsulUINode): number => {
  return node.Services.filter((svc) => svc.Kind !== 'connect-proxy').length
}

const getNodeVersion = (node: ConsulUINode): string => {
  return node.Meta?.['consul-version'] || ''
}

const isLeader = (node: ConsulUINode): boolean => {
  if (!leaderAddress.value) return false
  // Leader address format is "ip:port", node address is just "ip"
  return leaderAddress.value.startsWith(node.Address + ':')
}

// Filtered nodes
const filteredNodes = computed(() => {
  let nodes = consulStore.uiNodes

  // Search filter (by Node name, Address, Meta)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    nodes = nodes.filter((node) => {
      if (node.Node.toLowerCase().includes(query)) return true
      if (node.Address.toLowerCase().includes(query)) return true
      if (node.PeerName?.toLowerCase().includes(query)) return true
      if (node.Meta) {
        for (const [k, v] of Object.entries(node.Meta)) {
          if (`${k}=${v}`.toLowerCase().includes(query)) return true
        }
      }
      return false
    })
  }

  // Status filter
  if (statusFilter.value) {
    nodes = nodes.filter((node) => getNodeHealthStatus(node) === statusFilter.value)
  }

  return nodes
})

// Sorted nodes
const sortedNodes = computed(() => {
  const nodes = [...filteredNodes.value]

  switch (sortBy.value) {
    case 'status': {
      const priority: Record<string, number> = { critical: 0, warning: 1, passing: 2, empty: 3 }
      nodes.sort(
        (a, b) => (priority[getNodeHealthStatus(a)] ?? 3) - (priority[getNodeHealthStatus(b)] ?? 3),
      )
      break
    }
    case 'name':
      nodes.sort((a, b) => a.Node.localeCompare(b.Node))
      break
    case 'version': {
      nodes.sort((a, b) => {
        const va = getNodeVersion(a)
        const vb = getNodeVersion(b)
        if (!va && !vb) return 0
        if (!va) return 1
        if (!vb) return -1
        return compareVersions(vb, va)
      })
      break
    }
  }

  return nodes
})

// Semantic version comparison
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na !== nb) return na - nb
  }
  return 0
}

// Data fetching
const fetchData = async () => {
  loading.value = true
  try {
    await Promise.all([consulStore.fetchUINodes(), fetchLeader()])
  } catch (err) {
    logger.error('Failed to fetch catalog nodes:', err)
  } finally {
    loading.value = false
  }
}

const fetchLeader = async () => {
  try {
    const response = await consulApi.getStatusLeader(consulStore.currentDc || undefined)
    // Response is a quoted string like "10.0.0.1:8300"
    leaderAddress.value = (response.data || '').replace(/"/g, '')
  } catch {
    leaderAddress.value = ''
  }
}

const handleRefresh = () => {
  fetchData()
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

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

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              v-model="searchQuery"
              type="text"
              class="input pl-10"
              :placeholder="t('searchNodes')"
            />
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
              <th>{{ t('nodeName') }}</th>
              <th>{{ t('address') }}</th>
              <th>{{ t('datacenter') }}</th>
              <th>{{ t('healthStatus') }}</th>
              <th>{{ t('meta') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-fuchsia-600" />
              </td>
            </tr>
            <tr v-else-if="filteredNodes.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noNodes') }}
              </td>
            </tr>
            <tr v-for="node in filteredNodes" :key="node.ID" class="hover:bg-bg-secondary">
              <td>
                <router-link
                  :to="{ name: 'consul-catalog-node-detail', params: { name: node.Node } }"
                  class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                >
                  {{ node.Node }}
                </router-link>
              </td>
              <td class="text-text-secondary font-mono text-xs">{{ node.Address }}</td>
              <td>
                <span
                  class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                >
                  {{ node.Datacenter }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <template v-if="nodeHealthData[node.Node]">
                    <span
                      v-if="nodeHealthData[node.Node]!.critical > 0"
                      class="badge bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    >
                      {{ t('critical') }}
                    </span>
                    <span
                      v-else-if="nodeHealthData[node.Node]!.warning > 0"
                      class="badge bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    >
                      {{ t('warning') }}
                    </span>
                    <span
                      v-else
                      class="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    >
                      {{ t('passing') }}
                    </span>
                  </template>
                  <span v-else class="text-xs text-text-tertiary">-</span>
                </div>
              </td>
              <td>
                <span
                  v-if="node.Meta && Object.keys(node.Meta).length > 0"
                  class="text-xs text-text-secondary max-w-xs truncate block"
                >
                  {{ formatMeta(node.Meta) }}
                </span>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <td>
                <router-link
                  :to="{ name: 'consul-catalog-node-detail', params: { name: node.Node } }"
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
          {{ t('total') }}: {{ filteredNodes.length }} {{ t('items') }}
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

const { t } = useI18n()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const searchQuery = ref('')
type NodeHealthEntry = { passing: number; warning: number; critical: number }
const nodeHealthData = ref<Record<string, NodeHealthEntry>>({})

// Computed
const filteredNodes = computed(() => {
  if (!searchQuery.value) return consulStore.nodes
  const query = searchQuery.value.toLowerCase()
  return consulStore.nodes.filter(
    (node) =>
      node.Node.toLowerCase().includes(query) ||
      node.Address.toLowerCase().includes(query) ||
      node.Datacenter.toLowerCase().includes(query),
  )
})

// Methods
const formatMeta = (meta: Record<string, string>): string => {
  const entries = Object.entries(meta)
  const display = entries
    .slice(0, 3)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
  return entries.length > 3 ? `${display}, ...` : display
}

const fetchNodes = async () => {
  loading.value = true
  try {
    await consulStore.fetchNodes()
    await fetchNodeHealth()
  } catch (err) {
    logger.error('Failed to fetch catalog nodes:', err)
  } finally {
    loading.value = false
  }
}

const fetchNodeHealth = async () => {
  const healthMap: Record<string, { passing: number; warning: number; critical: number }> = {}

  try {
    // Fetch all health checks in one go
    const response = await consulApi.getHealthState('any')
    const checks = response.data || []

    for (const check of checks) {
      if (!healthMap[check.Node]) {
        healthMap[check.Node] = { passing: 0, warning: 0, critical: 0 }
      }
      if (check.Status === 'passing') healthMap[check.Node]!.passing++
      else if (check.Status === 'warning') healthMap[check.Node]!.warning++
      else if (check.Status === 'critical') healthMap[check.Node]!.critical++
    }
  } catch {
    // Silently ignore health fetch errors
  }

  nodeHealthData.value = healthMap
}

const handleRefresh = () => {
  fetchNodes()
}

// Lifecycle
onMounted(() => {
  fetchNodes()
})
</script>

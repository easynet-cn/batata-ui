<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('cluster') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('clusterDesc') }}</p>
      </div>
      <button @click="fetchNodes" class="btn btn-secondary btn-sm">
        <RefreshCw class="w-3.5 h-3.5" />
        {{ t('refresh') }}
      </button>
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
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="nodes.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <template v-for="node in nodes" :key="node.address">
              <tr class="hover:bg-bg-secondary">
                <td>
                  <div class="flex items-center gap-2">
                    <Server class="w-3.5 h-3.5 text-primary" />
                    <span class="font-mono">{{ node.address }}</span>
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
              </tr>
              <!-- Expanded extendInfo row -->
              <tr v-if="expandedNodes.has(node.address) && node.extendInfo">
                <td colspan="4" class="!pt-0 !pb-4 !px-6">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Server, Loader2, ChevronDown } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { NodeInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const nodes = ref<NodeInfo[]>([])
const expandedNodes = ref<Set<string>>(new Set())

// Methods
const fetchNodes = async () => {
  loading.value = true
  try {
    const response = await batataApi.getClusterNodes()
    nodes.value = response.data.data || []
  } catch (error) {
    logger.error('Failed to fetch nodes:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

const getStateClass = (state: string) => {
  const classes: Record<string, string> = {
    UP: 'badge badge-success',
    DOWN: 'badge badge-danger',
    SUSPICIOUS: 'badge badge-warning',
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

// Lifecycle
onMounted(() => {
  fetchNodes()
})
</script>

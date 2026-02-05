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
              <th>{{ t('metadata') }}</th>
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
            <tr v-for="node in nodes" :key="node.address" class="hover:bg-bg-secondary">
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
                  v-if="node.metadata && Object.keys(node.metadata).length > 0"
                  @click="showMetadata(node)"
                  class="btn btn-ghost btn-sm"
                >
                  <Info class="w-3.5 h-3.5" />
                </button>
                <span v-else class="text-text-tertiary">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Metadata Modal -->
    <div v-if="showMetadataModal" class="modal-backdrop" @click="showMetadataModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('metadata') }}</h3>
          <button @click="showMetadataModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
          <pre class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono">{{
            JSON.stringify(selectedMetadata, null, 2)
          }}</pre>
        </div>
        <div class="modal-footer">
          <button @click="showMetadataModal = false" class="btn btn-secondary">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Server, Loader2, Info, X } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import type { NodeInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const nodes = ref<NodeInfo[]>([])
const showMetadataModal = ref(false)
const selectedMetadata = ref<Record<string, string>>({})

// Methods
const fetchNodes = async () => {
  loading.value = true
  try {
    const response = await batataApi.getClusterNodes()
    nodes.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch nodes:', error)
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

const showMetadata = (node: NodeInfo) => {
  selectedMetadata.value = node.metadata || {}
  showMetadataModal.value = true
}

// Lifecycle
onMounted(() => {
  fetchNodes()
})
</script>

<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('consulOperator') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulOperatorDesc') }}</p>
      </div>
      <button @click="loadData" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Raft Configuration -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">
          {{ t('consulRaftConfiguration') }}
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('node') }}</th>
              <th>ID</th>
              <th>{{ t('address') }}</th>
              <th>{{ t('consulRaftLeader') }}</th>
              <th>{{ t('consulRaftVoter') }}</th>
              <th>{{ t('protocol') }}</th>
              <th>{{ t('lastIndex') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !raftConfig">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="!raftConfig?.Servers?.length">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                <Wrench class="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>{{ t('noData') }}</p>
              </td>
            </tr>
            <tr
              v-for="server in raftConfig?.Servers || []"
              :key="server.ID"
              class="hover:bg-bg-secondary"
            >
              <td class="font-medium text-text-primary">{{ server.Node }}</td>
              <td class="text-text-secondary font-mono text-xs">
                {{ server.ID.substring(0, 8) }}...
              </td>
              <td class="text-text-secondary font-mono text-xs">{{ server.Address }}</td>
              <td>
                <span
                  v-if="server.Leader"
                  class="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  {{ t('consulRaftLeader') }}
                </span>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <td>
                <span
                  v-if="server.Voter"
                  class="badge bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                >
                  {{ t('consulRaftVoter') }}
                </span>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <td class="text-text-secondary text-xs">{{ server.ProtocolVersion }}</td>
              <td class="text-text-secondary font-mono text-xs">{{ server.LastIndex }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cluster Usage -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulClusterUsage') }}</h3>
      </div>
      <div class="p-6">
        <div
          v-if="!operatorUsage?.Usage || Object.keys(operatorUsage.Usage).length === 0"
          class="text-center py-6 text-text-tertiary"
        >
          <Wrench class="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p class="text-xs">{{ t('noData') }}</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(usage, dc) in operatorUsage.Usage"
            :key="dc"
            class="p-4 rounded-xl border border-border"
          >
            <h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
              {{ dc }}
            </h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-text-tertiary">{{ t('nodes') }}</p>
                <p class="text-lg font-extrabold text-text-primary">{{ usage.Nodes }}</p>
              </div>
              <div>
                <p class="text-xs text-text-tertiary">{{ t('services') }}</p>
                <p class="text-lg font-extrabold text-text-primary">{{ usage.Services }}</p>
              </div>
              <div>
                <p class="text-xs text-text-tertiary">{{ t('instances') }}</p>
                <p class="text-lg font-extrabold text-text-primary">
                  {{ usage.ServiceInstances }}
                </p>
              </div>
              <div>
                <p class="text-xs text-text-tertiary">Connect</p>
                <p class="text-lg font-extrabold text-text-primary">
                  {{ usage.ConnectServiceInstances }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Snapshot Actions -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulDownloadSnapshot') }}</h3>
      </div>
      <div class="p-6">
        <button
          @click="handleDownloadSnapshot"
          class="btn btn-primary btn-sm"
          :disabled="downloading"
        >
          <Download class="w-3.5 h-3.5" />
          {{ t('consulDownloadSnapshot') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Wrench, Loader2, Download } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { ConsulRaftConfiguration, ConsulOperatorUsage } from '@/types/consul'

const { t } = useI18n()

// State
const loading = ref(false)
const downloading = ref(false)
const raftConfig = ref<ConsulRaftConfiguration | null>(null)
const operatorUsage = ref<ConsulOperatorUsage | null>(null)

// Actions
async function loadData() {
  loading.value = true
  try {
    const [raftRes, usageRes] = await Promise.allSettled([
      consulApi.getRaftConfiguration(),
      consulApi.getOperatorUsage(),
    ])
    if (raftRes.status === 'fulfilled') {
      raftConfig.value = raftRes.value.data
    }
    if (usageRes.status === 'fulfilled') {
      operatorUsage.value = usageRes.value.data
    }
  } catch (error) {
    logger.error('Failed to fetch operator data:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

async function handleDownloadSnapshot() {
  downloading.value = true
  try {
    const response = await consulApi.downloadSnapshot()
    const blob = new Blob([response.data], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `consul-snapshot-${Date.now()}.snap`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success(t('success'))
  } catch (error) {
    logger.error('Failed to download snapshot:', error)
    toast.apiError(error)
  } finally {
    downloading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

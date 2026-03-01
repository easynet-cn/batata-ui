<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">
          {{ t('consulExportedServices') }}
        </h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulExportedServicesDesc') }}</p>
      </div>
      <button @click="loadData" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Exported Services -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">
          {{ t('consulExportedServices') }} ({{ exportedServices.length }})
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('service') }}</th>
              <th>{{ t('peerings') }}</th>
              <th>{{ t('partitions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="exportedServices.length === 0">
              <td colspan="3" class="text-center py-6 text-text-secondary">
                <ExternalLink class="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>{{ t('consulNoExportedServices') }}</p>
              </td>
            </tr>
            <tr v-for="svc in exportedServices" :key="svc.Service" class="hover:bg-bg-secondary">
              <td class="font-medium text-text-primary">{{ svc.Service }}</td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="peer in svc.Consumers?.Peers || []"
                    :key="peer"
                    class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                  >
                    {{ peer }}
                  </span>
                  <span v-if="!svc.Consumers?.Peers?.length" class="text-xs text-text-tertiary">
                    -
                  </span>
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="part in svc.Consumers?.Partitions || []"
                    :key="part"
                    class="badge bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                  >
                    {{ part }}
                  </span>
                  <span
                    v-if="!svc.Consumers?.Partitions?.length"
                    class="text-xs text-text-tertiary"
                  >
                    -
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Imported Services -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">
          {{ t('consulImportedServices') }} ({{ importedServices.length }})
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('service') }}</th>
              <th>{{ t('consulSourcePeer') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="2" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="importedServices.length === 0">
              <td colspan="2" class="text-center py-6 text-text-secondary">
                <ExternalLink class="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>{{ t('consulNoImportedServices') }}</p>
              </td>
            </tr>
            <tr
              v-for="svc in importedServices"
              :key="`${svc.Service}-${svc.SourcePeer}`"
              class="hover:bg-bg-secondary"
            >
              <td class="font-medium text-text-primary">{{ svc.Service }}</td>
              <td>
                <span
                  class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                >
                  {{ svc.SourcePeer }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, ExternalLink, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { ConsulExportedService, ConsulImportedService } from '@/types/consul'

const { t } = useI18n()

// State
const loading = ref(false)
const exportedServices = ref<ConsulExportedService[]>([])
const importedServices = ref<ConsulImportedService[]>([])

// Actions
async function loadData() {
  loading.value = true
  try {
    const [exportedRes, importedRes] = await Promise.allSettled([
      consulApi.getExportedServices(),
      consulApi.getImportedServices(),
    ])
    if (exportedRes.status === 'fulfilled') {
      exportedServices.value = exportedRes.value.data || []
    }
    if (importedRes.status === 'fulfilled') {
      importedServices.value = importedRes.value.data || []
    }
  } catch (error) {
    logger.error('Failed to fetch exported/imported services:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

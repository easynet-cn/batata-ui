<template>
  <div class="space-y-4">
    <!-- Back Button -->
    <div>
      <RouterLink
        :to="{ name: 'consul-peerings' }"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ t('backToPeerings') }}
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-6 h-6 animate-spin text-primary" />
    </div>

    <template v-else-if="peering">
      <!-- Page Header -->
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ peering.Name }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('peerDetail') }}</p>
      </div>

      <!-- Overview Card -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('peerOverview') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('peerName') }}</p>
            <p class="text-sm font-medium text-text-primary">{{ peering.Name }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">ID</p>
            <p class="text-sm font-mono text-text-primary" :title="peering.ID">
              {{ peering.ID.length > 16 ? peering.ID.substring(0, 16) + '...' : peering.ID }}
            </p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('peerState') }}</p>
            <span :class="stateClass(peering.State)">
              {{ stateLabel(peering.State) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Stream Status Card -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('streamStatus') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('lastHeartbeat') }}</p>
            <p class="text-sm text-text-primary">
              {{ formatTime(peering.StreamStatus?.LastHeartbeat) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('lastReceive') }}</p>
            <p class="text-sm text-text-primary">
              {{ formatTime(peering.StreamStatus?.LastReceive) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('lastSend') }}</p>
            <p class="text-sm text-text-primary">
              {{ formatTime(peering.StreamStatus?.LastSend) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Imported Services -->
      <div class="card p-5 space-y-3">
        <h2 class="text-sm font-bold text-text-primary">
          {{ t('importedServices') }}
          <span class="text-text-tertiary font-normal ml-1"
            >({{ peering.ImportedServices?.length || 0 }})</span
          >
        </h2>
        <div v-if="peering.ImportedServices?.length" class="flex flex-wrap gap-2">
          <span v-for="svc in peering.ImportedServices" :key="svc" class="badge badge-primary">
            {{ svc }}
          </span>
        </div>
        <p v-else class="text-xs text-text-tertiary">-</p>
      </div>

      <!-- Exported Services -->
      <div class="card p-5 space-y-3">
        <h2 class="text-sm font-bold text-text-primary">
          {{ t('exportedServices') }}
          <span class="text-text-tertiary font-normal ml-1"
            >({{ peering.ExportedServices?.length || 0 }})</span
          >
        </h2>
        <div v-if="peering.ExportedServices?.length" class="flex flex-wrap gap-2">
          <span v-for="svc in peering.ExportedServices" :key="svc" class="badge badge-info">
            {{ svc }}
          </span>
        </div>
        <p v-else class="text-xs text-text-tertiary">-</p>
      </div>

      <!-- Server Addresses -->
      <div class="card p-5 space-y-3">
        <h2 class="text-sm font-bold text-text-primary">{{ t('peerAddresses') }}</h2>
        <div v-if="peering.PeerServerAddresses?.length" class="space-y-1">
          <p
            v-for="addr in peering.PeerServerAddresses"
            :key="addr"
            class="text-sm font-mono text-text-primary"
          >
            {{ addr }}
          </p>
        </div>
        <p v-else class="text-xs text-text-tertiary">-</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { ConsulPeering, ConsulPeeringState } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const peering = ref<ConsulPeering | null>(null)

function stateClass(state: ConsulPeeringState): string {
  switch (state) {
    case 'ACTIVE':
      return 'badge badge-success'
    case 'PENDING':
    case 'ESTABLISHING':
      return 'badge badge-warning'
    case 'FAILING':
    case 'DELETING':
      return 'badge badge-danger'
    case 'TERMINATED':
      return 'badge badge-secondary'
    default:
      return 'badge badge-secondary'
  }
}

function stateLabel(state: ConsulPeeringState): string {
  switch (state) {
    case 'PENDING':
      return t('peerStatePending')
    case 'ESTABLISHING':
      return t('peerStateEstablishing')
    case 'ACTIVE':
      return t('peerStateActive')
    case 'FAILING':
      return t('peerStateFailing')
    case 'TERMINATED':
      return t('peerStateTerminated')
    case 'DELETING':
      return t('peerStateDeleting')
    default:
      return state
  }
}

function formatTime(time?: string): string {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString()
  } catch {
    return time
  }
}

async function loadData() {
  const name = route.params.name as string
  loading.value = true
  try {
    const response = await consulApi.getPeering(name)
    peering.value = response.data
  } catch (error) {
    logger.error('Failed to fetch peering detail:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

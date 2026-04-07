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
            {{ t('instanceDetail') }}: {{ serviceName }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('serviceId') }}: {{ serviceId }}</p>
        </div>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !instanceNode" class="card">
      <div class="p-6 text-center">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-fuchsia-600" />
        <p class="text-sm text-text-secondary mt-2">{{ t('loading') }}</p>
      </div>
    </div>

    <template v-if="instanceNode">
      <!-- Instance Info Header -->
      <div class="card">
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ serviceName }}</h2>
              <p class="text-sm text-text-secondary mt-1">
                {{ t('node') }}: {{ instanceNode.Node.Node }} &middot;
                {{ instanceNode.Service.Address || instanceNode.Node.Address }}:{{
                  instanceNode.Service.Port
                }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="instanceNode.Checks && instanceNode.Checks.length > 0">
                <span
                  v-for="check in instanceNode.Checks"
                  :key="check.CheckID"
                  :class="statusBadgeClass(check.Status)"
                  class="badge"
                >
                  {{ check.Status }}
                </span>
              </template>
              <span v-else class="text-xs text-text-tertiary">-</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="flex gap-1 p-1 bg-bg-secondary rounded-xl">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
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

      <!-- Health Checks Tab -->
      <div v-show="activeTab === 'healthchecks'" class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('healthChecks') }} ({{ instanceChecks.length }})
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('checkName') }}</th>
                <th>{{ t('checkStatus') }}</th>
                <th>{{ t('checkOutput') }}</th>
                <th>{{ t('checkType') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="instanceChecks.length === 0">
                <td colspan="4" class="text-center py-6 text-text-secondary">
                  {{ t('noHealthChecks') }}
                </td>
              </tr>
              <tr
                v-for="check in instanceChecks"
                :key="check.CheckID"
                class="hover:bg-bg-secondary"
              >
                <td class="font-medium text-text-primary text-xs">{{ check.CheckID }}</td>
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
      </div>

      <!-- Metadata Tab -->
      <div v-show="activeTab === 'metadata'" class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('metadata') }}</h3>
        </div>
        <div class="p-6 space-y-6">
          <!-- Service Metadata Key-Value Pairs -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('metadata') }}
            </label>
            <div
              v-if="serviceMeta && Object.keys(serviceMeta).length > 0"
              class="grid grid-cols-1 md:grid-cols-2 gap-2"
            >
              <div
                v-for="(val, key) in serviceMeta"
                :key="key"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary">{{ key }}:</span>
                <span class="text-sm text-text-primary">{{ val }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-text-tertiary">{{ t('noData') }}</p>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('tags') }}
            </label>
            <div v-if="serviceTags.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="tag in serviceTags"
                :key="tag"
                class="px-3 py-1.5 text-sm font-medium rounded-xl bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
              >
                {{ tag }}
              </span>
            </div>
            <p v-else class="text-xs text-text-tertiary">{{ t('noTags') }}</p>
          </div>

          <!-- Enable Tag Override -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('enableTagOverride') }}
            </label>
            <span
              :class="
                instanceNode.Service.EnableTagOverride
                  ? 'badge badge-success'
                  : 'badge badge-default'
              "
            >
              {{ instanceNode.Service.EnableTagOverride ? t('enabled') : t('disabled') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Addresses Tab -->
      <div v-show="activeTab === 'addresses'" class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('addresses') }}</h3>
        </div>
        <div class="p-6 space-y-6">
          <!-- Service Address & Port -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('serviceAddress') }}
              </label>
              <p class="text-sm text-text-primary font-mono">
                {{ instanceNode.Service.Address || '-' }}
              </p>
            </div>
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('servicePort') }}
              </label>
              <p class="text-sm text-text-primary font-mono">
                {{ instanceNode.Service.Port }}
              </p>
            </div>
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('nodeAddress') }}
              </label>
              <p class="text-sm text-text-primary font-mono">
                {{ instanceNode.Node.Address }}
              </p>
            </div>
          </div>

          <!-- Tagged Addresses -->
          <div v-if="serviceTaggedAddresses && Object.keys(serviceTaggedAddresses).length > 0">
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('taggedAddresses') }}
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="(addr, key) in serviceTaggedAddresses"
                :key="key"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary uppercase">{{ key }}:</span>
                <span class="text-sm text-text-primary font-mono">
                  {{ typeof addr === 'object' ? JSON.stringify(addr) : addr }}
                </span>
              </div>
            </div>
          </div>

          <!-- Proxy Configuration -->
          <div v-if="instanceNode.Service.Proxy">
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('proxyConfig') }}
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-if="instanceNode.Service.Proxy.DestinationServiceName"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary">Destination Service:</span>
                <span class="text-sm text-text-primary">
                  {{ instanceNode.Service.Proxy.DestinationServiceName }}
                </span>
              </div>
              <div
                v-if="instanceNode.Service.Proxy.LocalServiceAddress"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary">Local Service Address:</span>
                <span class="text-sm text-text-primary font-mono">
                  {{ instanceNode.Service.Proxy.LocalServiceAddress }}:{{
                    instanceNode.Service.Proxy.LocalServicePort
                  }}
                </span>
              </div>
              <div
                v-if="instanceNode.Service.Proxy.Mode"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary">Mode:</span>
                <span class="text-sm text-text-primary">
                  {{ instanceNode.Service.Proxy.Mode }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upstream Tab -->
      <div v-show="activeTab === 'upstream'" class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('upstream') }}
            <span class="text-text-tertiary font-normal"> ({{ proxyUpstreams.length }}) </span>
          </h3>
        </div>
        <div class="p-4 space-y-2">
          <div v-if="proxyUpstreams.length === 0" class="text-center py-6 text-text-tertiary">
            <GitBranch class="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p class="text-xs">{{ t('noUpstreams') }}</p>
          </div>
          <div
            v-for="(up, idx) in proxyUpstreams"
            :key="idx"
            class="p-3 rounded-xl border border-border hover:bg-bg-secondary transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-medium text-text-primary">
                  {{ up.DestinationName || '-' }}
                </span>
                <span
                  v-if="up.DestinationType"
                  class="ml-2 badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px]"
                >
                  {{ up.DestinationType }}
                </span>
              </div>
              <span v-if="up.LocalBindPort" class="text-xs text-text-tertiary font-mono">
                {{ up.LocalBindAddress || '127.0.0.1' }}:{{ up.LocalBindPort }}
              </span>
            </div>
            <div v-if="up.DestinationNamespace" class="text-xs text-text-tertiary mt-1">
              {{ t('namespace') }}: {{ up.DestinationNamespace }}
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
import { ArrowLeft, RefreshCw, Loader2, GitBranch } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'
import type { ConsulServiceNode, ConsulHealthCheck, ConsulHealthStatus } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const serviceName = computed(() => (route.params.name as string) || '')
const nodeName = computed(() => (route.query.node as string) || '')
const serviceId = computed(() => (route.query.serviceId as string) || '')
const instanceNode = ref<ConsulServiceNode | null>(null)

// Tabs
type TabKey = 'healthchecks' | 'metadata' | 'addresses' | 'upstream'
const activeTab = ref<TabKey>('healthchecks')
const tabs = computed(() => [
  { key: 'healthchecks' as TabKey, label: t('healthChecks') },
  { key: 'metadata' as TabKey, label: t('metadata') },
  { key: 'addresses' as TabKey, label: t('addresses') },
  { key: 'upstream' as TabKey, label: t('upstream') },
])

// Computed
const instanceChecks = computed<ConsulHealthCheck[]>(() => {
  return instanceNode.value?.Checks || []
})

const serviceMeta = computed(() => {
  return instanceNode.value?.Service.Meta || null
})

const serviceTags = computed(() => {
  return instanceNode.value?.Service.Tags || []
})

const serviceTaggedAddresses = computed(() => {
  return instanceNode.value?.Service.TaggedAddresses || null
})

const proxyUpstreams = computed(() => {
  return instanceNode.value?.Service.Proxy?.Upstreams || []
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

const fetchInstanceDetail = async () => {
  if (!serviceName.value) return
  loading.value = true
  try {
    const dc = consulStore.currentDc || undefined
    const response = await consulApi.getHealthService(serviceName.value, dc)
    const nodes = response.data || []

    // Find the specific instance by matching node name and service ID
    instanceNode.value =
      nodes.find((n) => n.Node.Node === nodeName.value && n.Service.ID === serviceId.value) ||
      nodes.find((n) => n.Service.ID === serviceId.value) ||
      null
  } catch (err) {
    logger.error('Failed to fetch service instance detail:', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  fetchInstanceDetail()
}

const goBack = () => {
  router.push({ name: 'consul-service-detail', params: { name: serviceName.value } })
}

// Lifecycle
onMounted(() => {
  fetchInstanceDetail()
})
</script>

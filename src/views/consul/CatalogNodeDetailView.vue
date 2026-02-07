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
              <p class="text-sm text-text-primary font-mono">{{ nodeData.Node.ID }}</p>
            </div>
            <!-- Node Name -->
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('nodeName') }}
              </label>
              <p class="text-sm text-text-primary font-medium">{{ nodeData.Node.Node }}</p>
            </div>
            <!-- Address -->
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('address') }}
              </label>
              <p class="text-sm text-text-primary font-mono">{{ nodeData.Node.Address }}</p>
            </div>
            <!-- Datacenter -->
            <div>
              <label
                class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1"
              >
                {{ t('datacenter') }}
              </label>
              <span
                class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
              >
                {{ nodeData.Node.Datacenter }}
              </span>
            </div>
          </div>

          <!-- Tagged Addresses -->
          <div
            v-if="
              nodeData.Node.TaggedAddresses && Object.keys(nodeData.Node.TaggedAddresses).length > 0
            "
            class="mt-6"
          >
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('taggedAddresses') }}
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="(addr, key) in nodeData.Node.TaggedAddresses"
                :key="key"
                class="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-xl"
              >
                <span class="text-xs font-bold text-text-tertiary uppercase">{{ key }}:</span>
                <span class="text-sm text-text-primary font-mono">{{ addr }}</span>
              </div>
            </div>
          </div>

          <!-- Meta -->
          <div v-if="nodeData.Node.Meta && Object.keys(nodeData.Node.Meta).length > 0" class="mt-6">
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {{ t('meta') }}
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="(val, key) in nodeData.Node.Meta"
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

      <!-- Services Table -->
      <div class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('nodeServices') }} ({{ serviceList.length }})
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('serviceName') }}</th>
                <th>{{ t('serviceId') }}</th>
                <th>{{ t('servicePort') }}</th>
                <th>{{ t('serviceTags') }}</th>
                <th class="w-32">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="serviceList.length === 0">
                <td colspan="5" class="text-center py-6 text-text-secondary">
                  {{ t('noServices') }}
                </td>
              </tr>
              <tr v-for="svc in serviceList" :key="svc.ServiceID" class="hover:bg-bg-secondary">
                <td>
                  <router-link
                    :to="{
                      name: 'consul-catalog-service-detail',
                      params: { name: svc.ServiceName },
                    }"
                    class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                  >
                    {{ svc.ServiceName }}
                  </router-link>
                </td>
                <td class="text-text-secondary text-xs">{{ svc.ServiceID }}</td>
                <td>{{ svc.ServicePort }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in (svc.ServiceTags || []).slice(0, 3)"
                      :key="tag"
                      class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                    >
                      {{ tag }}
                    </span>
                    <span
                      v-if="svc.ServiceTags && svc.ServiceTags.length > 3"
                      class="badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    >
                      +{{ svc.ServiceTags.length - 3 }}
                    </span>
                    <span
                      v-if="!svc.ServiceTags || svc.ServiceTags.length === 0"
                      class="text-xs text-text-tertiary"
                    >
                      {{ t('noTags') }}
                    </span>
                  </div>
                </td>
                <td>
                  <router-link
                    :to="{
                      name: 'consul-catalog-service-detail',
                      params: { name: svc.ServiceName },
                    }"
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
      </div>

      <!-- Health Checks -->
      <div class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('healthChecksList') }} ({{ nodeHealthChecks.length }})
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('checkId') }}</th>
                <th>{{ t('serviceName') }}</th>
                <th>{{ t('status') }}</th>
                <th>{{ t('output') }}</th>
                <th>{{ t('type') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="nodeHealthChecks.length === 0">
                <td colspan="5" class="text-center py-6 text-text-secondary">
                  {{ t('noHealthChecks') }}
                </td>
              </tr>
              <tr
                v-for="check in nodeHealthChecks"
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
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, RefreshCw, Loader2, Eye } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import type {
  ConsulNode,
  ConsulServiceNode,
  ConsulHealthCheck,
  ConsulHealthStatus,
} from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// State
const loading = ref(false)
const nodeName = computed(() => (route.params.name as string) || '')
const nodeData = ref<{ Node: ConsulNode; Services: Record<string, ConsulServiceNode> } | null>(null)
const nodeHealthChecks = ref<ConsulHealthCheck[]>([])

// Computed
const serviceList = computed<ConsulServiceNode[]>(() => {
  if (!nodeData.value?.Services) return []
  return Object.values(nodeData.value.Services)
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

const fetchNodeDetail = async () => {
  if (!nodeName.value) return
  loading.value = true
  try {
    const response = await consulApi.getCatalogNode(nodeName.value)
    nodeData.value = response.data

    // Fetch health checks for this node
    await fetchNodeHealthChecks()
  } catch (err) {
    console.error('Failed to fetch node detail:', err)
  } finally {
    loading.value = false
  }
}

const fetchNodeHealthChecks = async () => {
  try {
    // Fetch all health checks and filter by node
    const response = await consulApi.getHealthState('any')
    const allChecks = response.data || []
    nodeHealthChecks.value = allChecks.filter((check) => check.Node === nodeName.value)
  } catch {
    // Silently ignore
  }
}

const handleRefresh = () => {
  fetchNodeDetail()
}

const goBack = () => {
  router.push({ name: 'consul-catalog-nodes' })
}

// Lifecycle
onMounted(() => {
  fetchNodeDetail()
})
</script>

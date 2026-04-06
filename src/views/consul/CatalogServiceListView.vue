<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('catalogServices') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('catalogServicesDesc') }}</p>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2">
          <!-- Search -->
          <div class="md:col-span-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10"
                :placeholder="t('searchServices')"
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
              <option value="empty">{{ t('consulFilterEmpty') }}</option>
            </select>
          </div>
          <!-- Kind Filter -->
          <div>
            <select v-model="kindFilter" class="input">
              <option value="">{{ t('consulFilterByKind') }}</option>
              <option value="service">{{ t('consulServiceKindService') }}</option>
              <option value="ingress-gateway">{{ t('consulServiceKindIngressGateway') }}</option>
              <option value="terminating-gateway">
                {{ t('consulServiceKindTerminatingGateway') }}
              </option>
              <option value="mesh-gateway">{{ t('consulServiceKindMeshGateway') }}</option>
              <option value="api-gateway">{{ t('consulServiceKindApiGateway') }}</option>
            </select>
          </div>
          <!-- Sort -->
          <div>
            <select v-model="sortBy" class="input">
              <option value="status">{{ t('sortBy') }}: {{ t('consulSortByStatus') }}</option>
              <option value="name">{{ t('sortBy') }}: {{ t('consulSortByName') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('healthStatus') }}</th>
              <th>{{ t('serviceName') }}</th>
              <th>{{ t('consulServiceKind') }}</th>
              <th>{{ t('instanceCount') }}</th>
              <th>{{ t('consulExternalSource') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-fuchsia-600" />
              </td>
            </tr>
            <tr v-else-if="sortedServices.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noServices') }}
              </td>
            </tr>
            <tr v-for="svc in sortedServices" :key="svc.Name" class="hover:bg-bg-secondary">
              <!-- Health Status -->
              <td>
                <span :class="healthBadgeClass(getServiceHealthStatus(svc))">
                  {{ healthStatusLabel(getServiceHealthStatus(svc)) }}
                </span>
              </td>
              <!-- Service Name + Tags + Mesh Badge -->
              <td>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <router-link
                      v-if="svc.InstanceCount > 0"
                      :to="{ name: 'consul-service-detail', params: { name: svc.Name } }"
                      class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                    >
                      {{ svc.Name }}
                    </router-link>
                    <span v-else class="font-medium text-text-primary">
                      {{ svc.Name }}
                    </span>
                    <!-- Mesh Badges -->
                    <span
                      v-if="svc.ConnectedWithProxy"
                      class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 text-[10px]"
                    >
                      {{ t('consulInMeshProxy') }}
                    </span>
                    <span
                      v-else-if="svc.ConnectedWithGateway"
                      class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 text-[10px]"
                    >
                      {{ t('consulInMeshGateway') }}
                    </span>
                  </div>
                  <!-- Tags preview -->
                  <div v-if="svc.Tags && svc.Tags.length > 0" class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in svc.Tags.slice(0, 3)"
                      :key="tag"
                      class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="svc.Tags.length > 3" class="text-[10px] text-text-tertiary">
                      +{{ svc.Tags.length - 3 }}
                    </span>
                  </div>
                </div>
              </td>
              <!-- Kind -->
              <td>
                <span
                  v-if="svc.Kind"
                  class="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs"
                >
                  {{ formatKind(svc.Kind) }}
                </span>
                <span v-else class="text-xs text-text-tertiary">{{
                  t('consulServiceKindService')
                }}</span>
              </td>
              <!-- Instance Count -->
              <td>
                <span class="font-medium text-text-primary">{{ svc.InstanceCount }}</span>
              </td>
              <!-- External Source -->
              <td>
                <div
                  v-if="svc.ExternalSources && svc.ExternalSources.length > 0"
                  class="flex flex-wrap gap-1"
                >
                  <span
                    v-for="source in svc.ExternalSources"
                    :key="source"
                    class="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs"
                  >
                    {{ source }}
                  </span>
                </div>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <!-- Actions -->
              <td>
                <router-link
                  v-if="svc.InstanceCount > 0"
                  :to="{ name: 'consul-service-detail', params: { name: svc.Name } }"
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
          {{ t('total') }}: {{ sortedServices.length }} {{ t('items') }}
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
import { logger } from '@/utils/logger'
import type { ConsulUIServiceSummary, ConsulServiceKind } from '@/types/consul'

const { t } = useI18n()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const kindFilter = ref('')
const sortBy = ref('status')

// Health status helpers
type ServiceHealthStatus = 'critical' | 'warning' | 'passing' | 'empty'

const getServiceHealthStatus = (svc: ConsulUIServiceSummary): ServiceHealthStatus => {
  if (svc.ChecksCritical > 0) return 'critical'
  if (svc.ChecksWarning > 0) return 'warning'
  if (svc.ChecksPassing > 0) return 'passing'
  return 'empty'
}

const healthStatusLabel = (status: ServiceHealthStatus): string => {
  const map: Record<ServiceHealthStatus, string> = {
    critical: t('critical'),
    warning: t('warning'),
    passing: t('passing'),
    empty: t('consulFilterEmpty'),
  }
  return map[status]
}

const healthBadgeClass = (status: ServiceHealthStatus): string => {
  const map: Record<ServiceHealthStatus, string> = {
    critical: 'badge bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    warning: 'badge bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    passing: 'badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    empty: 'badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  }
  return map[status]
}

const formatKind = (kind: ConsulServiceKind): string => {
  const map: Record<string, string> = {
    'connect-proxy': t('consulServiceKindConnectProxy'),
    'mesh-gateway': t('consulServiceKindMeshGateway'),
    'terminating-gateway': t('consulServiceKindTerminatingGateway'),
    'ingress-gateway': t('consulServiceKindIngressGateway'),
    'api-gateway': t('consulServiceKindApiGateway'),
  }
  return map[kind] || kind
}

// Filtered services
const filteredServices = computed(() => {
  let services = consulStore.uiServices

  // Search filter (by Name, Tags)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    services = services.filter((svc) => {
      if (svc.Name.toLowerCase().includes(query)) return true
      if (svc.Tags?.some((tag) => tag.toLowerCase().includes(query))) return true
      if (svc.PeerName?.toLowerCase().includes(query)) return true
      return false
    })
  }

  // Status filter
  if (statusFilter.value) {
    services = services.filter((svc) => getServiceHealthStatus(svc) === statusFilter.value)
  }

  // Kind filter
  if (kindFilter.value) {
    if (kindFilter.value === 'service') {
      services = services.filter((svc) => !svc.Kind)
    } else {
      services = services.filter((svc) => svc.Kind === kindFilter.value)
    }
  }

  return services
})

// Sorted services
const sortedServices = computed(() => {
  const services = [...filteredServices.value]

  switch (sortBy.value) {
    case 'status': {
      const priority: Record<string, number> = { critical: 0, warning: 1, passing: 2, empty: 3 }
      services.sort(
        (a, b) =>
          (priority[getServiceHealthStatus(a)] ?? 3) - (priority[getServiceHealthStatus(b)] ?? 3),
      )
      break
    }
    case 'name':
      services.sort((a, b) => a.Name.localeCompare(b.Name))
      break
  }

  return services
})

// Data fetching
const fetchServices = async () => {
  loading.value = true
  try {
    await consulStore.fetchUIServices()
  } catch (err) {
    logger.error('Failed to fetch catalog services:', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  fetchServices()
}

// Lifecycle
onMounted(() => {
  fetchServices()
})
</script>

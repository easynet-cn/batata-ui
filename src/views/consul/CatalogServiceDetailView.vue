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
            {{ t('serviceDetail') }}: {{ serviceName }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('backToServices') }}</p>
        </div>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && serviceNodes.length === 0" class="card">
      <div class="p-6 text-center">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-fuchsia-600" />
        <p class="text-sm text-text-secondary mt-2">{{ t('loading') }}</p>
      </div>
    </div>

    <template v-else>
      <!-- Service Info Header -->
      <div class="card">
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-extrabold text-text-primary">{{ serviceName }}</h2>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="tag in serviceTags"
                  :key="tag"
                  class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                >
                  {{ tag }}
                </span>
                <span v-if="serviceTags.length === 0" class="text-xs text-text-tertiary">
                  {{ t('noTags') }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-success">
                {{ healthSummary.passing }} {{ t('passing') }}
              </span>
              <span v-if="healthSummary.warning > 0" class="badge badge-warning">
                {{ healthSummary.warning }} {{ t('warning') }}
              </span>
              <span v-if="healthSummary.critical > 0" class="badge badge-danger">
                {{ healthSummary.critical }} {{ t('critical') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Instances Table -->
      <div class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('serviceInstances') }} ({{ serviceNodes.length }})
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('node') }}</th>
                <th>{{ t('address') }}</th>
                <th>{{ t('servicePort') }}</th>
                <th>{{ t('serviceId') }}</th>
                <th>{{ t('healthStatus') }}</th>
                <th class="w-32">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="serviceNodes.length === 0">
                <td colspan="6" class="text-center py-6 text-text-secondary">
                  {{ t('noInstances') }}
                </td>
              </tr>
              <tr v-for="node in serviceNodes" :key="node.ServiceID" class="hover:bg-bg-secondary">
                <td class="font-medium text-text-primary">{{ node.Node }}</td>
                <td class="text-text-secondary font-mono text-xs">
                  {{ node.ServiceAddress || node.Address }}
                </td>
                <td>{{ node.ServicePort }}</td>
                <td class="text-text-secondary text-xs">{{ node.ServiceID }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <template v-if="node.Checks && node.Checks.length > 0">
                      <span
                        v-for="check in node.Checks"
                        :key="check.CheckID"
                        :class="statusBadgeClass(check.Status)"
                        class="badge"
                      >
                        {{ check.Status }}
                      </span>
                    </template>
                    <span v-else class="text-xs text-text-tertiary">-</span>
                  </div>
                </td>
                <td>
                  <button
                    @click="toggleNodeDetail(node.ServiceID)"
                    class="btn btn-ghost btn-sm"
                    :title="t('viewDetails')"
                  >
                    <ChevronDown
                      class="w-3.5 h-3.5 transition-transform"
                      :class="{ 'rotate-180': expandedNodes.has(node.ServiceID) }"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Health Checks Section -->
      <div class="card">
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ t('healthChecksList') }} ({{ allHealthChecks.length }})
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('checkId') }}</th>
                <th>{{ t('node') }}</th>
                <th>{{ t('status') }}</th>
                <th>{{ t('output') }}</th>
                <th>{{ t('type') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="allHealthChecks.length === 0">
                <td colspan="5" class="text-center py-6 text-text-secondary">
                  {{ t('noHealthChecks') }}
                </td>
              </tr>
              <tr
                v-for="check in allHealthChecks"
                :key="`${check.Node}-${check.CheckID}`"
                class="hover:bg-bg-secondary"
              >
                <td class="font-medium text-text-primary text-xs">{{ check.CheckID }}</td>
                <td class="text-text-secondary">{{ check.Node }}</td>
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
import { ArrowLeft, RefreshCw, Loader2, ChevronDown } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import type { ConsulServiceNode, ConsulHealthCheck, ConsulHealthStatus } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// State
const loading = ref(false)
const serviceName = computed(() => (route.params.name as string) || '')
const serviceNodes = ref<ConsulServiceNode[]>([])
const expandedNodes = ref<Set<string>>(new Set())

// Computed
const serviceTags = computed(() => {
  const tags = new Set<string>()
  for (const node of serviceNodes.value) {
    if (node.ServiceTags) {
      for (const tag of node.ServiceTags) {
        tags.add(tag)
      }
    }
  }
  return Array.from(tags)
})

const allHealthChecks = computed<ConsulHealthCheck[]>(() => {
  const checks: ConsulHealthCheck[] = []
  for (const node of serviceNodes.value) {
    if (node.Checks) {
      checks.push(...node.Checks)
    }
  }
  return checks
})

const healthSummary = computed(() => {
  let passing = 0
  let warning = 0
  let critical = 0
  for (const check of allHealthChecks.value) {
    if (check.Status === 'passing') passing++
    else if (check.Status === 'warning') warning++
    else if (check.Status === 'critical') critical++
  }
  return { passing, warning, critical }
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

const toggleNodeDetail = (serviceId: string) => {
  if (expandedNodes.value.has(serviceId)) {
    expandedNodes.value.delete(serviceId)
  } else {
    expandedNodes.value.add(serviceId)
  }
}

const fetchServiceDetail = async () => {
  if (!serviceName.value) return
  loading.value = true
  try {
    // Use health endpoint to get nodes with checks
    const response = await consulApi.getHealthService(serviceName.value)
    serviceNodes.value = response.data || []
  } catch (err) {
    console.error('Failed to fetch service detail:', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  fetchServiceDetail()
}

const goBack = () => {
  router.push({ name: 'consul-catalog-services' })
}

// Lifecycle
onMounted(() => {
  fetchServiceDetail()
})
</script>

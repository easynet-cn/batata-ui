<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('healthChecks') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('healthChecksDesc') }}</p>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm" :disabled="loading">
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-1">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            @click="activeFilter = tab.value"
            class="px-4 py-2 text-sm font-bold rounded-xl transition-colors"
            :class="
              activeFilter === tab.value
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
            "
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              class="ml-1.5 px-1.5 py-0.5 text-xs rounded-md"
              :class="
                activeFilter === tab.value
                  ? 'bg-white/20 text-white'
                  : 'bg-bg-tertiary text-text-tertiary'
              "
            >
              {{ tab.count }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Health Checks Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('checkId') }}</th>
              <th>{{ t('node') }}</th>
              <th>{{ t('service') }}</th>
              <th>{{ t('status') }}</th>
              <th>{{ t('output') }}</th>
              <th>{{ t('type') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-fuchsia-600" />
              </td>
            </tr>
            <tr v-else-if="filteredChecks.length === 0">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                {{ t('noHealthChecks') }}
              </td>
            </tr>
            <tr
              v-for="check in filteredChecks"
              :key="`${check.Node}-${check.CheckID}`"
              class="hover:bg-bg-secondary"
            >
              <td class="font-medium text-text-primary text-xs">
                {{ check.CheckID }}
              </td>
              <td>
                <router-link
                  :to="{ name: 'consul-catalog-node-detail', params: { name: check.Node } }"
                  class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                >
                  {{ check.Node }}
                </router-link>
              </td>
              <td>
                <template v-if="check.ServiceName">
                  <router-link
                    :to="{
                      name: 'consul-catalog-service-detail',
                      params: { name: check.ServiceName },
                    }"
                    class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                  >
                    {{ check.ServiceName }}
                  </router-link>
                </template>
                <span v-else class="text-text-tertiary">-</span>
              </td>
              <td>
                <span :class="statusBadgeClass(check.Status)" class="badge">
                  {{ statusLabel(check.Status) }}
                </span>
              </td>
              <td>
                <span
                  class="text-xs text-text-secondary max-w-xs block"
                  :class="{ truncate: !expandedOutputs.has(`${check.Node}-${check.CheckID}`) }"
                >
                  {{ check.Output || '-' }}
                </span>
                <button
                  v-if="check.Output && check.Output.length > 60"
                  @click="toggleOutput(`${check.Node}-${check.CheckID}`)"
                  class="text-xs text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 mt-0.5"
                >
                  {{
                    expandedOutputs.has(`${check.Node}-${check.CheckID}`)
                      ? t('close')
                      : t('viewDetails')
                  }}
                </button>
              </td>
              <td class="text-text-secondary text-xs">{{ check.Type || '-' }}</td>
              <td>
                <button
                  @click="showCheckDetail(check)"
                  class="btn btn-ghost btn-sm"
                  :title="t('viewDetails')"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ filteredChecks.length }} {{ t('items') }}
        </div>
      </div>
    </div>

    <!-- Check Detail Modal -->
    <div v-if="detailCheck" class="modal-backdrop" @click="detailCheck = null">
      <div class="modal max-w-lg" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('details') }}</h3>
          <button @click="detailCheck = null" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
              {{ t('checkId') }}
            </label>
            <p class="text-sm text-text-primary font-mono">{{ detailCheck.CheckID }}</p>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
              {{ t('node') }}
            </label>
            <p class="text-sm text-text-primary">{{ detailCheck.Node }}</p>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
              {{ t('service') }}
            </label>
            <p class="text-sm text-text-primary">{{ detailCheck.ServiceName || '-' }}</p>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
              {{ t('status') }}
            </label>
            <span :class="statusBadgeClass(detailCheck.Status)" class="badge">
              {{ statusLabel(detailCheck.Status) }}
            </span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
              {{ t('type') }}
            </label>
            <p class="text-sm text-text-primary">{{ detailCheck.Type || '-' }}</p>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
              {{ t('output') }}
            </label>
            <pre
              class="text-xs text-text-secondary bg-bg-secondary rounded-xl p-3 whitespace-pre-wrap break-words max-h-48 overflow-auto"
              >{{ detailCheck.Output || '-' }}</pre
            >
          </div>
          <div v-if="detailCheck.Notes">
            <label class="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
              Notes
            </label>
            <p class="text-sm text-text-secondary">{{ detailCheck.Notes }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="detailCheck = null" class="btn btn-secondary">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, Eye, Loader2, X } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import type { ConsulHealthCheck, ConsulHealthStatus } from '@/types/consul'

const { t } = useI18n()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const activeFilter = ref<string>('any')
const expandedOutputs = ref<Set<string>>(new Set())
const detailCheck = ref<ConsulHealthCheck | null>(null)

// Filter tabs
const filterTabs = computed(() => [
  { label: t('consulFilterAll'), value: 'any', count: allChecks.value.length },
  { label: t('consulFilterPassing'), value: 'passing', count: countByStatus('passing') },
  { label: t('consulFilterWarning'), value: 'warning', count: countByStatus('warning') },
  { label: t('consulFilterCritical'), value: 'critical', count: countByStatus('critical') },
])

// All checks fetched
const allChecks = ref<ConsulHealthCheck[]>([])

// Computed
const filteredChecks = computed(() => {
  if (activeFilter.value === 'any') return allChecks.value
  return allChecks.value.filter((check) => check.Status === activeFilter.value)
})

// Methods
const countByStatus = (status: string): number => {
  return allChecks.value.filter((check) => check.Status === status).length
}

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

const statusLabel = (status: ConsulHealthStatus): string => {
  switch (status) {
    case 'passing':
      return t('passing')
    case 'warning':
      return t('warning')
    case 'critical':
      return t('critical')
    case 'maintenance':
      return t('maintenance')
    default:
      return status
  }
}

const toggleOutput = (key: string) => {
  if (expandedOutputs.value.has(key)) {
    expandedOutputs.value.delete(key)
  } else {
    expandedOutputs.value.add(key)
  }
}

const showCheckDetail = (check: ConsulHealthCheck) => {
  detailCheck.value = check
}

const fetchHealthChecks = async () => {
  loading.value = true
  try {
    // Always fetch all states so we can show counts per tab
    const result = await consulStore.fetchHealthChecks('any')
    allChecks.value = result || []
  } catch (err) {
    console.error('Failed to fetch health checks:', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  fetchHealthChecks()
}

// Lifecycle
onMounted(() => {
  fetchHealthChecks()
})
</script>

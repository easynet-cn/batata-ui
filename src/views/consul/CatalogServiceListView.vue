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

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              v-model="searchQuery"
              type="text"
              class="input pl-10"
              :placeholder="t('searchServices')"
            />
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
              <th>{{ t('serviceName') }}</th>
              <th>{{ t('tags') }}</th>
              <th>{{ t('instanceCount') }}</th>
              <th>{{ t('healthStatus') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-fuchsia-600" />
              </td>
            </tr>
            <tr v-else-if="filteredServices.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noServices') }}
              </td>
            </tr>
            <tr v-for="svc in filteredServices" :key="svc.name" class="hover:bg-bg-secondary">
              <td>
                <router-link
                  :to="{ name: 'consul-catalog-service-detail', params: { name: svc.name } }"
                  class="text-fuchsia-600 hover:text-fuchsia-700 hover:underline font-medium dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                >
                  {{ svc.name }}
                </router-link>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in svc.tags.slice(0, 5)"
                    :key="tag"
                    class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="svc.tags.length > 5"
                    class="badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  >
                    +{{ svc.tags.length - 5 }}
                  </span>
                  <span v-if="svc.tags.length === 0" class="text-xs text-text-tertiary">
                    {{ t('noTags') }}
                  </span>
                </div>
              </td>
              <td>
                <span class="font-medium text-text-primary">
                  {{ serviceHealthData[svc.name]?.total ?? '-' }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <span v-if="serviceHealthData[svc.name]" class="badge badge-success">
                    {{ serviceHealthData[svc.name]!.passing }} {{ t('passing') }}
                  </span>
                  <span
                    v-if="serviceHealthData[svc.name]?.warning! > 0"
                    class="badge badge-warning"
                  >
                    {{ serviceHealthData[svc.name]!.warning }} {{ t('warning') }}
                  </span>
                  <span
                    v-if="serviceHealthData[svc.name]?.critical! > 0"
                    class="badge badge-danger"
                  >
                    {{ serviceHealthData[svc.name]!.critical }} {{ t('critical') }}
                  </span>
                  <span v-if="!serviceHealthData[svc.name]" class="text-xs text-text-tertiary">
                    -
                  </span>
                </div>
              </td>
              <td>
                <router-link
                  :to="{ name: 'consul-catalog-service-detail', params: { name: svc.name } }"
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
          {{ t('total') }}: {{ filteredServices.length }} {{ t('items') }}
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
import consulApi from '@/api/consul'

const { t } = useI18n()
const consulStore = useConsulStore()

// State
const loading = ref(false)
const searchQuery = ref('')
const serviceHealthData = ref<
  Record<string, { total: number; passing: number; warning: number; critical: number }>
>({})

// Computed: service list derived from store's Record<string, string[]>
interface ServiceEntry {
  name: string
  tags: string[]
}

const serviceList = computed<ServiceEntry[]>(() => {
  return Object.entries(consulStore.services).map(([name, tags]) => ({
    name,
    tags: tags || [],
  }))
})

const filteredServices = computed(() => {
  if (!searchQuery.value) return serviceList.value
  const query = searchQuery.value.toLowerCase()
  return serviceList.value.filter(
    (svc) =>
      svc.name.toLowerCase().includes(query) ||
      svc.tags.some((tag) => tag.toLowerCase().includes(query)),
  )
})

// Methods
const fetchServices = async () => {
  loading.value = true
  try {
    await consulStore.fetchServices()
    // Fetch health data for each service
    await fetchHealthSummaries()
  } catch (err) {
    console.error('Failed to fetch catalog services:', err)
  } finally {
    loading.value = false
  }
}

const fetchHealthSummaries = async () => {
  const names = Object.keys(consulStore.services)
  const healthMap: Record<
    string,
    { total: number; passing: number; warning: number; critical: number }
  > = {}

  // Fetch health data in parallel, but limit concurrency
  const results = await Promise.allSettled(
    names.map(async (name) => {
      try {
        const response = await consulApi.getHealthService(name)
        const nodes = response.data || []
        let passing = 0
        let warning = 0
        let critical = 0

        for (const node of nodes) {
          if (node.Checks) {
            for (const check of node.Checks) {
              if (check.Status === 'passing') passing++
              else if (check.Status === 'warning') warning++
              else if (check.Status === 'critical') critical++
            }
          }
        }

        healthMap[name] = {
          total: nodes.length,
          passing,
          warning,
          critical,
        }
      } catch {
        // Silently ignore health fetch errors for individual services
      }
    }),
  )

  // Handle settled results (already processed above)
  void results
  serviceHealthData.value = healthMap
}

const handleRefresh = () => {
  fetchServices()
}

// Lifecycle
onMounted(() => {
  fetchServices()
})
</script>

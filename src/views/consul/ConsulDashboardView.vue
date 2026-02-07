<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('consulDashboard') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('consulDashboardDesc') }}
        </p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Services -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('totalServices') }}
            </p>
            <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {{ serviceCount }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <Server :size="24" class="text-fuchsia-500" />
          </div>
        </div>
      </div>

      <!-- Total Nodes -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('consulTotalNodes') }}
            </p>
            <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {{ consulStore.nodes.length }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <Network :size="24" class="text-fuchsia-500" />
          </div>
        </div>
      </div>

      <!-- Health Checks -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('consulHealthChecks') }}
            </p>
            <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {{ consulStore.healthChecks.length }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {{ passingCount }} {{ t('consulPassing') }}
              </span>
              <span
                v-if="warningCount > 0"
                class="text-xs font-medium text-amber-600 dark:text-amber-400"
              >
                {{ warningCount }} {{ t('consulWarning') }}
              </span>
              <span
                v-if="criticalCount > 0"
                class="text-xs font-medium text-red-600 dark:text-red-400"
              >
                {{ criticalCount }} {{ t('consulCritical') }}
              </span>
            </div>
          </div>
          <div
            class="w-12 h-12 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <HeartPulse :size="24" class="text-fuchsia-500" />
          </div>
        </div>
      </div>

      <!-- Datacenters -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('consulDatacenters') }}
            </p>
            <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              {{ consulStore.datacenters.length }}
            </p>
            <p
              v-if="consulStore.currentDc"
              class="text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 mt-1"
            >
              {{ t('current') }}: {{ consulStore.currentDc }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <Globe :size="24" class="text-fuchsia-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('quickActions') }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <RouterLink
          to="/consul/kv"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
        >
          <div
            class="w-8 h-8 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <Database :size="16" class="text-fuchsia-500" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('consulViewKVStore') }}
          </span>
        </RouterLink>

        <RouterLink
          to="/services"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
        >
          <div
            class="w-8 h-8 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <Server :size="16" class="text-fuchsia-500" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('consulViewServices') }}
          </span>
        </RouterLink>

        <RouterLink
          to="/cluster"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all"
        >
          <div
            class="w-8 h-8 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <Network :size="16" class="text-fuchsia-500" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('consulViewNodes') }}
          </span>
        </RouterLink>

        <button
          @click="refreshData"
          class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all text-left"
        >
          <div
            class="w-8 h-8 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg flex items-center justify-center"
          >
            <HeartPulse :size="16" class="text-fuchsia-500" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('consulViewHealth') }}
          </span>
        </button>
      </div>
    </div>

    <!-- Cluster Members Table -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ t('consulClusterMembers') }}
      </h3>

      <div
        v-if="consulStore.members.length === 0 && !loading"
        class="text-center py-8 text-gray-400 dark:text-gray-500"
      >
        <Network :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('noData') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('consulMemberName') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('consulMemberAddress') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('port') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('status') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('consulMemberRole') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in consulStore.members" :key="member.Name">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ member.Name }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ member.Addr }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ member.Port }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <span
                  :class="[
                    'px-2.5 py-1 text-xs font-bold rounded-lg',
                    memberStatusClass(member.Status),
                  ]"
                >
                  {{ memberStatusLabel(member.Status) }}
                </span>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ member.Tags?.role || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Server, Network, HeartPulse, Globe, Database, RefreshCw } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'

const { t } = useI18n()
const consulStore = useConsulStore()

const loading = ref(false)

const serviceCount = computed(() => Object.keys(consulStore.services).length)

const passingCount = computed(
  () => consulStore.healthChecks.filter((c) => c.Status === 'passing').length,
)
const warningCount = computed(
  () => consulStore.healthChecks.filter((c) => c.Status === 'warning').length,
)
const criticalCount = computed(
  () => consulStore.healthChecks.filter((c) => c.Status === 'critical').length,
)

// Member status helpers
function memberStatusClass(status: number): string {
  switch (status) {
    case 1:
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
    case 2:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    case 3:
      return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    case 4:
      return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
    default:
      return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

function memberStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return t('consulStatusAlive')
    case 2:
      return t('consulStatusLeaving')
    case 3:
      return t('consulStatusLeft')
    case 4:
      return t('consulStatusFailed')
    default:
      return t('consulStatusUnknown')
  }
}

// Data fetching
async function fetchData() {
  loading.value = true
  try {
    await Promise.allSettled([
      consulStore.fetchServices(),
      consulStore.fetchNodes(),
      consulStore.fetchHealthChecks(),
      consulStore.fetchMembers(),
      consulStore.fetchDatacenters(),
    ])
  } catch (err) {
    console.error('Failed to fetch consul dashboard data:', err)
  } finally {
    loading.value = false
  }
}

function refreshData() {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>
